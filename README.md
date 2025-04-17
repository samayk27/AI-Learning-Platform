# AI Learning Platform

An interactive learning platform with AI-powered features including:
- PDF Summarization
- YouTube Content Notes
- Quiz Generation
- AI Tutor Chat

## Setup

### Backend Setup
```bash
cd backend
pip install -r requirements.txt
```

### Frontend Setup
```bash
cd frontend
npm install
```

## Running the Application

### Option 1: Using the start script
This will start both frontend and backend servers:
```bash
python start_app.py
```

### Option 2: Running separately

#### Backend
```bash
cd backend
uvicorn main:app --reload
```

#### Frontend
```bash
cd frontend
npm run dev
```

## Accessing the Application
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000

## API Endpoints
- `/summarize/` - PDF summarization
- `/youtube-summary/` - YouTube video notes
- `/quiz/` - Generate quiz based on content
- `/document-qa/` - Question answering system
- `/save-user/` - Save user data
- `/get-user/{uid}` - Get user profile 