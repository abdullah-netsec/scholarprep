import React, { useState, useEffect } from 'react';
import { 
  Calculator, 
  BookOpen, 
  Award, 
  Flame, 
  ArrowRight, 
  Sparkles, 
  Clock, 
  CheckCircle,
  TrendingUp,
  Bot,
  Bookmark,
  Trash2,
  X,
  Edit3
} from 'lucide-react';
import { isFirebaseEnabled, db, collection, query, where, getDocs, deleteDoc, doc } from '../firebase.js';
import { formatMathAndText } from '../utils/gatFormatters.js';

export default function Dashboard({ stats, onNavigate, isDarkMode = true }) {
  const logoSrc = isDarkMode ? '/logo_dark.png' : '/logo.png';
  const [savedWork, setSavedWork] = useState([]);
  const [mistakes, setMistakes] = useState([]);
  const [portfolioTab, setPortfolioTab] = useState('saved'); // 'saved' or 'mistakes'
  const [activeReview, setActiveReview] = useState(null);
  const [activeUser, setActiveUser] = useState(null);
  const [legalModal, setLegalModal] = useState(null); // 'terms' | 'privacy' | null

  // Load user-specific active profile and saved reviews on mount
  useEffect(() => {
    const savedProfile = localStorage.getItem('scholar_gat_active_user');
    if (savedProfile) {
      try {
        const user = JSON.parse(savedProfile);
        setActiveUser(user);
        
        const key = `scholar_gat_saved_work_${user.email.replace(/[@.]/g, '_')}`;
        const localItems = JSON.parse(localStorage.getItem(key) || '[]');
        setSavedWork(localItems);

        const mistakesKey = `scholar_gat_mistakes_${user.email.replace(/[@.]/g, '_')}`;
        const localMistakes = JSON.parse(localStorage.getItem(mistakesKey) || '[]');
        setMistakes(localMistakes);

        // Fetch from Cloud Firestore if live database is enabled
        if (isFirebaseEnabled && db) {
          // Fetch saved work
          const q = query(collection(db, "saved_work"), where("userEmail", "==", user.email.toLowerCase()));
          getDocs(q).then(querySnapshot => {
            const cloudItems = [];
            querySnapshot.forEach((doc) => {
              cloudItems.push(doc.data());
            });
            
            if (cloudItems.length > 0) {
              const merged = [...localItems];
              cloudItems.forEach(cItem => {
                if (!merged.some(lItem => lItem.id === cItem.id)) {
                  merged.push(cItem);
                }
              });
              setSavedWork(merged);
              localStorage.setItem(key, JSON.stringify(merged));
            }
          }).catch(e => console.error("Error loading saved work from Firestore", e));

          // Fetch mistakes
          const qM = query(collection(db, "mistakes"), where("userEmail", "==", user.email.toLowerCase()));
          getDocs(qM).then(querySnapshot => {
            const cloudMistakes = [];
            querySnapshot.forEach((doc) => {
              cloudMistakes.push(doc.data());
            });
            
            if (cloudMistakes.length > 0) {
              const mergedMistakes = [...localMistakes];
              cloudMistakes.forEach(cItem => {
                if (!mergedMistakes.some(lItem => lItem.id === cItem.id)) {
                  mergedMistakes.push(cItem);
                }
              });
              setMistakes(mergedMistakes);
              localStorage.setItem(mistakesKey, JSON.stringify(mergedMistakes));
            }
          }).catch(e => console.error("Error loading mistakes from Firestore", e));
        }
      } catch (e) {
        console.error("Error loading saved reviews", e);
      }
    }
  }, []);

  const calculateReadiness = () => {
    const quantWeight = stats.quantCompleted > 0 ? (stats.quantAccuracy || 50) : 50;
    const verbalWeight = stats.verbalCompleted > 0 ? (stats.verbalAccuracy || 50) : 50;
    const testWeight = stats.testsTaken > 0 ? (stats.averageTestScore || 50) : 50;
    
    const readiness = Math.round((quantWeight * 0.35) + (verbalWeight * 0.35) + (testWeight * 0.30));
    return Math.max(50, Math.min(100, readiness));
  };

  const readinessScore = calculateReadiness();

  const handleDeleteReview = (id) => {
    if (!activeUser) return;
    const key = `scholar_gat_saved_work_${activeUser.email.replace(/[@.]/g, '_')}`;
    const updated = savedWork.filter(item => item.id !== id);
    setSavedWork(updated);
    localStorage.setItem(key, JSON.stringify(updated));

    // Delete from Cloud Firestore
    if (isFirebaseEnabled && db) {
      deleteDoc(doc(db, "saved_work", id))
        .catch(e => console.error("Error deleting work from Firestore", e));
    }
    setActiveReview(null);
  };

  const isToday = (someDate) => {
    const today = new Date();
    return someDate.getDate() === today.getDate() &&
      someDate.getMonth() === today.getMonth() &&
      someDate.getFullYear() === today.getFullYear();
  };

  const handleDownloadTodaySketches = () => {
    const todayStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const todayItems = savedWork.filter(item => {
      if (!item.savedAt) return false;
      return item.savedAt.includes(new Date().toLocaleDateString()) || item.savedAt.includes(todayStr);
    });

    if (todayItems.length === 0) {
      alert("No sketches saved today yet! Click 'Save Question & Work' during quizzes first.");
      return;
    }

    generateAndDownloadReport(todayItems, `Scholar-GAT-Today-Sketches-${todayStr}.html`);
  };

  const handleDownloadNotebook = (dateStr) => {
    const notebookItems = mistakes.filter(m => m.date === dateStr).map(m => ({
      id: m.id,
      category: m.category,
      questionText: m.questionText,
      selectedAnswer: m.selectedAnswer,
      correctAnswer: m.correctAnswer,
      explanation: m.explanation,
      isQuant: m.isQuant,
      savedAt: m.savedAt,
      canvasImage: null 
    }));

    generateAndDownloadReport(notebookItems, `Scholar-GAT-Mistake-Notebook-${dateStr}.html`);
  };

  const generateAndDownloadReport = (items, filename) => {
    const quantItems = items.filter(item => item.isQuant);
    const verbalItems = items.filter(item => !item.isQuant);

    const groupByModule = (itemList) => {
      const groups = {};
      itemList.forEach(item => {
        const mod = item.moduleTitle || "General Practice Hub";
        if (!groups[mod]) {
          groups[mod] = [];
        }
        groups[mod].push(item);
      });
      return groups;
    };

    const quantGroups = groupByModule(quantItems);
    const verbalGroups = groupByModule(verbalItems);

    let htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>ScholarPrep - Review Portfolio</title>
  <style>
    body {
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      background-color: #0e121b;
      color: #f8fafc;
      margin: 0;
      padding: 40px;
    }
    h1 {
      font-family: 'Outfit', sans-serif;
      color: #78c2e6;
      border-bottom: 2px solid #4a7a96;
      padding-bottom: 12px;
      margin-bottom: 32px;
    }
    h2 {
      font-family: 'Outfit', sans-serif;
      color: #a093c4;
      margin-top: 40px;
      border-bottom: 1px solid rgba(255,255,255,0.08);
      padding-bottom: 8px;
    }
    .module-sec {
      margin-left: 20px;
      margin-bottom: 30px;
    }
    h3 {
      color: #ffffff;
      margin-top: 24px;
    }
    .card {
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 24px;
    }
    .question {
      font-size: 1.1rem;
      color: #ffffff;
      line-height: 1.6;
      margin-bottom: 16px;
    }
    .meta {
      font-size: 0.8rem;
      color: #94a3b8;
      margin-bottom: 12px;
    }
    .answers {
      display: flex;
      gap: 16px;
      margin-bottom: 20px;
    }
    .answer-pill {
      background: rgba(255, 255, 255, 0.04);
      padding: 8px 16px;
      border-radius: 6px;
      font-size: 0.9rem;
    }
    .correct {
      border-left: 3px solid #10b981;
      color: #a7f3d0;
    }
    .explanation {
      background: rgba(16, 185, 129, 0.03);
      border: 1px solid rgba(16, 185, 129, 0.15);
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 20px;
      color: #94a3b8;
      font-size: 0.95rem;
    }
    .canvas-container {
      margin-top: 20px;
      background: #111827;
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 8px;
      padding: 12px;
      text-align: center;
    }
    .canvas-img {
      max-width: 100%;
      height: auto;
      border-radius: 4px;
    }
    .watermark-overlay {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      z-index: 9999;
      pointer-events: none;
      opacity: 0.085;
      background-image: url("data:image/svg+xml,%3Csvg width='360' height='220' xmlns='http://www.w3.org/2000/svg'%3E%3Cg font-family='Arial, Helvetica, sans-serif' font-weight='900' font-size='23' letter-spacing='6' fill='%23ffffff' stroke='rgba(0,0,0,0.45)' stroke-width='1' paint-order='stroke fill' text-anchor='middle' dominant-baseline='middle'%3E%3Ctext x='180' y='55' transform='rotate(-28 180 55)'%3ESCHOLARPREP%3C/text%3E%3Ctext x='0' y='165' transform='rotate(-28 0 165)'%3ESCHOLARPREP%3C/text%3E%3Ctext x='360' y='165' transform='rotate(-28 360 165)'%3ESCHOLARPREP%3C/text%3E%3C/g%3E%3C/svg%3E");
      background-repeat: repeat;
    }
  </style>
</head>
<body>
  <div class="watermark-overlay"></div>
  <h1>ScholarPrep - Review Portfolio & Sketches</h1>
  <p>Downloaded on: ${new Date().toLocaleDateString()}</p>
    `;

    // Render Quantitative
    if (Object.keys(quantGroups).length > 0) {
      htmlContent += `<h2>Quantitative Reasoning (Math)</h2>`;
      for (const [modTitle, modItems] of Object.entries(quantGroups)) {
        htmlContent += `<div class="module-sec"><h3>${modTitle}</h3>`;
        modItems.forEach(item => {
          htmlContent += renderItemHtml(item);
        });
        htmlContent += `</div>`;
      }
    }

    // Render Verbal
    if (Object.keys(verbalGroups).length > 0) {
      htmlContent += `<h2>Verbal Reasoning (English)</h2>`;
      for (const [modTitle, modItems] of Object.entries(verbalGroups)) {
        htmlContent += `<div class="module-sec"><h3>${modTitle}</h3>`;
        modItems.forEach(item => {
          htmlContent += renderItemHtml(item);
        });
        htmlContent += `</div>`;
      }
    }

    htmlContent += `
</body>
</html>
    `;

    // Trigger download
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderItemHtml = (item) => {
    let itemHtml = `
      <div class="card">
        <div class="meta">Category: ${item.category} | Saved on: ${item.savedAt}</div>
        <div class="question">${formatText(item.questionText)}</div>
        <div class="answers">
          <div class="answer-pill">Your Answer: <strong>${item.selectedAnswer !== -1 && item.selectedAnswer !== undefined ? String.fromCharCode(65 + item.selectedAnswer) : 'Skipped'}</strong></div>
          <div class="answer-pill correct">Correct Answer: <strong>${String.fromCharCode(65 + item.correctAnswer)}</strong></div>
        </div>
    `;

    if (item.explanation) {
      itemHtml += `
        <div class="explanation">
          <strong>Explanation:</strong><br/>
          ${formatText(item.explanation)}
        </div>
      `;
    }

    if (item.canvasImage) {
      itemHtml += `
        <div class="canvas-container">
          <div style="font-size: 0.8rem; color: #94a3b8; margin-bottom: 8px;">Scratchpad Work Stroke Canvas:</div>
          <img class="canvas-img" src="${item.canvasImage}" alt="Scratchpad Sketch" />
        </div>
      `;
    }

    itemHtml += `</div>`;
    return itemHtml;
  };

  const getGroupedMistakes = () => {
    const groups = {};
    mistakes.forEach(m => {
      const date = m.date || new Date(m.savedAt).toISOString().split('T')[0];
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(m);
    });
    return Object.keys(groups).map(date => ({
      date,
      items: groups[date]
    })).sort((a, b) => b.date.localeCompare(a.date));
  };

  // Helper to format math equations elegantly
  const formatText = (text) => formatMathAndText(text);

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      {/* Welcome Banner */}
      <section className="welcome-banner">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '24px', flexWrap: 'wrap-reverse', position: 'relative', zIndex: 2 }}>
          <div style={{ flex: '1 1 260px', minWidth: 0 }}>
            <h2 style={{ fontSize: '2.2rem', marginBottom: '8px', fontFamily: 'Outfit' }}>Welcome to ScholarPrep</h2>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '650px', fontSize: '1.05rem', marginBottom: '24px' }}>
              Your premier AI-powered test preparation platform for English GAT, STEP, and SAT. Practice interactive quantitative and verbal modules, track your progress with our smart advisor, and practice under real test conditions.
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <a href="#/mock-test" className="btn btn-primary" style={{ textDecoration: 'none' }} onClick={(e) => { e.preventDefault(); onNavigate('mock-test'); }}>
                Take Full Mock Test <ArrowRight size={16} />
              </a>
              <a href="#/ai-planner" className="btn btn-secondary" style={{ textDecoration: 'none' }} onClick={(e) => { e.preventDefault(); onNavigate('ai-planner'); }}>
                <Sparkles size={16} style={{ color: 'var(--accent-ai)' }} /> Preppy
              </a>
            </div>
          </div>
          
          <div style={{ flex: '0 0 auto', margin: '0 auto', display: 'flex', justifyContent: 'center' }}>
            <div className="logo-card">
              <img 
                src={isDarkMode ? '/logo_icon_dark.png' : '/logo_icon.png'} 
                alt="ScholarPrep Emblem" 
                width="120"
                height="120"
                style={{ width: "100%", height: "100%", objectFit: "contain" }} 
              />
            </div>
          </div>
        </div>
        <div style={{
          position: 'absolute',
          top: '-20%',
          right: '-10%',
          width: '300px',
          height: '300px',
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.2) 0%, transparent 70%)',
          filter: 'blur(30px)',
          zIndex: 1
        }} />
      </section>

      {/* Stats Row */}
      <section className="metrics-row">
        <div className="glass-panel metric-card">
          <div className="metric-icon-box primary">
            <TrendingUp size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Readiness Score</div>
            <div className="metric-val" style={{ color: readinessScore > 75 ? 'var(--success)' : 'var(--warning)' }}>
              {readinessScore} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>/ 100</span>
            </div>
          </div>
        </div>

        <div className="glass-panel metric-card">
          <div className="metric-icon-box quant">
            <Calculator size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Quant Accuracy</div>
            <div className="metric-val">
              {stats.quantAccuracy}% 
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', fontWeight: 'normal' }}>
                {stats.quantCompleted} completed
              </span>
            </div>
          </div>
        </div>

        <div className="glass-panel metric-card">
          <div className="metric-icon-box verbal">
            <BookOpen size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Verbal Accuracy</div>
            <div className="metric-val">
              {stats.verbalAccuracy}%
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', fontWeight: 'normal' }}>
                {stats.verbalCompleted} completed
              </span>
            </div>
          </div>
        </div>

        <div className="glass-panel metric-card">
          <div className="metric-icon-box ai">
            <Flame size={24} style={{ color: 'var(--accent-verbal)' }} />
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Study Streak</div>
            <div className="metric-val" style={{ color: 'var(--warning)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              {stats.streak} <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>days</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Grid */}
      <div className="dashboard-grid">
        {/* Left Side: Test Structure, Prep Materials, and SAVED REVIEWS PORTFOLIO */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          
          {/* Today's Study Plan if created */}
          {stats.studyPlanCreated ? (
            <div className="glass-panel" style={{ padding: '24px', borderLeft: '4px solid var(--accent-ai)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '1.25rem', fontFamily: 'Outfit', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle size={18} style={{ color: 'var(--accent-ai)' }} /> Today's Study Roadmap
                </h3>
                <button style={{ background: 'none', border: 'none', color: 'var(--accent-ai)', fontSize: '0.85rem', fontWeight: 600 }} onClick={() => onNavigate('ai-planner')}>
                  View Full Schedule
                </button>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                Based on your target score, today you should focus on:
              </p>
              <div className="glass-panel" style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', marginTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <h4 style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>Quant Practice: Module 1 & 2 Math Practice</h4>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Focus on: Equations and Arithmetic Properties</span>
                </div>
                <button className="btn btn-ai" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={() => onNavigate('quantitative')}>
                  Start Now
                </button>
              </div>
            </div>
          ) : null}

          {/* SAVED WORK & REVIEW PORTFOLIO (NEW SECTION) */}
          <div className="glass-panel" style={{ padding: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--glass-border)', paddingBottom: '16px', marginBottom: '24px', flexWrap: 'wrap', gap: 16 }}>
              <div style={{ display: 'flex', gap: 16 }}>
                <button 
                  onClick={() => setPortfolioTab('saved')}
                  className={`section-tab ${portfolioTab === 'saved' ? 'active' : ''}`}
                  style={{ padding: '8px 4px', fontSize: '1.05rem', background: 'none', border: 'none', color: portfolioTab === 'saved' ? 'var(--text-primary)' : 'var(--text-secondary)', cursor: 'pointer', fontWeight: 600, position: 'relative' }}
                >
                  <Bookmark size={16} style={{ marginRight: 6, verticalAlign: 'middle', display: 'inline-block' }} /> Saved Sketches ({savedWork.length})
                  {portfolioTab === 'saved' && <div style={{ position: 'absolute', bottom: -17, left: 0, right: 0, height: 2, background: 'var(--accent-quant)' }} />}
                </button>
                <button 
                  onClick={() => setPortfolioTab('mistakes')}
                  className={`section-tab ${portfolioTab === 'mistakes' ? 'active' : ''}`}
                  style={{ padding: '8px 4px', fontSize: '1.05rem', background: 'none', border: 'none', color: portfolioTab === 'mistakes' ? 'var(--text-primary)' : 'var(--text-secondary)', cursor: 'pointer', fontWeight: 600, position: 'relative' }}
                >
                  📓 Mistake Notebooks ({getGroupedMistakes().length})
                  {portfolioTab === 'mistakes' && <div style={{ position: 'absolute', bottom: -17, left: 0, right: 0, height: 2, background: 'var(--accent-verbal)' }} />}
                </button>
              </div>

              {portfolioTab === 'saved' && savedWork.length > 0 && (
                <button 
                  onClick={handleDownloadTodaySketches} 
                  className="btn btn-quant" 
                  style={{ padding: '8px 14px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  📥 Download Today's Sketches
                </button>
              )}
            </div>

            {portfolioTab === 'saved' ? (
              savedWork.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', margin: 0, padding: '12px 0' }}>
                  No saved reviews yet. Click **"Save Question & Work"** during practice quizzes or mock exams to store your scratchpad calculations and review notes here!
                </p>
              ) : (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
                  gap: '24px'
                }}>
                  {savedWork.map((item) => (
                    <div 
                      key={item.id} 
                      className="glass-panel glass-panel-hover" 
                      onClick={() => setActiveReview(item)}
                      style={{ 
                        padding: '16px', 
                        cursor: 'pointer', 
                        background: 'rgba(255,255,255,0.01)',
                        borderLeft: item.isQuant ? '3px solid var(--accent-quant)' : '3px solid var(--accent-verbal)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        height: '140px'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 8 }}>
                          <span>{item.category}</span>
                          <span>{item.savedAt}</span>
                        </div>
                        <p 
                          style={{ fontSize: '0.85rem', color: 'var(--text-primary)', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', margin: 0 }}
                          dangerouslySetInnerHTML={{ __html: formatText(item.questionText) }}
                        />
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, fontSize: '0.75rem' }}>
                        <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                          {item.canvasImage ? <><Edit3 size={12} /> Sketchpad</> : 'Question Only'}
                        </span>
                        <span style={{ color: 'var(--primary)', fontWeight: 600 }}>Review Work →</span>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : (
              /* Mistake Notebook View */
              getGroupedMistakes().length === 0 ? (
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', margin: 0, padding: '12px 0' }}>
                  Your daily Mistake Notebook is empty! Incorrect answers from practice quizzes or mock exams will automatically compile here each day.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {getGroupedMistakes().map((notebook) => {
                    const mathCount = notebook.items.filter(m => m.isQuant).length;
                    const verbalCount = notebook.items.filter(m => !m.isQuant).length;
                    return (
                      <div key={notebook.date} className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                          <div>
                            <h4 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', margin: 0 }}>
                              Mistake Notebook &mdash; {notebook.date}
                            </h4>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 4, display: 'block' }}>
                              Recorded {mathCount} Quantitative mistakes and {verbalCount} Verbal mistakes today.
                            </span>
                          </div>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button 
                              onClick={() => handleDownloadNotebook(notebook.date)}
                              className="btn btn-secondary"
                              style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 4 }}
                            >
                              📥 Download Notebook
                            </button>
                          </div>
                        </div>

                        {/* List of wrong questions for this day */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 200px), 1fr))', gap: 12, marginTop: 8 }}>
                          {notebook.items.map((m) => (
                            <div 
                              key={m.id}
                              onClick={() => setActiveReview({
                                id: m.id,
                                category: m.category,
                                questionText: m.questionText,
                                options: m.options || [],
                                selectedAnswer: m.selectedAnswer,
                                correctAnswer: m.correctAnswer,
                                explanation: m.explanation,
                                isQuant: m.isQuant,
                                savedAt: m.savedAt,
                                canvasImage: null
                              })}
                              className="glass-panel glass-panel-hover"
                              style={{ 
                                padding: '12px', 
                                cursor: 'pointer', 
                                background: 'rgba(255,255,255,0.01)', 
                                borderLeft: m.isQuant ? '3px solid var(--accent-quant)' : '3px solid var(--accent-verbal)',
                                fontSize: '0.8rem',
                                height: '100px',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between'
                              }}
                            >
                              <p 
                                style={{ color: 'var(--text-primary)', margin: 0, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
                                dangerouslySetInnerHTML={{ __html: formatText(m.questionText) }}
                              />
                              <span style={{ fontSize: '0.7rem', color: m.isQuant ? 'var(--accent-quant)' : 'var(--accent-verbal)', fontWeight: 600 }}>
                                {m.category} &rarr;
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            )}
          </div>

          {/* GAT Exam Structure */}
          <div className="glass-panel" style={{ padding: '28px' }}>
            <h3 style={{ fontSize: '1.4rem', marginBottom: '16px', fontFamily: 'Outfit' }}>GAT Test Overview</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '20px' }}>
              The General Aptitude Test (GAT) is a standardized assessment of cognitive skills. It consists of multiple-choice sections covering numerical reasoning and language comprehension. Here is the structure:
            </p>
            <div style={{ overflowX: 'auto', maxWidth: '100%', width: '100%' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-secondary)' }}>
                    <th style={{ padding: '12px 8px' }}>Section</th>
                    <th style={{ padding: '12px 8px' }}>GAT Categories Covered</th>
                    <th style={{ padding: '12px 8px' }}>Questions</th>
                    <th style={{ padding: '12px 8px' }}>Weight</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '16px 8px', fontWeight: 600, color: 'var(--accent-quant)' }}>Quantitative</td>
                    <td style={{ padding: '16px 8px', color: 'var(--text-secondary)' }}>Arithmetic, Algebra, Geometry, Data Analysis</td>
                    <td style={{ padding: '16px 8px' }}>48 Questions</td>
                    <td style={{ padding: '16px 8px' }}>50%</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '16px 8px', fontWeight: 600, color: 'var(--accent-verbal)' }}>Verbal</td>
                    <td style={{ padding: '16px 8px', color: 'var(--text-secondary)' }}>Analogies, Sentence Completion, Context Errors, Reading Comp</td>
                    <td style={{ padding: '16px 8px' }}>48 Questions</td>
                    <td style={{ padding: '16px 8px' }}>50%</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '16px 8px', fontWeight: 600 }}>Total Exam</td>
                    <td style={{ padding: '16px 8px', color: 'var(--text-secondary)' }}>4 sections, 100 minutes total</td>
                    <td style={{ padding: '16px 8px' }}>96 Questions</td>
                    <td style={{ padding: '16px 8px' }}>100%</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="glass-panel" style={{
              background: 'rgba(99, 102, 241, 0.05)',
              border: '1px solid rgba(99, 102, 241, 0.15)',
              padding: '16px',
              borderRadius: 'var(--radius-sm)',
              marginTop: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <Clock size={20} style={{ color: 'var(--primary)', flexShrink: 0 }} />
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
                <strong>Testing Pro Tip:</strong> There is no penalty for guessing on GAT. Always mark an answer for every single question before the timer runs out!
              </p>
            </div>
          </div>
        </div>

        {/* Right Side: Quick Action Center */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '16px', fontFamily: 'Outfit' }}>Study Shortcuts</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              
              <button 
                onClick={() => onNavigate('quantitative')}
                className="btn btn-secondary" 
                style={{ justifyContent: 'space-between', padding: '14px 18px', width: '100%' }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Calculator size={18} style={{ color: 'var(--accent-quant)' }} /> Math Practice Modules
                </span>
                <ArrowRight size={16} />
              </button>

              <button 
                onClick={() => onNavigate('verbal')}
                className="btn btn-secondary" 
                style={{ justifyContent: 'space-between', padding: '14px 18px', width: '100%' }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <BookOpen size={18} style={{ color: 'var(--accent-verbal)' }} /> Verbal Vocabulary Trainer
                </span>
                <ArrowRight size={16} />
              </button>

              <button 
                onClick={() => onNavigate('mock-test')}
                className="btn btn-secondary" 
                style={{ justifyContent: 'space-between', padding: '14px 18px', width: '100%' }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Award size={18} style={{ color: 'var(--primary)' }} /> Full-Length Test Simulator
                </span>
                <ArrowRight size={16} />
              </button>

              <button 
                onClick={() => onNavigate('ai-planner')}
                className="btn btn-secondary" 
                style={{ justifyContent: 'space-between', padding: '14px 18px', width: '100%' }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Bot size={18} style={{ color: 'var(--accent-ai)' }} /> Preppy
                </span>
                <ArrowRight size={16} />
              </button>

            </div>
          </div>

          {/* Test Performance Log */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '16px', fontFamily: 'Outfit' }}>Performance Analytics</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--glass-border)', paddingBottom: '8px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Mock Tests Completed</span>
                <span style={{ fontWeight: 600 }}>{stats.testsTaken}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--glass-border)', paddingBottom: '8px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Avg Mock Score</span>
                <span style={{ fontWeight: 600, color: stats.averageTestScore >= 80 ? 'var(--success)' : 'var(--text-primary)' }}>
                  {stats.averageTestScore > 0 ? `${stats.averageTestScore}/100` : 'N/A'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Daily Streak Status</span>
                <span style={{ fontWeight: 600, color: 'var(--warning)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Flame size={14} /> Active ({stats.streak}d)
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* DASHBOARD FOOTER */}
      <footer style={{
        marginTop: 60,
        paddingTop: 24,
        borderTop: '1px solid var(--glass-border)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 24,
        color: 'var(--text-secondary)',
        fontSize: '0.85rem'
      }}>
        <a 
          href="#/contact"
          onClick={(e) => { e.preventDefault(); onNavigate('contact'); }}
          style={{ color: 'var(--accent-ai)', cursor: 'pointer', textDecoration: 'underline', fontWeight: 600 }}
        >
          Contact & Support
        </a>
        <a 
          href="#/terms"
          onClick={(e) => { e.preventDefault(); onNavigate('terms'); }}
          style={{ color: 'inherit', cursor: 'pointer', textDecoration: 'underline' }}
        >
          Terms and Conditions
        </a>
        <a 
          href="#/privacy"
          onClick={(e) => { e.preventDefault(); onNavigate('privacy'); }}
          style={{ color: 'inherit', cursor: 'pointer', textDecoration: 'underline' }}
        >
          Privacy Policy
        </a>
        <span style={{ color: 'var(--text-muted)' }}>© 2026 ScholarPrep (scholargat.com)</span>
      </footer>

      {/* POPUP REVIEW SHEET MODAL OVERLAY */}
      {activeReview && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px'
        }}>
          <div className="glass-panel animate-fade-in" style={{
            position: 'relative',
            maxWidth: '650px',
            width: '100%',
            maxHeight: '85vh',
            overflowY: 'auto',
            padding: '32px',
            border: '1px solid rgba(255,255,255,0.15)',
            display: 'flex',
            flexDirection: 'column',
            gap: 20
          }}>
            <div className="watermark-overlay"></div>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--glass-border)', paddingBottom: 16 }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: activeReview.isQuant ? 'var(--accent-quant)' : 'var(--accent-verbal)', fontWeight: 'bold' }}>
                  {activeReview.isQuant ? 'MATH' : 'VERBAL'} REVIEW SHEET
                </span>
                <h3 style={{ fontSize: '1.25rem', fontFamily: 'Outfit', color: 'var(--text-primary)', margin: '4px 0 0 0' }}>
                  {activeReview.category} Study Notes
                </h3>
              </div>
              <button 
                onClick={() => setActiveReview(null)}
                aria-label="Close Review Sheet"
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Question Box */}
            <div>
              <h4 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 8 }}>GAT Question:</h4>
              <p 
                style={{ fontSize: '1rem', color: 'var(--text-primary)', lineHeight: 1.5, margin: 0 }}
                dangerouslySetInnerHTML={{ __html: formatText(activeReview.questionText) }}
              />
            </div>

            {/* Answer Box */}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <div className="glass-panel" style={{ flexGrow: 1, padding: '12px 16px', borderLeft: '3px solid var(--accent-quant)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Selected Option</span>
                <div style={{ fontSize: '1rem', fontWeight: 'bold', color: 'var(--text-primary)', marginTop: 4 }}>
                  {activeReview.selectedAnswer !== -1 && activeReview.selectedAnswer !== undefined ? (
                    <>
                      Option {String.fromCharCode(65 + activeReview.selectedAnswer)} : &nbsp;
                      <span dangerouslySetInnerHTML={{ __html: formatText(activeReview.options[activeReview.selectedAnswer]) }} />
                    </>
                  ) : 'Skipped'}
                </div>
              </div>

              <div className="glass-panel" style={{ flexGrow: 1, padding: '12px 16px', borderLeft: '3px solid var(--success)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Correct Option</span>
                <div style={{ fontSize: '1rem', fontWeight: 'bold', color: 'var(--success)', marginTop: 4 }}>
                  Option {String.fromCharCode(65 + activeReview.correctAnswer)} : &nbsp;
                  <span dangerouslySetInnerHTML={{ __html: formatText(activeReview.options[activeReview.correctAnswer]) }} />
                </div>
              </div>
            </div>

            {/* Explanation */}
            <div>
              <h4 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 8 }}>Tutor Explanation:</h4>
              <div 
                style={{ fontSize: '0.9rem', color: 'var(--text-primary)', lineHeight: 1.6 }}
                dangerouslySetInnerHTML={{ __html: formatText(activeReview.explanation) }}
              />
            </div>

            {/* Scratchpad Sketch Rendering */}
            {activeReview.canvasImage ? (
              <div>
                <h4 style={{ fontSize: '0.85rem', color: 'var(--accent-quant)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Edit3 size={14} /> Saved Calculations Sketch:
                </h4>
                <div style={{ 
                  background: '#111827', 
                  border: '1px solid var(--glass-border)', 
                  borderRadius: '8px', 
                  padding: '12px',
                  textAlign: 'center'
                }}>
                  <img 
                    src={activeReview.canvasImage} 
                    alt="Scratchpad calculations drawing" 
                    style={{ maxWidth: '100%', maxHeight: '250px', objectFit: 'contain' }}
                  />
                </div>
              </div>
            ) : null}

            {/* Footer buttons */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, borderTop: '1px solid var(--glass-border)', paddingTop: 16 }}>
              <button 
                onClick={() => handleDeleteReview(activeReview.id)}
                className="btn btn-secondary"
                style={{ color: 'var(--danger)', borderColor: 'rgba(239,68,68,0.2)', display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <Trash2 size={16} /> Delete Review
              </button>
              <button className="btn btn-primary" onClick={() => setActiveReview(null)}>
                Close Review
              </button>
            </div>

          </div>
        </div>
      )}

      {/* POPUP LEGAL MODAL OVERLAY */}
      {legalModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px'
        }}>
          <div className="glass-panel animate-fade-in" style={{
            maxWidth: '600px',
            width: '100%',
            maxHeight: '80vh',
            overflowY: 'auto',
            padding: '32px',
            border: '1px solid rgba(255,255,255,0.15)',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: '1.4rem', fontFamily: 'Outfit' }}>
                {legalModal === 'terms' ? 'Terms and Conditions' : 'Privacy Policy'}
              </h3>
              <button onClick={() => setLegalModal(null)} aria-label="Close Legal Modal" style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            
            <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              {legalModal === 'terms' ? (
                <>
                  <p>Welcome to ScholarPrep (scholargat.com). By using our platform, you agree to these terms.</p>
                  <p style={{ marginTop: 12 }}>1. <strong>Use License:</strong> You may use our prep material, mock exams, and AI study tools for personal, non-commercial educational use only.</p>
                  <p style={{ marginTop: 12 }}>2. <strong>Account Responsibility:</strong> You are responsible for safeguarding your login credentials and account data.</p>
                  <p style={{ marginTop: 12 }}>3. <strong>Disclaimer:</strong> ScholarPrep is an independent test-prep portal and does not guarantee specific score outcomes on the official ETEC/Qiyas exam.</p>
                </>
              ) : (
                <>
                  <p>Your privacy is important to ScholarPrep, in accordance with the Saudi Personal Data Protection Law (PDPL) and GDPR principles.</p>
                  <p style={{ marginTop: 12 }}>1. <strong>Data Collection & Storage (Google Firebase):</strong> We use Google Firebase Authentication and Cloud Firestore to securely store your account email, study progress, saved sketches, and mistake notebooks.</p>
                  <p style={{ marginTop: 12 }}>2. <strong>Analytics & Consent (Google Analytics 4):</strong> With your opt-in consent via Google Consent Mode v2, we use Google Analytics 4 (GA4) with IP anonymization to measure aggregate page usage and improve platform speed.</p>
                  <p style={{ marginTop: 12 }}>3. <strong>Third-Party Services:</strong> Profile avatars are generated deterministically via the DiceBear Avatar API using your display name or seed, and fonts are served via Google Fonts. We never sell your personal data to third parties.</p>
                </>
              )}
            </div>

            <div style={{ marginTop: 32, display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-primary" onClick={() => setLegalModal(null)}>
                Acknowledge & Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
