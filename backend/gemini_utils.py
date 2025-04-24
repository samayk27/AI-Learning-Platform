import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))
model = genai.GenerativeModel("gemini-1.5-flash")

def summarize_text(text: str) -> str:
    prompt = (
        "Create comprehensive notes of the following text. The notes should be:\n"
        "1. Well-structured with clear points\n"
        "2. Include key concepts and important details\n"
        "3. Use clear and simple language\n\n"
        "4. Give Important Tips to study the chapter\n\n" 
        f"Text to summarize:\n{text}"
    )
    try:
        res = model.generate_content(prompt)
        if res and hasattr(res, 'text'):
            summary = res.text.strip()
            if not summary:
                return "Unable to generate summary. Please try with a different text."
            return summary
        return "No summary could be generated."
    except Exception as e:
        return f"Error generating summary: {str(e)}"

def generate_quiz(text: str, user_class: str, board: str) -> str:
    prompt = (
        f"Generate 5 multiple-choice questions (MCQs) from the following chapter content for Class {user_class} "
        f"students of the {board} board. Each question must have options (a) to (d), clearly marked answer, "
        f"and a short explanation. Follow this format:\n"
        f"**1. Question text?**\n(a) Option1\n(b) Option2\n(c) Option3\n(d) Option4\n"
        f"**Answer: (b)**\n**Explanation: Explanation here**\n\n"
        f"Chapter:\n{text}"
    )
    try:
        res = model.generate_content(prompt)
        return res.text if res and hasattr(res, 'text') else "No quiz generated."
    except Exception as e:
        return f"Error: {str(e)}"

def format_mcqs(mcq_text: str) -> str:
    if not mcq_text:
        return "<p>No MCQs available.</p>"

    formatted = []
    questions = mcq_text.strip().split('\n\n')
    for q in questions:
        if q.strip():
            formatted.append(f"<div class='mcq-block'>{q.strip().replace('\n', '<br>')}</div>")
    return "<br>".join(formatted)
