import os
import google.generativeai as genai
from dotenv import load_dotenv
load_dotenv()

genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))
model = genai.GenerativeModel("gemini-1.5-flash")

def summarize_text(text: str, user_class: str, board: str):
    prompt = f"Summarize this chapter for a Class {user_class} student under the {board} board:\n{text}"
    res = model.generate_content(prompt)
    return res.text

def generate_quiz(text: str, user_class: str, board: str):
    prompt = (
        f"Generate 5 MCQs with answers from this chapter for Class {user_class} "
        f"students studying in the {board} board according to their prescribed textbook and syllabus:\n\n{text}"
    )
    res = model.generate_content(prompt)
    return res.text


def format_mcqs(mcq_text: str):
    formatted = []
    questions = mcq_text.strip().split('\n\n')
    for q in questions:
        if q.strip():
            formatted.append(f"<div class='mcq-block'>{q.strip()}</div>")
    return "<br>".join(formatted)
