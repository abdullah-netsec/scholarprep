import React, { useState } from 'react';
import { 
  BookOpen, 
  Sparkles, 
  ArrowRight, 
  ChevronDown, 
  ChevronUp,
  Download,
  GraduationCap,
  Lock,
  Award
} from 'lucide-react';
import { verbalQuestions } from '../data/verbalQuestions.js';
import { verbalConcepts } from '../data/verbalConcepts.js';
import PracticeQuiz from './PracticeQuiz.jsx';
import Flashcards from './Flashcards.jsx';

export default function VerbalHub({ stats, updateStats, recordQuizResults, activeUser, onAuthRequired, onReadPdf }) {
  const [activeSubTab, setActiveSubTab] = useState(() => {
    const hash = window.location.hash.replace(/^#\/?/, '');
    const parts = hash.split('/');
    if (parts[0] === 'verbal' && parts.length > 1) {
      return (parts[1] === 'concepts' || parts[1] === 'modules') ? parts[1] : 'concepts';
    }
    return 'concepts';
  });

  React.useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace(/^#\/?/, '');
      const parts = hash.split('/');
      if (parts[0] === 'verbal' && parts.length > 1) {
        if (parts[1] === 'concepts' || parts[1] === 'modules') {
          setActiveSubTab(parts[1]);
        }
      } else if (parts[0] === 'verbal') {
        setActiveSubTab('concepts');
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    
    if (window.location.hash === '#/verbal' || window.location.hash === '#verbal') {
        window.location.replace('#/verbal/concepts');
    }
    
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);
  const [expandedConcept, setExpandedConcept] = useState('analogies');
  const [showFlashcards, setShowFlashcards] = useState(false);
  const [activeQuizQuestions, setActiveQuizQuestions] = useState(null);
  const [quizTitle, setQuizTitle] = useState('GAT Verbal General Practice');
  const handleStartCategoryQuiz = (categoryName, part) => {
    if (!activeUser) {
      onAuthRequired();
      return;
    }
    // Find all questions in this category
    let filtered = verbalQuestions.filter(q => q.category && q.category.toLowerCase() === categoryName.toLowerCase());
    if (filtered.length === 0) {
      filtered = [...verbalQuestions];
    }
    
    // Divide by 25 questions per quiz
    const startIdx = (part - 1) * 25;
    const endIdx = part * 25;
    let selected = filtered.slice(startIdx, endIdx);
    
    // Fallback if not enough questions
    if (selected.length === 0) {
      selected = categoryName.toLowerCase() === 'reading comprehension'
        ? filtered.slice(0, 25)
        : [...filtered].sort(() => Math.random() - 0.5).slice(0, 25);
    }
    
    // Keep Reading Comprehension grouped by passage so students answer passage questions consecutively
    const finalQuestions = categoryName.toLowerCase() === 'reading comprehension'
      ? selected
      : [...selected].sort(() => Math.random() - 0.5);
    setQuizTitle(`${categoryName} - Quiz ${part}`);
    setActiveQuizQuestions(finalQuestions);
  };

  const handleQuizFinish = (totalQ, accuracy, questionStats) => {
    const totalCompleted = stats.verbalCompleted + totalQ;
    let newAccuracy = stats.verbalAccuracy;
    
    if (stats.verbalCompleted === 0) {
      newAccuracy = accuracy;
    } else {
      newAccuracy = Math.round(((stats.verbalAccuracy * stats.verbalCompleted) + (accuracy * totalQ)) / totalCompleted);
    }

    updateStats({
      verbalCompleted: totalCompleted,
      verbalAccuracy: newAccuracy
    });

    if (recordQuizResults) {
      recordQuizResults(questionStats);
    }
  };

  const handleReadPdf = (pdfUrl, filename) => {
    if (!activeUser) {
      onAuthRequired();
      return;
    }
    if (onReadPdf) {
      onReadPdf({ url: pdfUrl, filename });
    }
  };

  // Helper to format math and markdown text inside Verbal Hub
  const formatText = (text) => {
    if (!text) return '';
    let formatted = text
      .replace(/\\times/g, '×')
      .replace(/\\div/g, '÷')
      .replace(/\\le/g, '≤')
      .replace(/\\ge/g, '≥')
      .replace(/\\implies/g, '→')
      .replace(/\\pi/g, 'π')
      .replace(/\\sqrt/g, '√')
      .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1/$2)')
      .replace(/\\text\{([^}]+)\}/g, '$1')
      .replace(/\\approx/g, '≈');

    formatted = formatted.replace(/([a-zA-Z0-9)]+)\^\{([^}]+)\}/g, '$1<sup>$2</sup>');
    formatted = formatted.replace(/([a-zA-Z0-9)]+)\^([a-zA-Z0-9]+)/g, '$1<sup>$2</sup>');

    formatted = formatted.replace(/([a-zA-Z0-9)]+)_\{([^}]+)\}/g, '$1<sub>$2</sub>');
    formatted = formatted.replace(/([a-zA-Z0-9)]+)_([a-zA-Z0-9]+)/g, '$1<sub>$2</sub>');

    formatted = formatted.replace(/\*\*([^\*]+)\*\*/g, '<strong>$1</strong>');
    formatted = formatted.replace(/\*([^\*]+)\*/g, '<em>$1</em>');
    formatted = formatted.replace(/\$/g, '');
    
    formatted = formatted.replace(/\[Figure:\s*(.*?)\]/gi, '<div style="background:var(--bg-secondary); padding:12px; border-left:4px solid var(--accent-quant); margin:12px 0; font-style:italic; border-radius:4px;"><strong>Figure:</strong> $1</div>');
    formatted = formatted.replace(/\[FIGURE:\s*(.*?)\]/gi, '<div style="background:var(--bg-secondary); padding:12px; border-left:4px solid var(--accent-quant); margin:12px 0; font-style:italic; border-radius:4px;"><strong>Figure:</strong> $1</div>');

    formatted = formatted.replace(/\n/g, '<br/>');

    return formatted;
  };

  if (showFlashcards) {
    return <Flashcards onClose={() => setShowFlashcards(false)} />;
  }

  if (activeQuizQuestions) {
    return (
      <PracticeQuiz 
        questions={activeQuizQuestions} 
        categoryTitle={quizTitle}
        isQuant={false}
        activeUser={activeUser}
        onClose={() => setActiveQuizQuestions(null)}
        onFinish={handleQuizFinish}
      />
    );
  }

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 32, position: 'relative' }}>
      
      {/* Page Header */}
      <section style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h2 style={{ fontSize: '2rem', display: 'flex', alignItems: 'center', gap: '12px', fontFamily: 'Outfit' }}>
            <BookOpen style={{ color: 'var(--accent-verbal)' }} /> Verbal Reasoning
          </h2>
          <p style={{ color: 'var(--text-secondary)' }}>Master verbal reasoning concepts, study high-frequency GAT vocabulary, and complete practice tests.</p>
        </div>
      </section>

      {/* Verbal Mock Test Banner */}
      <a 
        href="#/mock-test/verbal" 
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '18px 24px',
          background: 'linear-gradient(135deg, rgba(13, 148, 136, 0.12), rgba(15, 45, 74, 0.25))',
          border: '1.5px solid #0d9488',
          borderRadius: '12px',
          textDecoration: 'none',
          color: 'inherit',
          cursor: 'pointer',
          flexWrap: 'wrap',
          gap: 12
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#0d9488', fontWeight: 800, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 4 }}>
            <Award size={16} /> Computerized Simulation
          </div>
          <h3 style={{ margin: 0, fontSize: '1.2rem', fontFamily: 'Outfit', color: 'var(--text-primary)' }}>
            Take Verbal Mock Exam Alone (48 Questions)
          </h3>
          <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: '0.86rem' }}>
            2 Timed sections • 24 English questions each (50 mins total) • Pure Analogies, Sentence Completion, Errors & Reading Comprehension
          </p>
        </div>
        <button className="btn btn-primary" style={{ pointerEvents: 'none', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, padding: '10px 20px', background: '#0d9488', borderColor: '#0d9488' }}>
          Start Verbal Exam <ArrowRight size={16} />
        </button>
      </a>

      {/* Sub-Tabs: Concepts vs Modules */}
      <div className="tab-container">
        <button 
          onClick={() => { setActiveSubTab('concepts'); window.location.hash = '/verbal/concepts'; }}
          className={`section-tab verbal ${activeSubTab === 'concepts' ? 'active' : ''}`}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <GraduationCap size={16} /> Concepts (Learn)
          </span>
        </button>
        <button 
          onClick={() => { setActiveSubTab('modules'); window.location.hash = '/verbal/modules'; }}
          className={`section-tab verbal ${activeSubTab === 'modules' ? 'active' : ''}`}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <BookOpen size={16} /> Practice Modules (Practice)
          </span>
        </button>
      </div>

      {/* Concepts Tab */}
      {activeSubTab === 'concepts' && (
        <div className="concept-list">
          {/* Main Verbal PDF Study Guide */}
          <div className="glass-panel pdf-card verbal animate-fade-in" style={{ padding: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 24, marginBottom: '8px' }}>
            <div>
              <h3 style={{ fontSize: '1.4rem', marginBottom: '8px', fontFamily: 'Outfit' }}>Verbal Prep Guide</h3>
              <p style={{ color: 'var(--text-secondary)', maxWidth: '600px', fontSize: '0.95rem' }}>
                Access the official GAT Verbal Reasoning study guide. Covers vocabulary builders, analogy categorization matrices, grammar rules, and complete strategy sheets.
              </p>
            </div>
            
            <div style={{ display: 'flex', gap: 12 }}>
              <button 
                onClick={() => handleReadPdf("/resources/Verbal/Scholar-GAT-English-Verbal-Section.pdf", "Scholar-GAT-English-Verbal-Section.pdf")}
                className="btn btn-verbal"
                style={{ padding: '12px 24px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 8 }}
              >
                {!activeUser && <Lock size={16} />} Read Study Guide
              </button>
            </div>
          </div>

          {verbalConcepts.map((concept) => (
            <div 
              key={concept.id} 
              className="glass-panel concept-card"
              style={{
                borderColor: expandedConcept === concept.id ? 'var(--accent-verbal)' : undefined
              }}
            >
              <div 
                className="concept-header"
                onClick={() => setExpandedConcept(expandedConcept === concept.id ? null : concept.id)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ 
                    width: '36px', 
                    height: '36px', 
                    borderRadius: '50%', 
                    background: 'rgba(217, 70, 239, 0.1)', 
                    color: 'var(--accent-verbal)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <BookOpen size={18} />
                  </div>
                  <h3 style={{ fontSize: '1.25rem', fontFamily: 'Outfit' }}>{concept.title}</h3>
                </div>
                {expandedConcept === concept.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </div>

              {expandedConcept === concept.id && (
                <div className="concept-body animate-fade-in">
                  <p 
                    style={{ fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '20px' }}
                    dangerouslySetInnerHTML={{ __html: formatText(concept.description) }}
                  />

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div>
                      <h4 style={{ color: 'var(--accent-verbal)', fontSize: '0.95rem', marginBottom: '8px', fontWeight: 'bold', textTransform: 'uppercase' }}>
                        Solving Strategies:
                      </h4>
                      <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.9rem' }}>
                        {concept.strategies.map((strat, sIdx) => (
                          <li key={sIdx} dangerouslySetInnerHTML={{ __html: formatText(strat) }} />
                        ))}
                      </ul>
                    </div>

                    {concept.examples && concept.examples.map((ex, exIdx) => (
                      <div key={exIdx} className="example-box" style={{ background: 'rgba(217, 70, 239, 0.02)', borderColor: 'rgba(217, 70, 239, 0.15)' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--accent-verbal)', fontWeight: 'bold', textTransform: 'uppercase' }}>
                          Example Problem:
                        </span>
                        {ex.pair && (
                          <div 
                            style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--text-primary)', margin: '8px 0' }}
                            dangerouslySetInnerHTML={{ __html: formatText(ex.pair) }}
                          />
                        )}
                        {ex.sentence && (
                          <div 
                            style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--text-primary)', margin: '8px 0' }}
                            dangerouslySetInnerHTML={{ __html: formatText(ex.sentence) }}
                          />
                        )}
                        {ex.passage && (
                          <div 
                            style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', background: 'rgba(0,0,0,0.1)', padding: 12, borderRadius: 4, margin: '8px 0' }}
                            dangerouslySetInnerHTML={{ __html: formatText(ex.passage) }}
                          />
                        )}
                        {ex.question && (
                          <div 
                            style={{ fontSize: '0.95rem', fontWeight: 'bold', color: 'var(--text-primary)', margin: '8px 0' }}
                            dangerouslySetInnerHTML={{ __html: formatText(ex.question) }}
                          />
                        )}

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, margin: '12px 0' }}>
                          {ex.options.map((opt, oIdx) => (
                            <div 
                              key={oIdx} 
                              style={{ 
                                padding: '8px 12px', 
                                border: opt === ex.correct ? '1px solid var(--success)' : '1px solid var(--glass-border)', 
                                background: opt === ex.correct ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255,255,255,0.02)', 
                                borderRadius: 4,
                                fontSize: '0.85rem',
                                color: opt === ex.correct ? 'var(--success)' : 'var(--text-secondary)'
                              }}
                            >
                              <strong>{String.fromCharCode(65 + oIdx)}.</strong> <span dangerouslySetInnerHTML={{ __html: formatText(opt) }} />
                            </div>
                          ))}
                        </div>

                        {ex.explanation && (
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', borderTop: '1px dashed var(--glass-border)', paddingTop: 10 }}>
                            <strong>Explanation:</strong> <span dangerouslySetInnerHTML={{ __html: formatText(ex.explanation) }} />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Practice Modules Tab */}
      {activeSubTab === 'modules' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Categorized Practice Quizzes */}
          <div style={{ marginTop: '4px' }}>
            <h3 style={{ fontSize: '1.4rem', marginBottom: '16px', fontFamily: 'Outfit' }}>Topic-Specific Practice</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, flexWrap: 'wrap' }}>
              
              {/* Flashcards Box */}
              <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <h4 style={{ fontSize: '1.2rem', marginBottom: '8px', fontFamily: 'Outfit' }}>Vocabulary Flashcards</h4>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '20px' }}>
                    Study 100+ high-frequency synonyms, antonyms, and word associations using our 3D flippable flashcard deck.
                  </p>
                </div>
                <button className="btn btn-secondary" onClick={() => setShowFlashcards(true)} style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
                  Open Flashcards <ArrowRight size={16} style={{ marginLeft: 6 }} />
                </button>
              </div>

              {/* Analogy Box */}
              <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <h4 style={{ fontSize: '1.2rem', marginBottom: '8px', fontFamily: 'Outfit' }}>Analogy</h4>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '20px' }}>
                    Identify relationships between word pairs and find the matching relationship.
                  </p>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <button className="btn btn-verbal" onClick={() => handleStartCategoryQuiz('Analogy', 1)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px' }}>
                    {!activeUser && <Lock size={14} />} Quiz 1
                  </button>
                  <button className="btn btn-verbal" onClick={() => handleStartCategoryQuiz('Analogy', 2)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px' }}>
                    {!activeUser && <Lock size={14} />} Quiz 2
                  </button>
                  <button className="btn btn-verbal" onClick={() => handleStartCategoryQuiz('Analogy', 3)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px' }}>
                    {!activeUser && <Lock size={14} />} Quiz 3
                  </button>
                  <button className="btn btn-verbal" onClick={() => handleStartCategoryQuiz('Analogy', 4)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px' }}>
                    {!activeUser && <Lock size={14} />} Quiz 4
                  </button>
                </div>
              </div>

              {/* Sentence Completion Box */}
              <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <h4 style={{ fontSize: '1.2rem', marginBottom: '8px', fontFamily: 'Outfit' }}>Sentence Completion</h4>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '20px' }}>
                    Fill in the blanks using contextual clues and logic.
                  </p>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <button className="btn btn-verbal" onClick={() => handleStartCategoryQuiz('Sentence Completion', 1)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px' }}>
                    {!activeUser && <Lock size={14} />} Quiz 1
                  </button>
                  <button className="btn btn-verbal" onClick={() => handleStartCategoryQuiz('Sentence Completion', 2)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px' }}>
                    {!activeUser && <Lock size={14} />} Quiz 2
                  </button>
                  <button className="btn btn-verbal" onClick={() => handleStartCategoryQuiz('Sentence Completion', 3)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px' }}>
                    {!activeUser && <Lock size={14} />} Quiz 3
                  </button>
                  <button className="btn btn-verbal" onClick={() => handleStartCategoryQuiz('Sentence Completion', 4)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px' }}>
                    {!activeUser && <Lock size={14} />} Quiz 4
                  </button>
                </div>
              </div>

              {/* Contextual Error Box */}
              <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <h4 style={{ fontSize: '1.2rem', marginBottom: '8px', fontFamily: 'Outfit' }}>Contextual Error</h4>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '20px' }}>
                    Identify the word that contradicts the sentence's overall meaning.
                  </p>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <button className="btn btn-verbal" onClick={() => handleStartCategoryQuiz('Contextual Error', 1)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px' }}>
                    {!activeUser && <Lock size={14} />} Quiz 1
                  </button>
                  <button className="btn btn-verbal" onClick={() => handleStartCategoryQuiz('Contextual Error', 2)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px' }}>
                    {!activeUser && <Lock size={14} />} Quiz 2
                  </button>
                  <button className="btn btn-verbal" onClick={() => handleStartCategoryQuiz('Contextual Error', 3)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px' }}>
                    {!activeUser && <Lock size={14} />} Quiz 3
                  </button>
                  <button className="btn btn-verbal" onClick={() => handleStartCategoryQuiz('Contextual Error', 4)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px' }}>
                    {!activeUser && <Lock size={14} />} Quiz 4
                  </button>
                </div>
              </div>

              {/* Reading Comprehension Box */}
              <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <h4 style={{ fontSize: '1.2rem', marginBottom: '8px', fontFamily: 'Outfit' }}>Reading Comprehension</h4>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '20px' }}>
                    Read passages and answer questions based on the text.
                  </p>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <button className="btn btn-verbal" onClick={() => handleStartCategoryQuiz('Reading Comprehension', 1)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px' }}>
                    {!activeUser && <Lock size={14} />} Quiz 1
                  </button>
                  <button className="btn btn-verbal" onClick={() => handleStartCategoryQuiz('Reading Comprehension', 2)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px' }}>
                    {!activeUser && <Lock size={14} />} Quiz 2
                  </button>
                  <button className="btn btn-verbal" onClick={() => handleStartCategoryQuiz('Reading Comprehension', 3)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px' }}>
                    {!activeUser && <Lock size={14} />} Quiz 3
                  </button>
                  <button className="btn btn-verbal" onClick={() => handleStartCategoryQuiz('Reading Comprehension', 4)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px' }}>
                    {!activeUser && <Lock size={14} />} Quiz 4
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
