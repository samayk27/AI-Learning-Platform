from fastapi import FastAPI, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, ValidationError
from gemini_utils import summarize_text, generate_quiz as gemini_generate_quiz
from nlp_analysis import difficulty_adjuster
from langchain_utils import get_document_qa
from models import SummaryRequest, QuizRequest, YouTubeRequest, Score
from PyPDF2 import PdfReader
from pdf2image import convert_from_bytes
import pytesseract
import io
import uvicorn
from typing import List
from youtube_transcript_api import YouTubeTranscriptApi
import re

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",    # Vite default
        "http://localhost:3000",    # Common React port
        "http://127.0.0.1:5173",   # Alternative Vite URL
        "http://127.0.0.1:3000",   # Alternative React URL
        "http://localhost:8000",    # Another common development port
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ScoresRequest(BaseModel):
    scores: List[Score]

# --- PDF/Text Summarizer ---
@app.post("/summarize/")
async def summarize_pdf(file: UploadFile):
    try:
        content = await file.read()
        
        if not file.filename.lower().endswith('.pdf'):
            return {"error": "File is not a valid PDF."}

        text = ""
        try:
            # First try to extract text using PyPDF2
            pdf_reader = PdfReader(io.BytesIO(content))
            for page in pdf_reader.pages:
                extracted = page.extract_text()
                if extracted:
                    text += extracted + "\n"

            # If no text was extracted, try OCR
            if not text.strip():
                images = convert_from_bytes(content)
                for image in images:
                    text += pytesseract.image_to_string(image) + "\n"

            if not text.strip():
                return {"error": "No readable text found in the document"}

            # Generate summary using the extracted text
            summary = summarize_text(text.strip())
            return {"summary": summary}

        except Exception as e:
            return {"error": f"Error processing PDF: {str(e)}"}

    except Exception as e:
        return {"error": f"Unexpected error: {str(e)}"}

def extract_video_id(url: str) -> str:
    """Extract YouTube video ID from various URL formats."""
    patterns = [
        r'(?:v=|/v/|youtu\.be/|/embed/)([^&?/]+)',  # Standard, shortened and embed URLs
        r'(?:youtube\.com/|youtu\.be/)(?:watch\?v=)?([^&?/]+)',  # Other variations
    ]
    
    for pattern in patterns:
        if match := re.search(pattern, url):
            return match.group(1)
    raise ValueError("Invalid YouTube URL")

def get_youtube_transcript(url: str) -> str:
    """Fetch and combine transcript from YouTube video."""
    try:
        video_id = extract_video_id(url)
        transcript_list = YouTubeTranscriptApi.list_transcripts(video_id)
        
        # Try to get English transcript
        try:
            transcript = transcript_list.find_transcript(['en'])
        except:
            # If English not available, get auto-translated version
            transcript = transcript_list.find_manually_created_transcript()
            transcript = transcript.translate('en')
        
        transcript_parts = transcript.fetch()
        return " ".join([part['text'] for part in transcript_parts])
        
    except Exception as e:
        raise ValueError(f"Failed to get transcript: {str(e)}")

# --- YouTube Transcript Notes ---
@app.post("/youtube-summary/")
async def youtube_notes(req: YouTubeRequest):
    try:
        if not req.transcript:
            return {"error": "Empty URL provided"}
            
        try:
            transcript_text = get_youtube_transcript(req.transcript)
        except ValueError as e:
            return {"error": str(e)}
            
        summary = summarize_text(transcript_text)
        return {"notes": summary}
    except Exception as e:
        return {"error": f"Error processing transcript: {str(e)}"}

# --- Quiz Generation Endpoint ---
@app.post("/quiz/")
def generate_quiz_endpoint(req: QuizRequest):
    try:
        if not req.chapter_text:
            return {"error": "Empty chapter text provided"}
        
        analysis = difficulty_adjuster.analyze_performance(req.past_scores)
        
        # Use the requested difficulty preference or default to 0.5
        difficulty = req.difficulty_preference if req.difficulty_preference is not None else 0.5
        
        questions = gemini_generate_quiz(
            req.chapter_text, 
            req.user_class, 
            req.board,
            difficulty=difficulty
        )
        
        if not questions or "Error:" in questions:
            return {"error": questions if "Error:" in questions else "Failed to generate quiz"}
            
        return {
            "quiz": questions,
            "difficulty_level": difficulty,
            "recommended_topics": analysis.get("recommendations", [])
        }
    except Exception as e:
        return {"error": f"Error generating quiz: {str(e)}"}


# --- QA from Documents ---
@app.post("/document-qa/")
async def qa_endpoint(question: str = Form(...)):
    try:
        if not question:
            return {"error": "Please provide a question"}
        return {"answer": get_document_qa("", question)}
    except Exception as e:
        return {"error": f"Error processing QA request: {str(e)}"}

# --- Save User Data ---
@app.post("/save-user/")
def save_user(data: dict):
    try:
        from firebase_utils import save_user_data
        save_user_data(data)
        return {"status": "saved"}
    except ImportError:
        return {"status": "mock saved", "message": "Firebase utils not available"}
    except Exception as e:
        return {"error": f"Error saving user data: {str(e)}"}

# --- Get User Profile ---
@app.get("/get-user/{uid}")
def get_user(uid: str):
    try:
        from firebase_utils import get_user_profile
        return get_user_profile(uid)
    except ImportError:
        return {"uid": uid, "name": "Demo User", "message": "Firebase utils not available"}
    except Exception as e:
        return {"error": f"Error retrieving user profile: {str(e)}"}

# --- User Scores ---
@app.post("/scores/{user_id}")
async def save_user_score(user_id: str, request: ScoresRequest):
    try:
        if not request.scores:
            raise HTTPException(status_code=400, detail="No scores provided")

        # Validate that all scores have the correct user_id
        for score in request.scores:
            if score.user_id != user_id:
                raise HTTPException(
                    status_code=400, 
                    detail=f"Score user_id mismatch. Expected {user_id}"
                )

        # Calculate stats
        total_questions = len(request.scores)
        total_correct = sum(1 for s in request.scores if s.correct)
        proficiency_level = total_correct / total_questions if total_questions > 0 else 0.5

        return {
            "status": "success", 
            "scores": request.scores,
            "stats": {
                "proficiency_level": proficiency_level,
                "total_correct": total_correct,
                "total_questions": total_questions
            }
        }
    except ValidationError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/scores/{user_id}")
async def get_user_scores(user_id: str):
    try:
        # Here you would typically fetch from a database
        # For now, return empty scores list and default stats
        return {
            "scores": [],
            "stats": {
                "proficiency_level": 0.5,
                "completed_quizzes": 0,
                "total_correct": 0,
                "total_questions": 0
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run("main:app", reload=True)