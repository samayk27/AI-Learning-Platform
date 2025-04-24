from fastapi import FastAPI, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from gemini_utils import summarize_text, generate_quiz as gemini_generate_quiz
from nlp_analysis import analyze_performance
from langchain_utils import get_document_qa
from models import SummaryRequest, QuizRequest, YouTubeRequest
from PyPDF2 import PdfReader
from pdf2image import convert_from_bytes
import pytesseract
import io
import uvicorn

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Vite default port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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

# --- YouTube Transcript Notes ---
@app.post("/youtube-summary/")
async def youtube_notes(req: YouTubeRequest):
    try:
        if not req.transcript:
            return {"error": "Empty transcript provided"}
        summary = summarize_text(req.transcript, req.user_class, req.board)
        return {"notes": summary}
    except Exception as e:
        return {"error": f"Error processing transcript: {str(e)}"}

# --- Quiz Generation Endpoint ---
@app.post("/quiz/")
def generate_quiz_endpoint(req: QuizRequest):
    try:
        if not req.chapter_text:
            return {"error": "Empty chapter text provided"}
        
        analysis = analyze_performance(req.past_scores)
        questions = gemini_generate_quiz(req.chapter_text, req.user_class, req.board)
        return {"quiz": questions}
    except Exception as e:
        return {"error": f"Error generating quiz: {str(e)}"}


# --- QA from Documents ---
@app.post("/document-qa/")
async def qa_endpoint(question: str = Form(...), context: str = Form(...)):
    try:
        if not question or not context:
            return {"error": "Both question and context must be provided"}
        return {"answer": get_document_qa(context, question)}
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

if __name__ == "__main__":
    uvicorn.run("main:app", reload=True)