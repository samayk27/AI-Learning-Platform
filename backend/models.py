from pydantic import BaseModel
from typing import List

class Score(BaseModel):
    topic: str
    correct: bool

class QuizRequest(BaseModel):
    chapter_text: str
    past_scores: List[Score]
    user_class: str
    board: str

class SummaryRequest(BaseModel):
    chapter_text: str

class YouTubeRequest(BaseModel):
    transcript: str