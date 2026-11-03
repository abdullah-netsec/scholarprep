import React, { useState, useEffect } from 'react';
import { 
  Award, 
  HelpCircle, 
  Clock, 
  ChevronRight, 
  ChevronLeft,
  ArrowLeft, 
  BookOpen, 
  CheckCircle, 
  XCircle,
  Edit3,
  Bookmark,
  BookmarkCheck,
  Bot,
  Sparkles,
  Maximize,
  Minimize
} from 'lucide-react';
import confetti from 'canvas-confetti';
import Scratchpad from './Scratchpad.jsx';
import AITutorDrawer from './AITutorDrawer.jsx';
import { isFirebaseEnabled, db, doc, setDoc } from '../firebase.js';
import { formatMathAndText, formatPassageWithHighlight } from '../utils/gatFormatters.js';
import { generateNumberVariantQuestion } from '../utils/remedialGenerator.js';

export default function PracticeQuiz({ questions: initialQuestions, categoryTitle, isQuant, activeUser, onClose, onFinish }) {
  const [questions, setQuestions] = useState(initialQuestions);
  const [remedialRound, setRemedialRound] = useState(0);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answersMap, setAnswersMap] = useState({}); // { [idx]: optionIndex }
  const [submittedMap, setSubmittedMap] = useState({}); // { [idx]: boolean }
  const [score, setScore] = useState(0);
  const [answersLog, setAnswersLog] = useState([]);
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const [questionStats, setQuestionStats] = useState([]);
  
  const [timeLeft, setTimeLeft] = useState(60); // 60 seconds per question
  const [quizFinished, setQuizFinished] = useState(false);
  const [showScratchpad, setShowScratchpad] = useState(isQuant);
  const [showAITutor, setShowAITutor] = useState(false);
  const [workSaved, setWorkSaved] = useState(false);
  const [isUntimed, setIsUntimed] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);
  
  // RESUME FEATURE STATE
  const sessionKey = `scholar_gat_quiz_session_${activeUser?.email?.replace(/[@.]/g, '_') || 'guest'}_${categoryTitle.replace(/\s+/g, '_')}`;
  const [showResumePrompt, setShowResumePrompt] = useState(true);
  const [hasSavedSession, setHasSavedSession] = useState(false);

  const currentQuestion = questions[currentIdx] || questions[0];
  const selectedOpt = answersMap[currentIdx] ?? null;
  const isSubmitted = !!submittedMap[currentIdx];

  // Check for saved session on mount
  useEffect(() => {
    const saved = localStorage.getItem(sessionKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.currentIdx > 0 && parsed.currentIdx < questions.length) {
          setHasSavedSession(true);
        } else {
          setShowResumePrompt(false);
        }
      } catch(e) {
        setShowResumePrompt(false);
      }
    } else {
      setShowResumePrompt(false);
    }
  }, [sessionKey, questions.length]);

  // Save session state on change
  useEffect(() => {
    if (showResumePrompt || quizFinished) return;
    const stateToSave = {
      currentIdx,
      score,
      answersMap,
      submittedMap,
      answersLog,
      questionStats
    };
    localStorage.setItem(sessionKey, JSON.stringify(stateToSave));
  }, [currentIdx, score, answersMap, submittedMap, answersLog, questionStats, showResumePrompt, quizFinished, sessionKey]);

  const handleResume = () => {
    try {
      const saved = JSON.parse(localStorage.getItem(sessionKey));
      setCurrentIdx(saved.currentIdx || 0);
      setScore(saved.score || 0);
      setAnswersMap(saved.answersMap || {});
      setSubmittedMap(saved.submittedMap || {});
      setAnswersLog(saved.answersLog || []);
      setQuestionStats(saved.questionStats || []);
    } catch(e) {}
    setShowResumePrompt(false);
    setQuestionStartTime(Date.now());
  };

  const handleStartOver = () => {
    localStorage.removeItem(sessionKey);
    setCurrentIdx(0);
    setScore(0);
    setAnswersMap({});
    setSubmittedMap({});
    setAnswersLog([]);
    setQuestionStats([]);
    setShowResumePrompt(false);
    setQuestionStartTime(Date.now());
  };

  // Timer effect
  useEffect(() => {
    if (quizFinished || isSubmitted || isUntimed) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Auto submit answer on timeout if option chosen
          handleCheckAnswer(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentIdx, isSubmitted, quizFinished, isUntimed]);

  // Reset timer on question change
  useEffect(() => {
    setTimeLeft(60);
    setWorkSaved(false);
    setQuestionStartTime(Date.now());
  }, [currentIdx]);

  const handleSelectOption = (optIdx) => {
    if (isSubmitted) return;
    setAnswersMap(prev => ({ ...prev, [currentIdx]: optIdx }));
  };

  const handleCheckAnswer = (timeout = false) => {
    if (isSubmitted) return;
    
    let finalSelection = answersMap[currentIdx];
    if (finalSelection === undefined || finalSelection === null) {
      if (timeout) finalSelection = -1;
      else return;
    }

    setSubmittedMap(prev => ({ ...prev, [currentIdx]: true }));

    const isCorrect = finalSelection === currentQuestion.correctAnswer;
    if (isCorrect) {
      setScore(prev => prev + 1);
    }

    setAnswersLog(prev => [...prev, {
      questionId: currentQuestion.id,
      selected: finalSelection,
      correct: currentQuestion.correctAnswer,
      isCorrect
    }]);

    const timeSpent = Math.round((Date.now() - questionStartTime) / 1000);
    setQuestionStats(prev => [...prev, {
      category: currentQuestion.category,
      isCorrect,
      timeSpent: Math.min(120, timeSpent)
    }]);

    // Confetti if correct
    if (isCorrect) {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 },
        colors: isQuant ? ['#00d2ff', '#1a73e8', '#ffffff'] : ['#d946ef', '#c084fc', '#ffffff']
      });
    } else {
      saveMistakeToDb(currentQuestion, finalSelection);
    }
  };

  const saveMistakeToDb = (question, selectedOpt) => {
    if (!activeUser) return;
    
    const todayStr = new Date().toISOString().split('T')[0];
    const id = `${activeUser.email.replace(/[@.]/g, '_')}_${todayStr}_${question.id}`;
    
    const mistakeItem = {
      id,
      userEmail: activeUser.email.toLowerCase(),
      date: todayStr,
      questionId: question.id,
      questionText: question.question,
      passage: question.passage || null,
      options: question.options,
      correctAnswer: question.correctAnswer,
      selectedAnswer: selectedOpt,
      explanation: question.explanation,
      isQuant: isQuant,
      category: question.category,
      savedAt: new Date().toLocaleString()
    };

    const localKey = `scholar_gat_mistakes_${activeUser.email.replace(/[@.]/g, '_')}`;
    const localMistakes = JSON.parse(localStorage.getItem(localKey) || '[]');
    if (!localMistakes.some(m => m.id === id)) {
      localMistakes.push(mistakeItem);
      localStorage.setItem(localKey, JSON.stringify(localMistakes));
    }

    if (isFirebaseEnabled && db) {
      setDoc(doc(db, "mistakes", id), mistakeItem)
        .catch(e => console.error("Error saving mistake to Firestore", e));
    }
  };

  const handleNextQuestion = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(prev => prev + 1);
    }
  };

  const handlePrevQuestion = () => {
    if (currentIdx > 0) {
      setCurrentIdx(prev => prev - 1);
    }
  };

  const handleFinishQuiz = () => {
    setQuizFinished(true);
    if (onFinish) {
      const accuracy = Math.round((score / questions.length) * 100);
      onFinish(questions.length, accuracy, questionStats);
    }
    
    confetti({
      particleCount: 150,
      spread: 80,
      origin: { y: 0.6 }
    });
  };

  const handleSaveWork = () => {
    const canvas = document.querySelector('.scratchpad-canvas');
    let canvasImage = null;
    if (canvas) {
      canvasImage = canvas.toDataURL('image/png');
    }

    const activeUser = JSON.parse(localStorage.getItem('scholar_gat_active_user'));
    if (!activeUser) return;

    const key = `scholar_gat_saved_work_${activeUser.email.replace(/[@.]/g, '_')}`;
    const existing = JSON.parse(localStorage.getItem(key) || '[]');

    if (existing.some(item => item.questionText === currentQuestion.question)) {
      setWorkSaved(true);
      return;
    }

    const savedItem = {
      id: `${currentQuestion.id || 'q'}_${Date.now()}`,
      questionText: currentQuestion.question,
      passage: currentQuestion.passage || null,
      options: currentQuestion.options,
      selectedAnswer: selectedOpt,
      correctAnswer: currentQuestion.correctAnswer,
      explanation: currentQuestion.explanation,
      category: currentQuestion.category,
      isQuant: isQuant,
      canvasImage: canvasImage,
      savedAt: new Date().toLocaleDateString()
    };

    existing.push(savedItem);
    localStorage.setItem(key, JSON.stringify(existing));

    if (isFirebaseEnabled && db) {
      setDoc(doc(db, "saved_work", savedItem.id), {
        ...savedItem,
        userEmail: activeUser.email.toLowerCase()
      }).catch(e => console.error("Error saving work to Firestore", e));
    }

    setWorkSaved(true);
  };

  const formatText = (text) => formatMathAndText(text);

  const getFormattedQuestion = (q) => {
    if (!q || !q.question) return '';
    let qText = q.question;
    if (q.category && q.category.toLowerCase() === 'contextual error') {
      const uStyle = 'text-decoration: underline; text-decoration-color: var(--accent-verbal); text-underline-offset: 4px; text-decoration-thickness: 2.5px; font-weight: 600;';
      if (/<u>/i.test(qText)) {
        qText = qText.replace(/<u>(.*?)<\/u>/gi, `<u style="${uStyle}">$1</u>`);
      } else if (Array.isArray(q.options)) {
        q.options.forEach(opt => {
          if (!opt) return;
          const escaped = String(opt).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const regex = new RegExp(`\\b(${escaped})\\b`, 'i');
          qText = qText.replace(regex, `<u style="${uStyle}">$1</u>`);
        });
      }
    }
    return formatMathAndText(qText, { isQuestionStem: true });
  };

  if (showResumePrompt && hasSavedSession) {
    let savedQNum = 1;
    try { savedQNum = JSON.parse(localStorage.getItem(sessionKey)).currentIdx + 1; } catch(e){}
    return (
      <div className="animate-fade-in" style={{ maxWidth: '500px', margin: '40px auto', textAlign: 'center' }}>
        <div className="glass-panel" style={{ padding: '40px' }}>
          <Clock size={48} style={{ color: 'var(--primary)', margin: '0 auto 20px auto' }} />
          <h2 style={{ fontSize: '1.8rem', marginBottom: 16 }}>Resume Quiz?</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 32 }}>
            You have an unfinished session for <strong>{categoryTitle}</strong>. You left off at Question {savedQNum}.
          </p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
            <button onClick={handleStartOver} className="btn btn-secondary">Start Over</button>
            <button onClick={handleResume} className="btn btn-primary" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              Resume <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (quizFinished) {
    localStorage.removeItem(sessionKey);
    const accuracy = Math.round((score / questions.length) * 100);
    const missedQuestions = questions.filter((q, idx) => answersMap[idx] !== q.correctAnswer);

    const handleStartRemedialQuiz = () => {
      const nextRound = remedialRound + 1;
      const remQuestions = missedQuestions.map((q, i) =>
        isQuant ? generateNumberVariantQuestion(q, nextRound + i) : { ...q, id: `${q.id}_rem_${nextRound}_${i}` }
      );
      setRemedialRound(nextRound);
      setQuestions(remQuestions);
      setCurrentIdx(0);
      setScore(0);
      setAnswersMap({});
      setSubmittedMap({});
      setAnswersLog([]);
      setQuestionStats([]);
      setQuizFinished(false);
      setQuestionStartTime(Date.now());
    };

    return (
      <div className="animate-fade-in" style={{ maxWidth: '600px', margin: '40px auto', textAlign: 'center' }}>
        <div className="glass-panel" style={{ padding: '40px' }}>
          <Award size={64} style={{ color: 'var(--primary)', marginBottom: '20px' }} />
          <h2 style={{ fontSize: '2rem', marginBottom: '8px', fontFamily: 'Outfit' }}>Quiz Completed!</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>
            {remedialRound > 0 ? `${categoryTitle} — Remedial Round ${remedialRound}` : categoryTitle}
          </p>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: '32px' }}>
            <div className="glass-panel" style={{ padding: '20px' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Accuracy Score</div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--text-primary)', marginTop: '6px' }}>{accuracy}%</div>
            </div>
            <div className="glass-panel" style={{ padding: '20px' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Score Ratio</div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--text-primary)', marginTop: '6px' }}>{score} / {questions.length}</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {missedQuestions.length > 0 && (
              <button
                className="btn btn-primary"
                onClick={handleStartRemedialQuiz}
                style={{
                  width: '100%',
                  padding: '13px',
                  background: 'linear-gradient(135deg, #2563eb, #0284c7)',
                  fontWeight: 700
                }}
              >
                Remedial Practice: Retry {missedQuestions.length} Missed Question{missedQuestions.length > 1 ? 's' : ''} (New Numbers)
              </button>
            )}
            <button className="btn btn-secondary" onClick={onClose} style={{ width: '100%', padding: '12px' }}>
              Return to Study Hub
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="quiz-layout" style={isFullscreen ? {
      position: 'fixed',
      inset: 0,
      zIndex: 9500,
      background: 'var(--bg-primary)',
      padding: '24px 32px',
      overflowY: 'auto'
    } : undefined}>
      {/* Quiz Workspace */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, flexGrow: 1, maxWidth: isFullscreen ? '1100px' : undefined, margin: isFullscreen ? '0 auto' : undefined, width: '100%' }}>
        {/* Header toolbar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <button onClick={onClose} className="btn btn-secondary" style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 6 }}>
            <ArrowLeft size={16} /> Exit Practice
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            {/* AI Tutor Button */}
            <button 
              onClick={() => setShowAITutor(!showAITutor)} 
              className="btn btn-ai"
              style={{ 
                padding: '8px 16px', 
                display: 'flex', 
                alignItems: 'center', 
                gap: 8, 
                fontWeight: 700
              }}
            >
              <Bot size={18} />
              <span>{showAITutor ? 'Hide Preppy' : 'Preppy'}</span>
              <Sparkles size={14} />
            </button>

            {/* Scratchpad Button */}
            <button 
              onClick={() => setShowScratchpad(!showScratchpad)} 
              className={`btn btn-secondary ${showScratchpad ? 'active' : ''}`}
              style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 6, borderColor: showScratchpad ? 'var(--accent-quant)' : undefined }}
            >
              <Edit3 size={16} /> {showScratchpad ? "Hide Scratchpad" : "Open Scratchpad"}
            </button>

            {/* Full Screen Button */}
            <button
              onClick={toggleFullscreen}
              className="btn btn-secondary"
              title={isFullscreen ? "Exit Full Screen" : "Enter Full Screen"}
              style={{ padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 6 }}
            >
              {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
              <span>{isFullscreen ? "Exit Full Screen" : "Full Screen"}</span>
            </button>

            {/* Timer pill */}
            <div 
              onClick={() => setIsUntimed(!isUntimed)}
              title="Click to toggle timed/untimed practice"
              className="glass-panel" 
              style={{ 
                padding: '8px 16px', 
                borderRadius: '20px', 
                display: 'flex', 
                alignItems: 'center', 
                gap: 8, 
                cursor: 'pointer',
                color: isUntimed ? 'var(--text-primary)' : (timeLeft <= 15 ? 'var(--danger)' : 'var(--text-primary)'),
                borderColor: isUntimed ? 'rgba(16, 185, 129, 0.4)' : (timeLeft <= 15 ? 'rgba(239, 68, 68, 0.4)' : undefined),
                background: isUntimed ? 'rgba(16, 185, 129, 0.12)' : (timeLeft <= 15 ? 'rgba(239, 68, 68, 0.1)' : undefined)
              }}
            >
              <Clock size={16} />
              <span style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>
                {isUntimed ? "Untimed" : `${timeLeft}s`}
              </span>
            </div>
          </div>
        </div>

        {/* Scrollable Question Navigator Pills */}
        <div style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--glass-border)',
          borderRadius: '12px',
          padding: '10px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          overflowX: 'auto',
          whiteSpace: 'nowrap'
        }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 'bold', marginRight: 4 }}>
            Jump to:
          </span>
          {questions.map((q, idx) => {
            const isCurr = idx === currentIdx;
            const isSub = submittedMap[idx];
            const hasAns = answersMap[idx] !== undefined && answersMap[idx] !== null;
            const isCorr = isSub && answersMap[idx] === q.correctAnswer;
            
            let bg = 'var(--bg-tertiary)';
            let borderColor = 'var(--glass-border)';
            let color = 'var(--text-primary)';

            if (isSub) {
              if (isCorr) {
                bg = 'rgba(34, 197, 94, 0.2)';
                borderColor = 'rgba(34, 197, 94, 0.6)';
                color = 'var(--text-primary)';
              } else {
                bg = 'rgba(239, 68, 68, 0.2)';
                borderColor = 'rgba(239, 68, 68, 0.6)';
                color = 'var(--text-primary)';
              }
            } else if (hasAns) {
              bg = 'rgba(59, 130, 246, 0.2)';
              borderColor = 'rgba(59, 130, 246, 0.6)';
              color = 'var(--text-primary)';
            }

            if (isCurr) {
              borderColor = isQuant ? 'var(--accent-quant)' : 'var(--accent-verbal)';
            }

            return (
              <button
                key={idx}
                onClick={() => setCurrentIdx(idx)}
                style={{
                  minWidth: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: bg,
                  border: `1.5px solid ${borderColor}`,
                  color: color,
                  fontWeight: isCurr ? 'bold' : 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: isCurr ? (isQuant ? '0 0 10px rgba(0,210,255,0.4)' : '0 0 10px rgba(217,70,239,0.4)') : 'none',
                  transition: 'all 0.2s'
                }}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>

        {/* Question Panel */}
        <div className="glass-panel question-card">
          <div className="watermark-overlay"></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 1 }}>
            <span style={{
              fontSize: '0.75rem',
              padding: '4px 8px',
              borderRadius: '4px',
              background: isQuant ? 'rgba(0, 210, 255, 0.1)' : 'rgba(217, 70, 239, 0.1)',
              color: isQuant ? 'var(--accent-quant)' : 'var(--accent-verbal)',
              fontWeight: 600
            }}>
              {currentQuestion.category}
            </span>

            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Question {currentIdx + 1} of {questions.length}
            </span>
          </div>

          {currentQuestion.passage && (
            <div style={{ marginTop: '16px' }}>
              {isSubmitted && (
                <div style={{
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  color: '#f59e0b',
                  marginBottom: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}>
                  <Sparkles size={13} /> Answer source highlighted in the passage below:
                </div>
              )}
              <div style={{
                padding: '16px',
                background: 'rgba(255,255,255,0.03)',
                borderLeft: '4px solid var(--accent-verbal)',
                borderRadius: '0 8px 8px 0',
                fontSize: '0.95rem',
                lineHeight: 1.75,
                color: 'var(--text-primary)',
                whiteSpace: 'pre-wrap'
              }} dangerouslySetInnerHTML={{ __html: formatPassageWithHighlight(currentQuestion.passage, currentQuestion, isSubmitted) }} />
            </div>
          )}

          <h3 
            style={{ fontSize: '1.25rem', marginTop: '16px', fontWeight: 500, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}
            dangerouslySetInnerHTML={{ __html: getFormattedQuestion(currentQuestion) }}
          />

          <div className="options-list">
            {currentQuestion.options.map((opt, optIdx) => {
              let btnClass = "";
              if (isSubmitted) {
                if (optIdx === currentQuestion.correctAnswer) {
                  btnClass = "correct";
                } else if (selectedOpt === optIdx) {
                  btnClass = "incorrect";
                }
              } else if (selectedOpt === optIdx) {
                btnClass = "selected";
              }

              return (
                <button
                  key={optIdx}
                  onClick={() => handleSelectOption(optIdx)}
                  disabled={isSubmitted}
                  className={`option-btn ${btnClass}`}
                >
                  <span style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: selectedOpt === optIdx ? (isQuant ? 'var(--accent-quant)' : 'var(--accent-verbal)') : 'rgba(255,255,255,0.05)',
                    color: selectedOpt === optIdx ? 'black' : 'var(--text-primary)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: '12px',
                    fontSize: '0.8rem',
                    fontWeight: 'bold',
                    flexShrink: 0
                  }}>
                    {String.fromCharCode(65 + optIdx)}
                  </span>
                  <span dangerouslySetInnerHTML={{ __html: formatText(opt) }} />
                </button>
              );
            })}
          </div>

          {/* Action Footer Navigation */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '28px', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', gap: 10 }}>
              <button 
                className="btn btn-secondary" 
                onClick={handlePrevQuestion}
                disabled={currentIdx === 0}
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <ChevronLeft size={16} /> Previous
              </button>

              <button 
                className="btn btn-secondary" 
                onClick={handleNextQuestion}
                disabled={currentIdx === questions.length - 1}
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              >
                Next <ChevronRight size={16} />
              </button>
            </div>

            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              {isSubmitted && (
                <button 
                  className="btn btn-secondary" 
                  onClick={handleSaveWork}
                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  {workSaved ? (
                    <>
                      <BookmarkCheck size={16} style={{ color: 'var(--success)' }} /> Saved
                    </>
                  ) : (
                    <>
                      <Bookmark size={16} /> Save Question
                    </>
                  )}
                </button>
              )}

              {!isSubmitted ? (
                <button 
                  className="btn btn-primary" 
                  onClick={() => handleCheckAnswer(false)}
                  disabled={selectedOpt === null}
                  style={{
                    background: isQuant ? 'linear-gradient(135deg, var(--accent-quant), #007bff)' : undefined,
                    boxShadow: isQuant ? '0 4px 15px rgba(0, 210, 255, 0.3)' : undefined
                  }}
                >
                  Submit Answer
                </button>
              ) : (
                <button 
                  className="btn btn-primary" 
                  onClick={currentIdx < questions.length - 1 ? handleNextQuestion : handleFinishQuiz}
                  style={{
                    background: isQuant ? 'linear-gradient(135deg, var(--accent-quant), #007bff)' : undefined,
                    boxShadow: isQuant ? '0 4px 15px rgba(0, 210, 255, 0.3)' : undefined
                  }}
                >
                  {currentIdx < questions.length - 1 ? 'Next Question' : 'Finish Quiz'} <ChevronRight size={16} />
                </button>
              )}

              <button 
                className="btn btn-secondary" 
                onClick={handleFinishQuiz}
                title="Finish quiz and calculate final score"
                style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}
              >
                Finish Quiz
              </button>
            </div>
          </div>

          {/* Transparent Inline AI Tutor inside Question Box */}
          <AITutorDrawer 
            isOpen={showAITutor}
            onClose={() => setShowAITutor(false)}
            currentQuestion={currentQuestion}
            userAnswer={answersMap[currentIdx]}
            isSubmitted={submittedMap[currentIdx]}
            activeUser={activeUser}
            contextType="Quiz"
          />
        </div>

        {/* Explanation panel */}
        {isSubmitted && (
          <div className="explanation-panel animate-fade-in" style={{
            borderColor: selectedOpt === currentQuestion.correctAnswer ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
            background: selectedOpt === currentQuestion.correctAnswer ? 'rgba(16, 185, 129, 0.02)' : 'rgba(239, 68, 68, 0.02)'
          }}>
            <div className="watermark-overlay"></div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, color: selectedOpt === currentQuestion.correctAnswer ? 'var(--success)' : 'var(--danger)' }}>
                {selectedOpt === currentQuestion.correctAnswer ? (
                  <>
                    <CheckCircle size={16} /> Correct!
                  </>
                ) : (
                  <>
                    <XCircle size={16} /> Incorrect
                  </>
                )}
              </div>

              <button
                onClick={() => setShowAITutor(!showAITutor)}
                className="btn btn-ai"
                style={{
                  padding: '4px 12px',
                  fontSize: '0.8rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontWeight: 700
                }}
              >
                <Bot size={14} /> {showAITutor ? 'Hide Preppy' : 'Ask Preppy'}
              </button>
            </div>
            
            <div 
              style={{ fontSize: '0.9rem', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}
              dangerouslySetInnerHTML={{ __html: formatText(currentQuestion.explanation) }}
            />
          </div>
        )}
      </div>

      {/* Floating Sketchpad Panel */}
      {showScratchpad && (
        <div style={{ width: '100%', marginTop: '16px' }} className="animate-fade-in">
          <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h4 style={{ fontSize: '1.05rem', color: 'var(--accent-quant)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Edit3 size={16} style={{ color: 'var(--accent-quant)' }} /> Scratchpad Calculations
            </h4>
          </div>
          <Scratchpad onClose={() => setShowScratchpad(false)} />
        </div>
      )}
    </div>
  );
}
