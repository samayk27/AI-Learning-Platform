from fastapi import FastAPI, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, ValidationError
from typing import List
from PyPDF2 import PdfReader
from pdf2image import convert_from_bytes
import pytesseract
import io
import re
from youtube_transcript_api import YouTubeTranscriptApi
from gemini_utils import summarize_text, generate_quiz as gemini_generate_quiz
from nlp_analysis import difficulty_adjuster
from langchain_utils import get_document_qa
from models import SummaryRequest, QuizRequest, YouTubeRequest, Score

app = FastAPI()

# --- CORS CONFIG ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ScoresRequest(BaseModel):
    scores: List[Score]

# --- PDF Summarization ---


@app.post("/summarize/")
async def summarize_pdf(file: UploadFile):
    try:
        content = await file.read()

        if not file.filename.lower().endswith('.pdf'):
            return {"error": "File is not a valid PDF."}

        text = ""
        pdf_reader = PdfReader(io.BytesIO(content))
        for page in pdf_reader.pages:
            extracted = page.extract_text()
            if extracted:
                text += extracted + "\n"

        # Fallback to OCR if no text
        if not text.strip():
            images = convert_from_bytes(content)
            for image in images:
                text += pytesseract.image_to_string(image) + "\n"

        if not text.strip():
            return {"error": "No readable text found in the document"}

        summary = summarize_text(text.strip())
        return {"summary": summary}

    except Exception as e:
        return {"error": f"Error processing PDF: {str(e)}"}

# --- YouTube Transcript Utilities ---


def extract_video_id(url: str) -> str:
    patterns = [
        r'(?:v=|/v/|youtu\.be/|/embed/)([^&?/]+)',
        r'(?:youtube\.com/|youtu\.be/)(?:watch\?v=)?([^&?/]+)',
    ]
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    raise ValueError("Invalid YouTube URL")


def get_youtube_transcript(url: str) -> str:
    try:
        video_id = extract_video_id(url)
        transcript_list = YouTubeTranscriptApi.list_transcripts(video_id)

        try:
            transcript = transcript_list.find_transcript(['en'])
        except:
            transcript = transcript_list.find_manually_created_transcript().translate('en')

        transcript_parts = transcript.fetch()
        return " ".join([part.text for part in transcript_parts])
    except Exception as e:
        raise ValueError(f"Failed to get transcript: {str(e)}")
# --- YouTube Summarization ---


@app.post("/youtube-summary/")
async def youtube_notes(req: YouTubeRequest):
    try:
        if not req.transcript:
            return {"error": "Empty URL provided"}

        transcript_text = get_youtube_transcript(req.transcript)

        if not transcript_text.strip():
            return {"notes": "Transcript is empty or not available."}

        summary = summarize_text(transcript_text)
        return {"notes": summary}

    except Exception as e:
        return {"error": f"Error processing transcript: {str(e)}"}

# --- Quiz Generation ---


@app.post("/quiz/")
def generate_quiz_endpoint(req: QuizRequest):
    try:
        filtered_scores = req.past_scores
        if req.chapter_name:
            filtered_scores = [
                s for s in req.past_scores if s.chapter == req.chapter_name]

        analysis = difficulty_adjuster.analyze_performance(filtered_scores)
        difficulty = req.difficulty_preference if req.difficulty_preference is not None else 0.5

        if req.chapter_text:
            questions = gemini_generate_quiz(
                req.chapter_text,
                req.user_class,
                req.board,
                difficulty=difficulty
            )
        else:
            questions = gemini_generate_quiz(
                f"Generate a quiz for chapter: {req.chapter_name} for class {req.user_class} {req.board} board",
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

# --- QA from Document ---


@app.post("/document-qa/")
async def qa_endpoint(question: str = Form(...), context: str = Form("")):
    try:
        if not question:
            return {"error": "Please provide a question"}
        return {"answer": get_document_qa(context, question)}
    except Exception as e:
        return {"error": f"Error processing QA request: {str(e)}"}

# --- Save User Scores ---


@app.post("/scores/{user_id}")
async def save_user_score(user_id: str, request: ScoresRequest):
    try:
        if not request.scores:
            raise HTTPException(status_code=400, detail="No scores provided")

        for score in request.scores:
            if score.user_id != user_id:
                raise HTTPException(
                    status_code=400, detail="user_id mismatch in score data")

        total_questions = len(request.scores)
        total_correct = sum(1 for s in request.scores if s.correct)
        proficiency_level = total_correct / \
            total_questions if total_questions > 0 else 0.5

        chapter_stats = {}
        for score in request.scores:
            chapter = score.chapter
            if not chapter:
                continue
            if chapter not in chapter_stats:
                chapter_stats[chapter] = {"total": 0, "correct": 0}
            chapter_stats[chapter]["total"] += 1
            if score.correct:
                chapter_stats[chapter]["correct"] += 1

        for chapter in chapter_stats:
            data = chapter_stats[chapter]
            data["proficiency"] = data["correct"] / data["total"]

        return {
            "status": "success",
            "scores": request.scores,
            "stats": {
                "proficiency_level": proficiency_level,
                "total_correct": total_correct,
                "total_questions": total_questions
            },
            "chapter_stats": chapter_stats
        }

    except ValidationError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- Get Scores Stub (no DB) ---


@app.get("/scores/{user_id}")
async def get_user_scores(user_id: str):
    return {
        "scores": [],
        "stats": {
            "proficiency_level": 0.5,
            "completed_quizzes": 0,
            "total_correct": 0,
            "total_questions": 0
        },
        "chapter_stats": {}
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
