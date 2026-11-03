# ScholarPrep — English GAT Preparation Platform

Live at **[scholargat.com](https://scholargat.com)** · Mirror: **[scholar-gat.web.app](https://scholar-gat.web.app)**

**ScholarPrep** is a full-featured interactive web platform built to help high school students prepare for the English General Aptitude Test (GAT / Qudurat).

## Key Features
- **Full-Length Mock Exams & Practice Quizzes**: Timed exam simulation and category-based practice across **Verbal** (*Analogy*, *Sentence Completion*, *Contextual Error*, *Reading Comprehension*) and **Quantitative** (*Arithmetic*, *Algebra*, *Geometry*, *Comparison*, *Data Analysis*).
- **Dynamic Remedial Drills**: Automatically generates number-variant practice drills from missed quantitative questions so students master the underlying mathematical method rather than memorizing answers.
- **Interactive Reading Comprehension Highlighting**: Highlights the exact supporting evidence inside the passage after a student submits an answer.
- **Precision SVG Geometry & Data Charts**: Vector-rendered geometric figures, coordinate systems, pie/donut charts, and grouped bar/line charts with crisp mathematical typography.
- **Exam Leaks Feed**: Filterable, scrollable feed of recent exam questions and multi-question reading passages with one-click answer verification.
- **Preppy AI Tutor**: Contextual inline math & verbal explanations rendered directly alongside the active question.
- **Cloud Progress & Mistake Bank**: Real-time score analytics, streak tracking, and mistake review powered by **Firebase Authentication** and **Cloud Firestore**.

## Tech Stack
- **Frontend**: React 18, Vite, Lucide Icons, Custom CSS Design System (Dark/Light Mode)
- **Backend & Hosting**: Firebase Auth, Cloud Firestore, Firebase Hosting

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

> **Note on the Question Bank**: To protect proprietary exam content, the full 1,650+ question bank (`quantQuestions.js`, `verbalQuestions.js`, and `nov2Leaks.js`) is excluded from this public repository. When cloned publicly, Vite automatically loads the lightweight demo sample banks (`*.sample.js`) so all features, charts, and quizzes run out of the box.

