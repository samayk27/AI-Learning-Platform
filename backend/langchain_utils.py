from dotenv import load_dotenv
import os
import google.generativeai as genai

load_dotenv()

genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))
model = genai.GenerativeModel("gemini-1.5-flash")

def get_document_qa(text: str, question: str):
    try:
        response = model.generate_content(question)
        if response and hasattr(response, 'text'):
            answer = response.text.strip()
            if not answer:
                return "I could not understand your question. Please try rephrasing it."
            return answer
        return "I couldn't generate a response. Please try again."
    except Exception as e:
        return f"Error: {str(e)}"
