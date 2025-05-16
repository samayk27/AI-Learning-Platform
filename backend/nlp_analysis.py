from collections import Counter
from typing import List, Dict, Optional
from models import Score
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

class DifficultyAdjuster:
    def __init__(self):
        self.vectorizer = TfidfVectorizer()
        self.topic_difficulties: Dict[str, float] = {}
        self.user_levels: Dict[str, float] = {}
        
    def update_user_level(self, user_id: str, scores: List[Score]) -> float:
        """
        Updates and returns the user's proficiency level based on their quiz performance.
        Level ranges from 0 (beginner) to 1 (expert).
        """
        if not scores:
            return 0.5  
            
        recent_scores = scores[-10:]  
        correct_ratio = sum(1 for s in recent_scores if s.correct) / len(recent_scores)
        
        
        current_level = self.user_levels.get(user_id, 0.5)
        new_level = 0.7 * current_level + 0.3 * correct_ratio
        self.user_levels[user_id] = new_level
        
        return new_level

    def adjust_difficulty(self, text: str, user_id: str, scores: List[Score]) -> float:
        """
        Determines the appropriate difficulty level for content generation
        based on user performance and content complexity.
        """
        user_level = self.update_user_level(user_id, scores)
        
        
        try:
            tfidf = self.vectorizer.fit_transform([text])
            complexity_score = np.mean(tfidf.data) 
        except:
            complexity_score = 0.5 
        
        target_difficulty = (user_level + complexity_score) / 2
        return min(max(target_difficulty, 0.1), 0.9)  

    def analyze_performance(self, scores: List[Score]) -> Dict[str, any]:
        """
        Analyzes student performance and returns detailed insights
        including weakest topics and recommended focus areas.
        """
        if not scores:
            return {
                "weakest_topic": None,
                "proficiency_level": 0.5,
                "recommendations": []
            }

        
        mistakes = [q.topic for q in scores if not q.correct]
        freq = Counter(mistakes)
        
        
        topic_scores = {}
        for topic in set(s.topic for s in scores):
            topic_attempts = [s for s in scores if s.topic == topic]
            correct = sum(1 for s in topic_attempts if s.correct)
            topic_scores[topic] = correct / len(topic_attempts)

        weakest_topics = sorted(topic_scores.items(), key=lambda x: x[1])
        
        recommendations = []
        for topic, score in weakest_topics[:3]:  # Top 3 weakest topics
            if score < 0.7:  # Only recommend topics below 70% proficiency
                recommendations.append({
                    "topic": topic,
                    "proficiency": score,
                    "priority": "high" if score < 0.5 else "medium"
                })

        return {
            "weakest_topic": weakest_topics[0][0] if weakest_topics else None,
            "proficiency_level": np.mean(list(topic_scores.values())),
            "recommendations": recommendations
        }

# Global instance for the application
difficulty_adjuster = DifficultyAdjuster()
