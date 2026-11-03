import React, { useState, useMemo } from 'react';
import {
  Flame,
  CheckCircle,
  XCircle,
  Bot,
  Sparkles,
  Eye,
  EyeOff,
  Search,
  BookOpen,
  Calculator,
  RotateCcw,
  Maximize,
  Minimize
} from 'lucide-react';
import { nov2Leaks } from '../data/nov2Leaks.js';
import AITutorDrawer from './AITutorDrawer.jsx';
import { formatMathAndText, formatPassageWithHighlight } from '../utils/gatFormatters.js';

export default function LeaksHub({ activeUser }) {
  const [filterTab, setFilterTab] = useState('all'); // 'all', 'quant', 'verbal', 'passages', 'geometry'
  const [searchQuery, setSearchQuery] = useState('');
  const [revealAll, setRevealAll] = useState(false);
  const [selectedAnswers, setSelectedAnswers] = useState({}); // { [q.id]: optIdx }
  const [openTutorMap, setOpenTutorMap] = useState({}); // { [q.id]: boolean }
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

  const filteredQuestions = useMemo(() => {
    return nov2Leaks.filter((q) => {
      if (filterTab === 'quant' && q.section !== 'Quantitative') return false;
      if (filterTab === 'verbal' && q.section !== 'Verbal') return false;
      if (filterTab === 'passages' && q.category !== 'Reading Comprehension') return false;
      if (filterTab === 'geometry' && q.category !== 'Geometry' && q.category !== 'Data Analysis') return false;

      if (searchQuery.trim()) {
        const needle = searchQuery.toLowerCase();
        const plainQ = (q.question || '').replace(/<[^>]+>/g, ' ').toLowerCase();
        const plainP = (q.passage || '').toLowerCase();
        const plainOpts = (q.options || []).join(' ').toLowerCase();
        const plainCat = (q.category || '').toLowerCase();
        return (
          plainQ.includes(needle) ||
          plainP.includes(needle) ||
          plainOpts.includes(needle) ||
          plainCat.includes(needle)
        );
      }
      return true;
    });
  }, [filterTab, searchQuery]);

  const handleSelectOption = (qId, optIdx) => {
    setSelectedAnswers((prev) => ({ ...prev, [qId]: optIdx }));
  };

  const toggleTutor = (qId) => {
    setOpenTutorMap((prev) => ({ ...prev, [qId]: !prev[qId] }));
  };

  const handleResetAll = () => {
    setSelectedAnswers({});
    setRevealAll(false);
  };

  const answeredCount = Object.keys(selectedAnswers).length;
  const correctCount = nov2Leaks.reduce((acc, q) => {
    return selectedAnswers[q.id] === q.correctAnswer ? acc + 1 : acc;
  }, 0);

  return (
    <div
      className="animate-fade-in"
      style={
        isFullscreen
          ? {
              position: 'fixed',
              inset: 0,
              zIndex: 9500,
              background: 'var(--bg-primary)',
              padding: '24px 32px',
              overflowY: 'auto',
            }
          : { maxWidth: '980px', margin: '0 auto', paddingBottom: '60px' }
      }
    >
      {/* Top Header Card */}
      <div
        className="glass-panel"
        style={{
          padding: '24px 28px',
          marginBottom: '20px',
          borderLeft: '4px solid #f59e0b',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 10px',
                  borderRadius: '999px',
                  background: 'rgba(245, 158, 11, 0.15)',
                  color: '#f59e0b',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                }}
              >
                <Flame size={14} /> Verified Exam Leaks
              </span>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                November 2 Exam • {nov2Leaks.length} Questions
              </span>
            </div>
            <h1 style={{ fontSize: '1.85rem', fontFamily: 'Outfit', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
              Nov 2 Exam Leaks
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', margin: '6px 0 0 0', lineHeight: 1.5 }}>
              Scroll through all questions that appeared on the Nov 2 exam, including all 4 Reading Comprehension passages with their complete question sets, Analogies, and Quantitative problems. Click any choice to test yourself or reveal all answers at once.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
            <button
              onClick={() => setRevealAll(!revealAll)}
              className="btn btn-primary"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 16px',
                background: revealAll ? 'linear-gradient(135deg, #10b981, #059669)' : 'linear-gradient(135deg, #f59e0b, #d97706)',
                color: '#ffffff',
                border: 'none',
                fontWeight: 700,
              }}
            >
              {revealAll ? <EyeOff size={16} /> : <Eye size={16} />}
              <span>{revealAll ? 'Hide Answers (Practice Mode)' : 'Reveal All Answers'}</span>
            </button>

            {answeredCount > 0 && (
              <button
                onClick={handleResetAll}
                className="btn btn-secondary"
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 14px' }}
              >
                <RotateCcw size={15} /> Reset ({correctCount}/{answeredCount})
              </button>
            )}

            <button
              onClick={toggleFullscreen}
              className="btn btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 14px' }}
            >
              {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
              <span>{isFullscreen ? 'Exit Full Screen' : 'Full Screen'}</span>
            </button>
          </div>
        </div>

        {/* Filter Pills & Search Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', paddingTop: '8px', borderTop: '1px solid var(--glass-border)' }}>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {[
              { id: 'all', label: `All (${nov2Leaks.length})` },
              { id: 'quant', label: `Quantitative (${nov2Leaks.filter(q => q.section === 'Quantitative').length})` },
              { id: 'verbal', label: `Verbal (${nov2Leaks.filter(q => q.section === 'Verbal').length})` },
              { id: 'passages', label: `Passages (${nov2Leaks.filter(q => q.category === 'Reading Comprehension').length})` },
              { id: 'geometry', label: `Geometry & Charts (${nov2Leaks.filter(q => q.category === 'Geometry' || q.category === 'Data Analysis').length})` },
            ].map((tab) => {
              const active = filterTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setFilterTab(tab.id)}
                  style={{
                    padding: '7px 14px',
                    borderRadius: '999px',
                    fontSize: '0.83rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    border: active ? '1.5px solid #f59e0b' : '1px solid var(--glass-border)',
                    background: active ? 'rgba(245, 158, 11, 0.16)' : 'var(--bg-tertiary)',
                    color: active ? '#f59e0b' : 'var(--text-secondary)',
                    transition: 'all 0.2s',
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--glass-border)',
              borderRadius: '10px',
              padding: '7px 12px',
              minWidth: '230px',
            }}
          >
            <Search size={15} style={{ color: 'var(--text-secondary)' }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search questions or passages..."
              style={{
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: 'var(--text-primary)',
                fontSize: '0.85rem',
                width: '100%',
              }}
            />
          </div>
        </div>
      </div>

      {/* Scrollable Feed of Quiz-Styled Question Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {filteredQuestions.map((q, idx) => {
          const isQuant = q.section === 'Quantitative';
          const selectedOpt = selectedAnswers[q.id] ?? null;
          const isSubmitted = revealAll || selectedOpt !== null;
          const showTutor = !!openTutorMap[q.id];

          // Check if this is the first question of a Reading Comprehension passage group
          const prevQ = idx > 0 ? filteredQuestions[idx - 1] : null;
          const isNewPassageGroup = q.passage && (!prevQ || prevQ.passageTitle !== q.passageTitle);

          return (
            <React.Fragment key={q.id}>
              {isNewPassageGroup && q.passageTitle && (
                <div
                  style={{
                    padding: '12px 18px',
                    borderRadius: '10px',
                    background: 'rgba(217, 70, 239, 0.1)',
                    border: '1px solid rgba(217, 70, 239, 0.3)',
                    color: 'var(--accent-verbal)',
                    fontWeight: 700,
                    fontSize: '0.95rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginTop: idx > 0 ? '12px' : '0',
                  }}
                >
                  <BookOpen size={18} />
                  <span>{q.passageTitle}</span>
                </div>
              )}

              <div className="glass-panel question-card" style={{ padding: '26px' }}>
                <div className="watermark-overlay"></div>

                {/* Card Header */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '10px',
                    position: 'relative',
                    zIndex: 1,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span
                      style={{
                        fontSize: '0.76rem',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        background: 'rgba(245, 158, 11, 0.15)',
                        color: '#f59e0b',
                        fontWeight: 800,
                      }}
                    >
                      #{idx + 1}
                    </span>
                    <span
                      style={{
                        fontSize: '0.75rem',
                        padding: '4px 9px',
                        borderRadius: '4px',
                        background: isQuant ? 'rgba(0, 210, 255, 0.1)' : 'rgba(217, 70, 239, 0.1)',
                        color: isQuant ? 'var(--accent-quant)' : 'var(--accent-verbal)',
                        fontWeight: 700,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      {isQuant ? <Calculator size={12} /> : <BookOpen size={12} />}
                      {q.category}
                    </span>
                    {q.examNote && (
                      <span
                        style={{
                          fontSize: '0.73rem',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          background: 'rgba(255,255,255,0.05)',
                          color: 'var(--text-secondary)',
                          fontWeight: 600,
                        }}
                      >
                        {q.examNote}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => toggleTutor(q.id)}
                    className="btn btn-ai"
                    style={{
                      padding: '6px 13px',
                      fontSize: '0.8rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontWeight: 700,
                    }}
                  >
                    <Bot size={15} />
                    <span>{showTutor ? 'Hide Preppy' : 'Ask Preppy'}</span>
                    <Sparkles size={12} />
                  </button>
                </div>

                {/* Reading Comprehension Passage (with Answer-Source Highlight when submitted/revealed) */}
                {q.passage && (
                  <div style={{ marginTop: '16px', position: 'relative', zIndex: 1 }}>
                    {isSubmitted && (
                      <div
                        style={{
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          color: '#f59e0b',
                          marginBottom: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                        }}
                      >
                        <Sparkles size={13} /> Answer source highlighted in the passage below:
                      </div>
                    )}
                    <div
                      style={{
                        padding: '16px',
                        background: 'rgba(255,255,255,0.03)',
                        borderLeft: '4px solid var(--accent-verbal)',
                        borderRadius: '0 8px 8px 0',
                        fontSize: '0.95rem',
                        lineHeight: 1.75,
                        color: 'var(--text-primary)',
                        whiteSpace: 'pre-wrap',
                      }}
                      dangerouslySetInnerHTML={{
                        __html: formatPassageWithHighlight(q.passage, q, isSubmitted),
                      }}
                    />
                  </div>
                )}

                {/* Question Stem & SVG Figure */}
                <h3
                  style={{
                    fontSize: '1.22rem',
                    marginTop: '16px',
                    fontWeight: 500,
                    lineHeight: 1.6,
                    whiteSpace: 'pre-wrap',
                    position: 'relative',
                    zIndex: 1,
                  }}
                  dangerouslySetInnerHTML={{
                    __html: formatMathAndText(q.question, { isQuestionStem: true }),
                  }}
                />

                {/* Options List */}
                <div className="options-list" style={{ position: 'relative', zIndex: 1 }}>
                  {q.options.map((opt, optIdx) => {
                    let btnClass = '';
                    if (isSubmitted) {
                      if (optIdx === q.correctAnswer) {
                        btnClass = 'correct';
                      } else if (selectedOpt === optIdx) {
                        btnClass = 'incorrect';
                      }
                    } else if (selectedOpt === optIdx) {
                      btnClass = 'selected';
                    }

                    return (
                      <button
                        key={optIdx}
                        onClick={() => handleSelectOption(q.id, optIdx)}
                        className={`option-btn ${btnClass}`}
                      >
                        <span
                          style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            background:
                              isSubmitted && optIdx === q.correctAnswer
                                ? 'var(--success)'
                                : selectedOpt === optIdx
                                ? isQuant
                                  ? 'var(--accent-quant)'
                                  : 'var(--accent-verbal)'
                                : 'rgba(255,255,255,0.05)',
                            color:
                              (isSubmitted && optIdx === q.correctAnswer) || selectedOpt === optIdx
                                ? '#ffffff'
                                : 'var(--text-primary)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginRight: '12px',
                            fontSize: '0.8rem',
                            fontWeight: 'bold',
                            flexShrink: 0,
                          }}
                        >
                          {String.fromCharCode(65 + optIdx)}
                        </span>
                        <span dangerouslySetInnerHTML={{ __html: formatMathAndText(opt) }} />
                      </button>
                    );
                  })}
                </div>

                {/* Inline Explanation Box when answered or revealed */}
                {isSubmitted && (
                  <div
                    className="animate-fade-in"
                    style={{
                      marginTop: '16px',
                      padding: '14px 16px',
                      borderRadius: '10px',
                      borderLeft: `4px solid ${
                        selectedOpt === null || selectedOpt === q.correctAnswer
                          ? 'var(--success)'
                          : 'var(--danger)'
                      }`,
                      background:
                        selectedOpt === null || selectedOpt === q.correctAnswer
                          ? 'rgba(16, 185, 129, 0.06)'
                          : 'rgba(239, 68, 68, 0.06)',
                      position: 'relative',
                      zIndex: 1,
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontWeight: 700,
                        fontSize: '0.88rem',
                        marginBottom: '6px',
                        color:
                          selectedOpt === null || selectedOpt === q.correctAnswer
                            ? 'var(--success)'
                            : 'var(--danger)',
                      }}
                    >
                      {selectedOpt === null ? (
                        <>
                          <CheckCircle size={16} /> Correct Answer: {String.fromCharCode(65 + q.correctAnswer)}
                        </>
                      ) : selectedOpt === q.correctAnswer ? (
                        <>
                          <CheckCircle size={16} /> Correct! ({String.fromCharCode(65 + q.correctAnswer)})
                        </>
                      ) : (
                        <>
                          <XCircle size={16} /> Incorrect — Correct Answer is {String.fromCharCode(65 + q.correctAnswer)}
                        </>
                      )}
                    </div>
                    <div
                      style={{ fontSize: '0.92rem', lineHeight: 1.55, color: 'var(--text-primary)' }}
                      dangerouslySetInnerHTML={{ __html: formatMathAndText(q.explanation) }}
                    />
                  </div>
                )}

                {/* Transparent Inline Preppy AI Tutor */}
                <AITutorDrawer
                  isOpen={showTutor}
                  onClose={() => toggleTutor(q.id)}
                  currentQuestion={q}
                  userAnswer={selectedOpt}
                  isSubmitted={isSubmitted}
                  activeUser={activeUser}
                  contextType="Leaks"
                />
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
