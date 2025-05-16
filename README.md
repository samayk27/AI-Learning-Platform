# AI Learning Platform

An intelligent learning platform that generates personalized quizzes and adapts difficulty based on user performance.

## Features

- User authentication with Clerk
- Personalized quiz generation using Google's Gemini AI
- Dynamic difficulty adjustment based on user performance
- Performance tracking and analytics
- Topic-based recommendations
- Support for multiple education boards and class levels

## Setup

### Backend Setup

1. Create a virtual environment and activate it:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Create a `.env` file in the backend directory with:
```
GOOGLE_API_KEY=your_gemini_api_key
```

4. Start the backend server:
```bash
uvicorn app:app --reload
```

### Frontend Setup

1. Install dependencies:
```bash
cd frontend
npm install
```

2. Create a `.env` file in the frontend directory with:
```
REACT_APP_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
```

3. Start the frontend development server:
```bash
npm start
```

## Usage

1. Sign up or sign in using Clerk authentication
2. Enter chapter content in the text area
3. Select class level, board, and preferred difficulty
4. Generate and take the quiz
5. View performance statistics and recommendations

## Architecture

- Frontend: React with Clerk authentication
- Backend: FastAPI with scikit-learn for NLP
- AI: Google Gemini for quiz generation
- Authentication: Clerk.dev

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request 