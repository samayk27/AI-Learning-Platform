from pydantic import BaseModel
from typing import List, Optional, Dict, Any

class Score(BaseModel):
    topic: str
    correct: bool
    user_id: str
    chapter: Optional[str] = None
    timestamp: Optional[str] = None
    difficulty: Optional[float] = None

class UserProfile(BaseModel):
    user_id: str
    name: Optional[str] = None
    email: str
    proficiency_level: float = 0.5
    completed_quizzes: int = 0
    total_correct: int = 0
    total_questions: int = 0

class QuizRequest(BaseModel):
    chapter_text: Optional[str] = None
    chapter_name: str
    past_scores: List[Score]
    user_class: str
    board: str
    user_id: str
    difficulty_preference: Optional[float] = None

class QuizResponse(BaseModel):
    quiz: str
    difficulty_level: float
    recommended_topics: List[Dict[str, Any]]

class SummaryRequest(BaseModel):
    chapter_text: str
    user_id: str

class YouTubeRequest(BaseModel):
    transcript: str
    user_id: str
    user_class: Optional[str] = None
    board: Optional[str] = None