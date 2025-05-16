from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from models import QuizRequest, SummaryRequest, YouTubeRequest, Score, UserProfile
from nlp_analysis import difficulty_adjuster
from gemini_utils import generate_quiz, summarize_text
from typing import List, Dict
import json
from datetime import datetime

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory storage (replace with a database in production)
user_scores = {}
user_profiles = {}

@app.post("/quiz/")
async def create_quiz(request: QuizRequest):
    try:
        # Get difficulty level based on user's performance
        difficulty = difficulty_adjuster.adjust_difficulty(
            request.chapter_text,
            request.user_id,
            request.past_scores
        )
        
        # Override difficulty if user has a preference
        if request.difficulty_preference is not None:
            difficulty = request.difficulty_preference
            
        # Generate quiz with adjusted difficulty
        quiz_text = generate_quiz(
            request.chapter_text,
            request.user_class,
            request.board
        )
        
        # Get performance analysis and recommendations
        analysis = difficulty_adjuster.analyze_performance(request.past_scores)
        
        return {
            "quiz": quiz_text,
            "difficulty_level": difficulty,
            "recommended_topics": analysis["recommendations"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/scores/{user_id}")
async def get_user_scores(user_id: str):
    scores = user_scores.get(user_id, [])
    profile = user_profiles.get(user_id, {
        "proficiency_level": 0.5,
        "completed_quizzes": 0,
        "total_correct": 0,
        "total_questions": 0
    })
    return {"scores": scores, "stats": profile}

@app.post("/scores/{user_id}")
async def save_user_scores(user_id: str, data: Dict):
    scores = data.get("scores", [])
    if not scores:
        raise HTTPException(status_code=400, detail="No scores provided")
        
    # Update user scores
    if user_id not in user_scores:
        user_scores[user_id] = []
    user_scores[user_id].extend(scores)
    
    # Update user profile
    if user_id not in user_profiles:
        user_profiles[user_id] = {
            "proficiency_level": 0.5,
            "completed_quizzes": 0,
            "total_correct": 0,
            "total_questions": 0
        }
    
    profile = user_profiles[user_id]
    correct_count = sum(1 for score in scores if score["correct"])
    
    profile["completed_quizzes"] += 1
    profile["total_correct"] += correct_count
    profile["total_questions"] += len(scores)
    profile["proficiency_level"] = difficulty_adjuster.update_user_level(
        user_id,
        [Score(**score) for score in user_scores[user_id]]
    )
    
    return {"message": "Scores saved successfully"}

@app.post("/summarize/")
async def create_summary(request: SummaryRequest):
    try:
        return {"summary": summarize_text(request.chapter_text)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/youtube/")
async def process_youtube(request: YouTubeRequest):
    try:
        return {"summary": summarize_text(request.transcript)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 