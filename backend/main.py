from fastapi import FastAPI, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from gemini_utils import summarize_text, generate_quiz as gemini_generate_quiz
from nlp_analysis import analyze_performance
from langchain_utils import get_document_qa
from models import SummaryRequest, QuizRequest, YouTubeRequest
import io
from pypdf import PdfReader
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
async def summarize_pdf(file: UploadFile, user_class: str = Form(...), board: str = Form(...)):
    try:
        content = await file.read()
        
        if file.filename.lower().endswith('.pdf'):
            try:
                pdf_reader = PdfReader(io.BytesIO(content))
                text = ""
                for page in pdf_reader.pages:
                    extracted = page.extract_text()
                    text += extracted if extracted else " "
            except Exception as e:
                return {"error": f"Error processing PDF: {str(e)}"}
        else:
            encodings = ['utf-8', 'latin-1', 'cp1252', 'utf-16']
            text = None
            for encoding in encodings:
                try:
                    text = content.decode(encoding)
                    break
                except UnicodeDecodeError:
                    continue
            if not text:
                text = content.decode('utf-8', errors='replace')

        if not text.strip():
            return {"error": "No readable text found in the document"}

        summary = summarize_text(text, user_class, board)
        return {"summary": summary}
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
