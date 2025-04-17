from collections import Counter
from typing import List
from models import Score  # Ensure this matches your actual model file

def analyze_performance(scores: List[Score]) -> str:
    """
    Analyzes student performance and returns the weakest topic
    based on incorrect answers.
    """
    mistakes = [q.topic for q in scores if not q.correct]
    freq = Counter(mistakes)
    
    return freq.most_common(1)[0][0] if freq else "general understanding"
