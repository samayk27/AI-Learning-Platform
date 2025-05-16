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

def generate_quiz(text: str, user_class: str, board: str, difficulty: float = 0.5) -> str:
    # Map difficulty (0.0-1.0) to cognitive levels
    if difficulty < 0.3:
        cognitive_level = "basic recall and understanding"
        complexity = "simple and straightforward"
    elif difficulty < 0.6:
        cognitive_level = "application and analysis"
        complexity = "moderate complexity"
    else:
        cognitive_level = "analysis, evaluation, and synthesis"
        complexity = "challenging and thought-provoking"

    prompt = f"""Generate 10 multiple-choice questions (MCQs) from the given chapter content. 
Target audience: Class {user_class} students of {board} board.

Difficulty Level: {difficulty * 100}% (Make questions {complexity})
Cognitive Level: Focus on {cognitive_level}

Requirements:
1. Questions should match the specified difficulty level strictly
2. For higher difficulty:
   - Include questions that require critical thinking
   - Add questions that combine multiple concepts
   - Include application-based scenarios
   - Add questions that require analysis or evaluation
3. For lower difficulty:
   - Focus on basic concepts and definitions
   - Use clear and direct language
   - Keep options distinct and unambiguous

Format each question as follows:
**1. Question text?**
(a) Option1
(b) Option2
(c) Option3
(d) Option4
**Answer: (letter)**
**Explanation: Detailed explanation of why this is the correct answer**

Chapter Content:
{text}

Remember: Maintain consistent {difficulty * 100}% difficulty level across all questions."""

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
