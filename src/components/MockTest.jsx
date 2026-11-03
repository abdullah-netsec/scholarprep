import React, { useState, useEffect } from 'react';
import { 
  Bot,
  Sparkles,
  Save,
  Award, 
  Clock, 
  HelpCircle, 
  ChevronLeft, 
  ChevronRight, 
  AlertTriangle,
  Play,
  Edit3,
  Bookmark,
  BookmarkCheck,
  RotateCcw,
  BookOpen,
  CheckCircle,
  XCircle,
  Lock,
  Flag,
  Calculator,
  Maximize,
  Minimize
} from 'lucide-react';
import confetti from 'canvas-confetti';
import Scratchpad from './Scratchpad.jsx';
import AITutorDrawer from './AITutorDrawer.jsx';
import { quantQuestions } from '../data/quantQuestions.js';
import { verbalQuestions } from '../data/verbalQuestions.js';
import { isFirebaseEnabled, db, doc, setDoc } from '../firebase.js';
import { formatMathAndText, formatPassageWithHighlight } from '../utils/gatFormatters.js';
import { generateNumberVariantQuestion } from '../utils/remedialGenerator.js';

export default function MockTest({ stats, updateStats, recordQuizResults, activeUser, onAuthRequired }) {
  const [testMode, setTestMode] = useState('full'); // 'full' (96q), 'quant' (48q), 'verbal' (48q), 'mini' (16q)
  const [testStarted, setTestStarted] = useState(false);
  const [testQuestions, setTestQuestions] = useState([]);
  
  const [currentIdx, setCurrentIdx] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [flaggedMap, setFlaggedMap] = useState({});
  const [timeLeft, setTimeLeft] = useState(1500); // 25 mins default
  const [testFinished, setTestFinished] = useState(false);
  
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [showScratchpad, setShowScratchpad] = useState(false);
  const [showFormulas, setShowFormulas] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [workSavedMap, setWorkSavedMap] = useState({}); // Track saves per question ID
  
  const [currentSection, setCurrentSection] = useState(1);
  const [showSectionReview, setShowSectionReview] = useState(false);
  const [timeExpiredForSection, setTimeExpiredForSection] = useState(false);
  
  const [guidedState, setGuidedState] = useState(null);
  const [showAITutor, setShowAITutor] = useState(false);
  const [hasSavedState, setHasSavedState] = useState(false);
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

  // Sync test mode from URL hash/query on mount and hashchange
  useEffect(() => {
    const syncModeFromUrl = () => {
      const hash = (window.location.hash || '').toLowerCase();
      const search = (window.location.search || '').toLowerCase();
      let detectedMode = null;
      if (hash.includes('mode=quant') || hash.includes('/quant') || search.includes('mode=quant')) {
        detectedMode = 'quant';
      } else if (hash.includes('mode=verbal') || hash.includes('/verbal') || search.includes('mode=verbal')) {
        detectedMode = 'verbal';
      } else if (hash.includes('mode=mini') || hash.includes('/mini') || search.includes('mode=mini')) {
        detectedMode = 'mini';
      } else if (hash.includes('mode=full') || hash.includes('/full') || search.includes('mode=full')) {
        detectedMode = 'full';
      }

      if (detectedMode) {
        setTestMode(detectedMode);
        if ((detectedMode === 'quant' || detectedMode === 'verbal') && activeUser && !testStarted) {
          const questionsPool = buildExamQuestions(detectedMode);
          setTestQuestions(questionsPool);
          setUserAnswers({});
          setFlaggedMap({});
          setCurrentIdx(0);
          setCurrentSection(1);
          setShowSectionReview(false);
          setTimeExpiredForSection(false);
          setTimeLeft(1500);
          setTestStarted(true);
          setTestFinished(false);
          setWorkSavedMap({});
          setShowScratchpad(false);
          setShowFormulas(false);
        }
      }
    };

    syncModeFromUrl();
    window.addEventListener('hashchange', syncModeFromUrl);
    return () => window.removeEventListener('hashchange', syncModeFromUrl);
  }, [activeUser]);

  useEffect(() => {
    if (activeUser) {
      const saved = localStorage.getItem(`scholar_gat_mock_${activeUser.email.replace(/[@.]/g, '_')}`);
      if (saved) setHasSavedState(true);
    }
  }, [activeUser]);

  const questionLookup = React.useMemo(() => {
    const map = new Map();
    quantQuestions.forEach(q => map.set(q.id, q));
    verbalQuestions.forEach(q => map.set(q.id, q));
    return map;
  }, []);

  const resumeTest = () => {
    if (activeUser) {
      const saved = localStorage.getItem(`scholar_gat_mock_${activeUser.email.replace(/[@.]/g, '_')}`);
      if (saved) {
        const data = JSON.parse(saved);
        setTestMode(data.testMode || 'full');
        const refreshedQuestions = (data.testQuestions || []).map(q => questionLookup.get(q.id) || q);
        setTestQuestions(refreshedQuestions);
        setCurrentIdx(data.currentIdx);
        setUserAnswers(data.userAnswers || {});
        setFlaggedMap(data.flaggedMap || {});
        setTimeLeft(data.timeLeft);
        setCurrentSection(data.currentSection || 1);
        setTestStarted(true);
      }
    }
  };

  const saveAndExit = () => {
    if (activeUser) {
      const data = { testMode, testQuestions, currentIdx, userAnswers, flaggedMap, timeLeft, currentSection };
      localStorage.setItem(`scholar_gat_mock_${activeUser.email.replace(/[@.]/g, '_')}`, JSON.stringify(data));
      setTestStarted(false);
      setHasSavedState(true);
      if (window.location.hash !== '#/mock-test') {
        window.history.replaceState(null, '', '#/mock-test');
      }
    }
  };

  const isQuantQuestion = (q) => {
    if (!q) return false;
    return q.id?.startsWith('q') || ['arithmetic', 'algebra', 'geometry', 'data analysis'].includes((q.category || '').toLowerCase());
  };

  const rawQuestion = testQuestions[currentIdx];
  const currentQuestion = rawQuestion ? (questionLookup.get(rawQuestion.id) || rawQuestion) : null;
  const isQuant = isQuantQuestion(currentQuestion);

  const fisherYates = (arr) => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  /**
   * Master Question Builder
   * Supports:
   * - 'full': 4 sections × 24 questions (In every section: Q1–Q12 Math, Q13–Q24 English)
   * - 'quant': 2 sections × 24 questions (100% Math: Arithmetic, Algebra, Geometry, Data Analysis)
   * - 'verbal': 2 sections × 24 questions (100% English: Analogy, SC, CE, RC passages)
   * - 'mini': 1 section × 16 questions (8 Math + 8 English)
   * Strictly enforces ZERO REPETITIVE QUESTIONS across the entire test session using a global usedIds Set.
   */
  const buildExamQuestions = (mode) => {
    const usedIds = new Set();

    // 1. Shuffled Quant Category Pools
    const arithPool = fisherYates(quantQuestions.filter(q => (q.category || '').toLowerCase() === 'arithmetic'));
    const algPool = fisherYates(quantQuestions.filter(q => (q.category || '').toLowerCase() === 'algebra'));
    const geomPool = fisherYates(quantQuestions.filter(q => (q.category || '').toLowerCase() === 'geometry'));
    const dataPool = fisherYates(quantQuestions.filter(q => (q.category || '').toLowerCase() === 'data analysis'));

    let arithIdx = 0, algIdx = 0, geomIdx = 0, dataIdx = 0;

    const pullBalancedQuant = (count) => {
      const selected = [];
      const pools = [
        { name: 'arith', pool: arithPool, get idx() { return arithIdx; }, set idx(v) { arithIdx = v; } },
        { name: 'alg', pool: algPool, get idx() { return algIdx; }, set idx(v) { algIdx = v; } },
        { name: 'geom', pool: geomPool, get idx() { return geomIdx; }, set idx(v) { geomIdx = v; } },
        { name: 'data', pool: dataPool, get idx() { return dataIdx; }, set idx(v) { dataIdx = v; } }
      ];

      let pIdx = 0;
      while (selected.length < count) {
        const p = pools[pIdx % pools.length];
        let picked = false;
        while (p.idx < p.pool.length) {
          const candidate = p.pool[p.idx++];
          if (!usedIds.has(candidate.id)) {
            usedIds.add(candidate.id);
            selected.push(candidate);
            picked = true;
            break;
          }
        }
        pIdx++;

        // Failsafe: if a category pool is exhausted, pull from any unused quant question
        if (!picked && pools.every(x => x.idx >= x.pool.length)) {
          for (const q of quantQuestions) {
            if (!usedIds.has(q.id)) {
              usedIds.add(q.id);
              selected.push(q);
              if (selected.length >= count) break;
            }
          }
          break;
        }
      }
      return selected;
    };

    // 2. Shuffled Verbal Category Pools
    const analogyPool = fisherYates(verbalQuestions.filter(q => q.category === 'Analogy'));
    const scPool = fisherYates(verbalQuestions.filter(q => q.category === 'Sentence Completion'));
    const cePool = fisherYates(verbalQuestions.filter(q => q.category === 'Contextual Error'));

    // Group Reading Comprehension questions by passage so they always appear together
    const rcMap = new Map();
    verbalQuestions.filter(q => q.category === 'Reading Comprehension').forEach(q => {
      const key = q.passage || q.model || q.id;
      if (!rcMap.has(key)) rcMap.set(key, []);
      rcMap.get(key).push(q);
    });
    const rcPassageGroups = fisherYates(Array.from(rcMap.values()));

    let anaIdx = 0, scIdx = 0, ceIdx = 0, rcGroupIdx = 0;

    const pullStructuredVerbal = (targetAna, targetSc, targetCe, targetRc) => {
      const selected = [];

      // A. Analogy
      let addedAna = 0;
      while (addedAna < targetAna && anaIdx < analogyPool.length) {
        const candidate = analogyPool[anaIdx++];
        if (!usedIds.has(candidate.id)) {
          usedIds.add(candidate.id);
          selected.push(candidate);
          addedAna++;
        }
      }

      // B. Sentence Completion
      let addedSc = 0;
      while (addedSc < targetSc && scIdx < scPool.length) {
        const candidate = scPool[scIdx++];
        if (!usedIds.has(candidate.id)) {
          usedIds.add(candidate.id);
          selected.push(candidate);
          addedSc++;
        }
      }

      // C. Contextual Error
      let addedCe = 0;
      while (addedCe < targetCe && ceIdx < cePool.length) {
        const candidate = cePool[ceIdx++];
        if (!usedIds.has(candidate.id)) {
          usedIds.add(candidate.id);
          selected.push(candidate);
          addedCe++;
        }
      }

      // D. Reading Comprehension (keep coherent passage questions together)
      let addedRc = 0;
      while (addedRc < targetRc && rcGroupIdx < rcPassageGroups.length) {
        const group = rcPassageGroups[rcGroupIdx++];
        const available = group.filter(q => !usedIds.has(q.id));
        if (available.length > 0) {
          const needed = targetRc - addedRc;
          const toTake = available.slice(0, needed);
          toTake.forEach(q => {
            usedIds.add(q.id);
            selected.push(q);
            addedRc++;
          });
        }
      }

      // Fallback if needed to fill remaining slots
      const totalTarget = targetAna + targetSc + targetCe + targetRc;
      while (selected.length < totalTarget && anaIdx < analogyPool.length) {
        const candidate = analogyPool[anaIdx++];
        if (!usedIds.has(candidate.id)) {
          usedIds.add(candidate.id);
          selected.push(candidate);
        }
      }

      return selected;
    };

    const examQuestions = [];

    if (mode === 'full') {
      // 4 Sections × 24 Questions = 96 Questions
      // In every section: Questions 1–12 Quant, Questions 13–24 Verbal
      for (let s = 0; s < 4; s++) {
        const secQuant = pullBalancedQuant(12);
        const secVerbal = pullStructuredVerbal(4, 3, 2, 3);
        examQuestions.push(...secQuant, ...secVerbal);
      }
    } else if (mode === 'quant') {
      // 2 Sections × 24 Questions = 48 Questions (100% Math)
      for (let s = 0; s < 2; s++) {
        const secQuant = pullBalancedQuant(24);
        examQuestions.push(...secQuant);
      }
    } else if (mode === 'verbal') {
      // 2 Sections × 24 Questions = 48 Questions (100% English)
      for (let s = 0; s < 2; s++) {
        const secVerbal = pullStructuredVerbal(7, 5, 4, 8);
        examQuestions.push(...secVerbal);
      }
    } else {
      // 'mini': 1 Section × 16 Questions (8 Math, 8 English)
      const secQuant = pullBalancedQuant(8);
      const secVerbal = pullStructuredVerbal(3, 2, 1, 2);
      examQuestions.push(...secQuant, ...secVerbal);
    }

    return examQuestions;
  };

  // Initialize test parameters
  const startTest = (modeOverride) => {
    if (!activeUser) {
      onAuthRequired();
      return;
    }

    const activeMode = (typeof modeOverride === 'string' && modeOverride) ? modeOverride : testMode;
    setTestMode(activeMode);
    const questionsPool = buildExamQuestions(activeMode);
    const initialTime = activeMode === 'mini' ? 1200 : 1500; // 20 mins for mini, 25 mins per section for standard sections

    setTestQuestions(questionsPool);
    setUserAnswers({});
    setFlaggedMap({});
    setCurrentIdx(0);
    setCurrentSection(1);
    setShowSectionReview(false);
    setTimeExpiredForSection(false);
    setTimeLeft(initialTime);
    setTestStarted(true);
    setTestFinished(false);
    setWorkSavedMap({});
    setShowScratchpad(false);
    setShowFormulas(false);
  };

  const getTotalSections = (mode) => {
    if (mode === 'full') return 4;
    if (mode === 'quant' || mode === 'verbal') return 2;
    return 1;
  };

  const totalSections = getTotalSections(testMode);
  const questionsPerSection = testMode === 'mini' ? 16 : 24;
  const sectionSize = questionsPerSection;
  const isMultiSection = totalSections > 1;
  const sectionStartIdx = isMultiSection ? (currentSection - 1) * sectionSize : 0;
  const sectionEndIdx = isMultiSection ? Math.min(sectionStartIdx + sectionSize, testQuestions.length) - 1 : testQuestions.length - 1;
  const currentSectionQuestions = isMultiSection ? testQuestions.slice(sectionStartIdx, sectionEndIdx + 1) : testQuestions;
  const localIdxInSection = currentIdx - sectionStartIdx;
  const halfSectionSize = Math.floor(sectionSize / 2);

  useEffect(() => {
    if (!testStarted || testFinished || isPaused) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (isMultiSection && currentSection < totalSections) {
            setTimeExpiredForSection(true);
            setShowSectionReview(true);
            return 0;
          } else {
            finishTest();
            return 0;
          }
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [testStarted, testFinished, testMode, currentSection, isPaused, totalSections, isMultiSection]);

  const handleSelectOption = (optionIndex) => {
    if (timeExpiredForSection) return;
    setUserAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: optionIndex
    }));
  };

  const toggleFlagQuestion = () => {
    if (!currentQuestion) return;
    setFlaggedMap(prev => ({
      ...prev,
      [currentQuestion.id]: !prev[currentQuestion.id]
    }));
  };

  const handleNext = () => {
    if (currentIdx < sectionEndIdx) {
      setCurrentIdx(prev => prev + 1);
    } else if (isMultiSection) {
      setTimeExpiredForSection(false);
      setShowSectionReview(true);
    } else if (currentIdx < testQuestions.length - 1) {
      setCurrentIdx(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIdx > sectionStartIdx) {
      setCurrentIdx(prev => prev - 1);
    }
  };

  const handleProceedNextSection = () => {
    if (currentSection < totalSections) {
      const nextSec = currentSection + 1;
      setCurrentSection(nextSec);
      setCurrentIdx((nextSec - 1) * sectionSize);
      setTimeLeft(1500); // 25 minutes for next section
      setShowSectionReview(false);
      setTimeExpiredForSection(false);
    } else {
      finishTest();
    }
  };

  const startRemedialTest = (mistakesList) => {
    if (!activeUser) {
      onAuthRequired();
      return;
    }
    // Generate number-varied clones of the exact missed questions!
    const remedialPool = mistakesList.map((q, idx) =>
      isQuantQuestion(q) ? generateNumberVariantQuestion(q, idx + 1) : { ...q, id: `${q.id}_rem_${idx + 1}`, isRemedialVariant: true }
    );
    // Sort so Math comes first, then Verbal!
    const remMath = remedialPool.filter(isQuantQuestion);
    const remVerbal = remedialPool.filter(q => !isQuantQuestion(q));
    const orderedRemedial = [...remMath, ...remVerbal];

    setTestQuestions(orderedRemedial);
    setUserAnswers({});
    setFlaggedMap({});
    setCurrentIdx(0);
    setCurrentSection(1);
    setTestMode('mini');
    setTimeLeft(orderedRemedial.length * 90);
    setShowSectionReview(false);
    setTimeExpiredForSection(false);
    setTestStarted(true);
    setTestFinished(false);
    setWorkSavedMap({});
    setShowScratchpad(false);
  };

  const handleSaveWork = () => {
    if (!activeUser) {
      onAuthRequired();
      return;
    }

    const canvas = document.querySelector('.scratchpad-canvas');
    let canvasImage = null;
    if (canvas) {
      canvasImage = canvas.toDataURL('image/png');
    }

    const key = `scholar_gat_saved_work_${activeUser.email.replace(/[@.]/g, '_')}`;
    const existing = JSON.parse(localStorage.getItem(key) || '[]');

    if (existing.some(item => item.questionText === currentQuestion.question)) {
      setWorkSavedMap(prev => ({ ...prev, [currentQuestion.id]: true }));
      return;
    }

    const selectedOpt = userAnswers[currentQuestion.id] ?? -1;

    const savedItem = {
      id: `${currentQuestion.id}_${Date.now()}`,
      questionText: currentQuestion.question,
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

    setWorkSavedMap(prev => ({ ...prev, [currentQuestion.id]: true }));
  };

  const saveMistakeToDb = (question, selectedOpt) => {
    if (!activeUser) return;
    
    const todayStr = new Date().toISOString().split('T')[0];
    const id = `${activeUser.email.replace(/[@.]/g, '_')}_${todayStr}_${question.id}`;
    const qIsQuant = isQuantQuestion(question);
    
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
      isQuant: qIsQuant,
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

  const finishTest = () => {
    setTestFinished(true);
    if (activeUser) localStorage.removeItem(`scholar_gat_mock_${activeUser.email.replace(/[@.]/g, '_')}`);
    setHasSavedState(false);
    
    let totalCorrect = 0;
    testQuestions.forEach(q => {
      const answer = userAnswers[q.id];
      if (answer === q.correctAnswer) {
        totalCorrect++;
      } else {
        saveMistakeToDb(q, answer !== undefined ? answer : -1);
      }
    });

    const finalScore = Math.round((totalCorrect / testQuestions.length) * 100);
    const totalTests = stats.testsTaken + 1;
    
    let newAvg = stats.averageTestScore;
    if (stats.testsTaken === 0) {
      newAvg = finalScore;
    } else {
      newAvg = Math.round(((stats.averageTestScore * stats.testsTaken) + finalScore) / totalTests);
    }

    const quantQs = testQuestions.filter(isQuantQuestion);
    const quantCorrect = quantQs.filter(q => userAnswers[q.id] === q.correctAnswer).length;
    const verbalQs = testQuestions.filter(q => !isQuantQuestion(q));
    const verbalCorrect = verbalQs.filter(q => userAnswers[q.id] === q.correctAnswer).length;

    const newStats = {
      testsTaken: totalTests,
      averageTestScore: newAvg
    };

    if (quantQs.length > 0) {
      const prevCompleted = stats.quantCompleted || 0;
      const prevAcc = stats.quantAccuracy || 0;
      const thisAcc = Math.round((quantCorrect / quantQs.length) * 100);
      const newCompleted = prevCompleted + quantQs.length;
      newStats.quantCompleted = newCompleted;
      newStats.quantAccuracy = prevCompleted === 0 ? thisAcc : Math.round(((prevAcc * prevCompleted) + (thisAcc * quantQs.length)) / newCompleted);
    }

    if (verbalQs.length > 0) {
      const prevCompleted = stats.verbalCompleted || 0;
      const prevAcc = stats.verbalAccuracy || 0;
      const thisAcc = Math.round((verbalCorrect / verbalQs.length) * 100);
      const newCompleted = prevCompleted + verbalQs.length;
      newStats.verbalCompleted = newCompleted;
      newStats.verbalAccuracy = prevCompleted === 0 ? thisAcc : Math.round(((prevAcc * prevCompleted) + (thisAcc * verbalQs.length)) / newCompleted);
    }

    updateStats(newStats);

    const totalTimeSpent = (testQuestions.length * 60) - timeLeft;
    const avgPacing = Math.round(totalTimeSpent / testQuestions.length);
    const mockStatsLog = testQuestions.map(q => {
      const answer = userAnswers[q.id];
      return {
        category: q.category,
        isCorrect: answer === q.correctAnswer,
        timeSpent: avgPacing
      };
    });

    if (recordQuizResults) {
      recordQuizResults(mockStatsLog);
    }

    confetti({
      particleCount: 150,
      spread: 80,
      origin: { y: 0.6 }
    });
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatText = (text) => formatMathAndText(text);

  const getFormattedQuestion = (q, lightSurface = false) => {
    if (!q || !q.question) return '';
    let qText = q.question;
    if (q.category && q.category.toLowerCase() === 'contextual error') {
      const uColor = lightSurface ? '#0284c7' : 'var(--accent-verbal)';
      const uStyle = `text-decoration: underline; text-decoration-color: ${uColor}; text-underline-offset: 4px; text-decoration-thickness: 2.5px; font-weight: 700;`;
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

  const handleExitTest = () => {
    setTestStarted(false);
    setShowExitConfirm(false);
    if (window.location.hash !== '#/mock-test') {
      window.history.replaceState(null, '', '#/mock-test');
    }
  };

  const startGuidedRemedialTest = (mistakesList) => {
    if (!activeUser) {
      onAuthRequired();
      return;
    }
    const allDb = [...quantQuestions, ...verbalQuestions];
    let pairs = [];
    
    mistakesList.forEach((mistake, idx) => {
      if (isQuantQuestion(mistake)) {
        // Exact same question, just with changed numbers!
        const similar = generateNumberVariantQuestion(mistake, idx + 1);
        pairs.push({ mistake, practice: similar });
      } else {
        const cat = (mistake.category || '').toLowerCase();
        let similar = allDb.find(q => (q.category || '').toLowerCase() === cat && q.id !== mistake.id && !pairs.some(p => p.practice.id === q.id));
        if (!similar) {
          similar = allDb.find(q => q.id !== mistake.id && !pairs.some(p => p.practice.id === q.id));
        }
        if (similar) pairs.push({ mistake, practice: similar });
      }
    });

    if (pairs.length === 0) return;

    setGuidedState({
       mistakesList,
       pairs,
       currentIndex: 0,
       subStep: 'explanation',
       practiceAnswer: null,
       practiceSubmitted: false
    });
    setTestMode('guided_remedial');
    setTestStarted(true);
    setTestFinished(false);
  };

  const renderGuidedRemedial = () => {
    if (!guidedState) return null;
    
    if (guidedState.currentIndex >= guidedState.pairs.length) {
      return (
        <div className="animate-fade-in" style={{ maxWidth: '600px', margin: '40px auto', textAlign: 'center' }}>
          <div className="glass-panel" style={{ padding: '40px' }}>
            <Award size={64} style={{ color: 'var(--success)', margin: '0 auto 16px' }} />
            <h2 style={{ fontSize: '2rem', marginBottom: '16px', fontFamily: 'Outfit' }}>Guided Review Complete!</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>You've reviewed all your mistakes and practiced them. Great job!</p>
            <button className="btn btn-primary" onClick={() => {
              setTestStarted(false);
              setTestFinished(true);
              setGuidedState(null);
            }}>
              Return to Score Report
            </button>
          </div>
        </div>
      );
    }

    const { mistake, practice } = guidedState.pairs[guidedState.currentIndex];
    const activeGuidedQ = guidedState.subStep === 'explanation' ? mistake : practice;
    
    if (guidedState.subStep === 'explanation') {
       return (
         <div className="animate-fade-in" style={{ maxWidth: '850px', margin: '40px auto' }}>
            <div className="glass-panel" style={{ padding: '32px' }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: 12 }}>
                 <h2 style={{ fontSize: '1.5rem', fontFamily: 'Outfit' }}>
                   Reviewing Mistake {guidedState.currentIndex + 1} of {guidedState.pairs.length}
                 </h2>
                 <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                   <button 
                     onClick={() => setShowAITutor(true)}
                     className="btn btn-ai"
                     style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 }}
                   >
                     <Bot size={16} /> Ask Preppy
                   </button>
                   <span className="badge" style={{ background: 'rgba(236, 72, 153, 0.1)', color: '#ec4899' }}>
                     {mistake.category}
                   </span>
                 </div>
               </div>
               
               {mistake.passage && (
                 <div style={{
                   marginBottom: '16px',
                   padding: '16px',
                   background: 'rgba(255,255,255,0.03)',
                   borderLeft: '4px solid var(--accent-verbal)',
                   borderRadius: '0 8px 8px 0',
                   fontSize: '0.95rem',
                   lineHeight: 1.75,
                   color: 'var(--text-primary)'
                 }} dangerouslySetInnerHTML={{ __html: formatPassageWithHighlight(mistake.passage, mistake, true) }} />
               )}

               <div dangerouslySetInnerHTML={{ __html: getFormattedQuestion(mistake) }} style={{ fontSize: '1.1rem', marginBottom: '24px' }} />
               
               <div className="glass-panel" style={{ padding: '20px', background: 'rgba(239, 68, 68, 0.05)', borderLeft: '4px solid var(--danger)', marginBottom: '16px' }}>
                 <p style={{ fontWeight: 'bold', color: 'var(--danger)', marginBottom: '8px' }} dangerouslySetInnerHTML={{ __html: `You Answered: ${userAnswers[mistake.id] !== undefined ? formatText(mistake.options[userAnswers[mistake.id]]) : "Skipped"}` }} />
                 <p style={{ fontWeight: 'bold', color: 'var(--success)' }} dangerouslySetInnerHTML={{ __html: `Correct Answer: ${formatText(mistake.options[mistake.correctAnswer])}` }} />
               </div>
               
               <div className="glass-panel" style={{ padding: '24px', background: 'rgba(59, 130, 246, 0.05)', borderLeft: '4px solid var(--primary)', marginBottom: '32px' }}>
                 <h4 style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: 8, color: 'var(--primary)' }}>
                   <HelpCircle size={20} /> Explanation
                 </h4>
                 <div style={{ lineHeight: '1.7', color: 'var(--text-primary)' }} dangerouslySetInnerHTML={{ __html: formatText(mistake.explanation || "Review the relationship carefully.") }} />
               </div>
               
               <button className="btn btn-primary" onClick={() => setGuidedState({ ...guidedState, subStep: 'practice' })} style={{ width: '100%', padding: '16px', fontSize: '1.1rem' }}>
                 I Understand &rarr; Practice Similar Question
               </button>
            </div>
            <AITutorDrawer
              isOpen={showAITutor}
              onClose={() => setShowAITutor(false)}
              currentQuestion={activeGuidedQ}
              userAnswer={userAnswers[mistake.id]}
              isSubmitted={true}
              activeUser={activeUser}
              contextType="Guided Remedial"
            />
         </div>
       );
    } else {
       const isSubmitted = guidedState.practiceSubmitted;
       const isCorrect = isSubmitted && guidedState.practiceAnswer === practice.correctAnswer;
       
       return (
         <div className="animate-fade-in" style={{ maxWidth: '850px', margin: '40px auto' }}>
            <div className="glass-panel" style={{ padding: '32px' }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: 12 }}>
                 <h2 style={{ fontSize: '1.5rem', fontFamily: 'Outfit', color: 'var(--primary)' }}>
                   Practice Application
                 </h2>
                 <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                   <button 
                     onClick={() => setShowAITutor(true)}
                     className="btn btn-ai"
                     style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 }}
                   >
                     <Bot size={16} /> Ask Preppy
                   </button>
                   <span className="badge" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
                     {practice.category}
                   </span>
                 </div>
               </div>
               
               {practice.passage && (
                 <div style={{
                   marginBottom: '16px',
                   padding: '16px',
                   background: 'rgba(255,255,255,0.03)',
                   borderLeft: '4px solid var(--accent-verbal)',
                   borderRadius: '0 8px 8px 0',
                   fontSize: '0.95rem',
                   lineHeight: 1.75,
                   color: 'var(--text-primary)'
                 }} dangerouslySetInnerHTML={{ __html: formatPassageWithHighlight(practice.passage, practice, isSubmitted) }} />
               )}

               <div dangerouslySetInnerHTML={{ __html: getFormattedQuestion(practice) }} style={{ fontSize: '1.1rem', marginBottom: '32px' }} />
               
               <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: '32px' }}>
                 {practice.options.map((opt, i) => {
                    let btnStyle = { padding: '16px', textAlign: 'left', borderRadius: '12px', border: '1px solid var(--glass-border)', background: 'var(--bg-secondary)', cursor: isSubmitted ? 'default' : 'pointer', color: 'var(--text-primary)' };
                    if (isSubmitted) {
                      if (i === practice.correctAnswer) {
                        btnStyle.background = 'rgba(34, 197, 94, 0.1)';
                        btnStyle.borderColor = 'var(--success)';
                      } else if (i === guidedState.practiceAnswer && !isCorrect) {
                        btnStyle.background = 'rgba(239, 68, 68, 0.1)';
                        btnStyle.borderColor = 'var(--danger)';
                      }
                    } else if (guidedState.practiceAnswer === i) {
                      btnStyle.borderColor = 'var(--primary)';
                    }
                    
                    return (
                      <button key={i} style={btnStyle} onClick={() => !isSubmitted && setGuidedState({...guidedState, practiceAnswer: i})} dangerouslySetInnerHTML={{ __html: formatText(opt) }} />
                    );
                 })}
               </div>
               
               {isSubmitted && (
                 <div className="animate-fade-in" style={{ marginBottom: '24px', padding: '16px', borderRadius: '8px', background: isCorrect ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', color: isCorrect ? 'var(--success)' : 'var(--danger)', fontWeight: 'bold' }}>
                   {isCorrect ? 'Correct! You successfully applied the concept.' : `Incorrect. The correct answer was Option ${String.fromCharCode(65 + practice.correctAnswer)}.`}
                   {(!isCorrect && practice.explanation) && (
                     <div style={{ marginTop: '12px', color: 'var(--text-primary)', fontWeight: 'normal' }} dangerouslySetInnerHTML={{ __html: formatText(practice.explanation) }} />
                   )}
                 </div>
               )}
               
               <button 
                 className={`btn ${guidedState.practiceAnswer !== null ? 'btn-primary' : 'btn-secondary'}`} 
                 disabled={guidedState.practiceAnswer === null}
                 onClick={() => {
                   if (isSubmitted) {
                      setGuidedState({ ...guidedState, currentIndex: guidedState.currentIndex + 1, subStep: 'explanation', practiceAnswer: null, practiceSubmitted: false });
                   } else {
                      setGuidedState({ ...guidedState, practiceSubmitted: true });
                   }
                 }}
                 style={{ width: '100%', padding: '16px', fontSize: '1.1rem' }}
               >
                 {isSubmitted ? 'Next Mistake →' : 'Submit Answer'}
               </button>
            </div>
            <AITutorDrawer
              isOpen={showAITutor}
              onClose={() => setShowAITutor(false)}
              currentQuestion={practice}
              userAnswer={guidedState.practiceAnswer}
              isSubmitted={isSubmitted}
              activeUser={activeUser}
              contextType="Guided Remedial"
            />
         </div>
       );
    }
  };

  const renderContent = () => {
    if (testMode === 'guided_remedial') {
      return renderGuidedRemedial();
    }
    if (testFinished) {
      let totalCorrect = 0;
      testQuestions.forEach(q => {
        if (userAnswers[q.id] === q.correctAnswer) {
          totalCorrect++;
        }
      });
      const totalScore = Math.round((totalCorrect / testQuestions.length) * 100);

      const quantQs = testQuestions.filter(isQuantQuestion);
      const quantCorrect = quantQs.filter(q => userAnswers[q.id] === q.correctAnswer).length;
      const quantScore = quantQs.length > 0 ? Math.round((quantCorrect / quantQs.length) * 100) : 0;

      const verbalQs = testQuestions.filter(q => !isQuantQuestion(q));
      const verbalCorrect = verbalQs.filter(q => userAnswers[q.id] === q.correctAnswer).length;
      const verbalScore = verbalQs.length > 0 ? Math.round((verbalCorrect / verbalQs.length) * 100) : 0;

      const mistakeQs = testQuestions.filter(q => userAnswers[q.id] !== q.correctAnswer);

      const catStats = {};
      testQuestions.forEach(q => {
        const cat = q.category || 'General';
        if (!catStats[cat]) catStats[cat] = { total: 0, correct: 0, isQuant: isQuantQuestion(q) };
        catStats[cat].total++;
        if (userAnswers[q.id] === q.correctAnswer) catStats[cat].correct++;
      });

      const sec1Qs = testQuestions.slice(0, 24);
      const sec1Correct = sec1Qs.filter(q => userAnswers[q.id] === q.correctAnswer).length;
      const sec1Score = sec1Qs.length > 0 ? Math.round((sec1Correct / sec1Qs.length) * 100) : 0;

      const sec2Qs = testQuestions.slice(24, 48);
      const sec2Correct = sec2Qs.filter(q => userAnswers[q.id] === q.correctAnswer).length;
      const sec2Score = sec2Qs.length > 0 ? Math.round((sec2Correct / sec2Qs.length) * 100) : 0;

      return (
        <div className="animate-fade-in" style={{ maxWidth: '880px', margin: '32px auto' }}>
          <div style={{ background: '#ffffff', color: '#0f172a', borderRadius: '14px', overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.35)', border: '1px solid #cbd5e1' }}>
            {/* Official Qiyas Score Report Header */}
            <div style={{ background: 'linear-gradient(135deg, #0f2d4a, #1b365d)', color: 'white', padding: '28px 32px', textAlign: 'center', borderBottom: '4px solid #0284c7' }}>
              <div style={{ fontSize: '0.78rem', letterSpacing: '1.5px', textTransform: 'uppercase', color: '#38bdf8', fontWeight: 700, marginBottom: '6px' }}>
                ETEC • Qiyas Official Simulation Result
              </div>
              <h2 style={{ fontSize: '2.1rem', fontFamily: 'Outfit, sans-serif', margin: 0, color: '#ffffff' }}>
                {testMode === 'quant'
                  ? 'Quantitative Reasoning (Math) Score Report'
                  : testMode === 'verbal'
                  ? 'Verbal Reasoning (English) Score Report'
                  : testMode === 'mini'
                  ? 'Mini-Prep Diagnostic Scorecard'
                  : 'General Aptitude Test (GAT) Score Report'}
              </h2>
              <p style={{ color: '#cbd5e1', marginTop: '6px', fontSize: '0.92rem' }}>
                {testMode === 'quant'
                  ? '2-Section Pure Quantitative Exam (48 Questions • 100% Math)'
                  : testMode === 'verbal'
                  ? '2-Section Pure Verbal Exam (48 Questions • 100% English)'
                  : testMode === 'mini'
                  ? '16-Question Diagnostic Drill (8 Math • 8 English)'
                  : '4-Section Standard GAT Exam (Math First Half • English Second Half)'}
              </p>
            </div>

            <div style={{ padding: '32px' }}>
              {/* Mode-Aware 3-Score Layout */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: '28px' }}>
                {testMode === 'quant' ? (
                  <>
                    <div style={{ padding: '22px 16px', textAlign: 'center', background: '#f0f9ff', borderRadius: '10px', border: '2px solid #0284c7' }}>
                      <div style={{ fontSize: '0.82rem', color: '#0369a1', fontWeight: 700 }}>TOTAL QUANT SCORE</div>
                      <div style={{ fontSize: '2.6rem', fontWeight: 800, color: '#0f2d4a', marginTop: '4px', fontFamily: 'Outfit' }}>{quantScore}%</div>
                      <div style={{ fontSize: '0.8rem', color: '#475569', marginTop: '4px' }}>{quantCorrect} / {quantQs.length} Correct</div>
                    </div>
                    <div style={{ padding: '22px 16px', textAlign: 'center', background: '#f8fafc', borderRadius: '10px', border: '1px solid #cbd5e1' }}>
                      <div style={{ fontSize: '0.82rem', color: '#1b365d', fontWeight: 700 }}>SECTION 1 (MATH)</div>
                      <div style={{ fontSize: '2.6rem', fontWeight: 800, color: '#0284c7', marginTop: '4px', fontFamily: 'Outfit' }}>{sec1Score}%</div>
                      <div style={{ fontSize: '0.8rem', color: '#475569', marginTop: '4px' }}>{sec1Correct} / 24 Correct</div>
                    </div>
                    <div style={{ padding: '22px 16px', textAlign: 'center', background: '#f8fafc', borderRadius: '10px', border: '1px solid #cbd5e1' }}>
                      <div style={{ fontSize: '0.82rem', color: '#1b365d', fontWeight: 700 }}>SECTION 2 (MATH)</div>
                      <div style={{ fontSize: '2.6rem', fontWeight: 800, color: '#0284c7', marginTop: '4px', fontFamily: 'Outfit' }}>{sec2Score}%</div>
                      <div style={{ fontSize: '0.8rem', color: '#475569', marginTop: '4px' }}>{sec2Correct} / 24 Correct</div>
                    </div>
                  </>
                ) : testMode === 'verbal' ? (
                  <>
                    <div style={{ padding: '22px 16px', textAlign: 'center', background: '#f0fdfa', borderRadius: '10px', border: '2px solid #0d9488' }}>
                      <div style={{ fontSize: '0.82rem', color: '#0f766e', fontWeight: 700 }}>TOTAL VERBAL SCORE</div>
                      <div style={{ fontSize: '2.6rem', fontWeight: 800, color: '#0f2d4a', marginTop: '4px', fontFamily: 'Outfit' }}>{verbalScore}%</div>
                      <div style={{ fontSize: '0.8rem', color: '#475569', marginTop: '4px' }}>{verbalCorrect} / {verbalQs.length} Correct</div>
                    </div>
                    <div style={{ padding: '22px 16px', textAlign: 'center', background: '#f8fafc', borderRadius: '10px', border: '1px solid #cbd5e1' }}>
                      <div style={{ fontSize: '0.82rem', color: '#0f766e', fontWeight: 700 }}>SECTION 1 (VERBAL)</div>
                      <div style={{ fontSize: '2.6rem', fontWeight: 800, color: '#0d9488', marginTop: '4px', fontFamily: 'Outfit' }}>{sec1Score}%</div>
                      <div style={{ fontSize: '0.8rem', color: '#475569', marginTop: '4px' }}>{sec1Correct} / 24 Correct</div>
                    </div>
                    <div style={{ padding: '22px 16px', textAlign: 'center', background: '#f8fafc', borderRadius: '10px', border: '1px solid #cbd5e1' }}>
                      <div style={{ fontSize: '0.82rem', color: '#0f766e', fontWeight: 700 }}>SECTION 2 (VERBAL)</div>
                      <div style={{ fontSize: '2.6rem', fontWeight: 800, color: '#0d9488', marginTop: '4px', fontFamily: 'Outfit' }}>{sec2Score}%</div>
                      <div style={{ fontSize: '0.8rem', color: '#475569', marginTop: '4px' }}>{sec2Correct} / 24 Correct</div>
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ padding: '22px 16px', textAlign: 'center', background: '#f0f9ff', borderRadius: '10px', border: '2px solid #0284c7' }}>
                      <div style={{ fontSize: '0.82rem', color: '#0369a1', fontWeight: 700 }}>TOTAL GAT SCORE</div>
                      <div style={{ fontSize: '2.6rem', fontWeight: 800, color: '#0f2d4a', marginTop: '4px', fontFamily: 'Outfit' }}>{totalScore}%</div>
                      <div style={{ fontSize: '0.8rem', color: '#475569', marginTop: '4px' }}>{totalCorrect} / {testQuestions.length} Correct</div>
                    </div>
                    <div style={{ padding: '22px 16px', textAlign: 'center', background: '#f8fafc', borderRadius: '10px', border: '1px solid #cbd5e1' }}>
                      <div style={{ fontSize: '0.82rem', color: '#1b365d', fontWeight: 700 }}>QUANTITATIVE (MATH)</div>
                      <div style={{ fontSize: '2.6rem', fontWeight: 800, color: '#0284c7', marginTop: '4px', fontFamily: 'Outfit' }}>{quantScore}%</div>
                      <div style={{ fontSize: '0.8rem', color: '#475569', marginTop: '4px' }}>{quantCorrect} / {quantQs.length} Correct</div>
                    </div>
                    <div style={{ padding: '22px 16px', textAlign: 'center', background: '#f8fafc', borderRadius: '10px', border: '1px solid #cbd5e1' }}>
                      <div style={{ fontSize: '0.82rem', color: '#0d9488', fontWeight: 700 }}>VERBAL (ENGLISH)</div>
                      <div style={{ fontSize: '2.6rem', fontWeight: 800, color: '#0d9488', marginTop: '4px', fontFamily: 'Outfit' }}>{verbalScore}%</div>
                      <div style={{ fontSize: '0.8rem', color: '#475569', marginTop: '4px' }}>{verbalCorrect} / {verbalQs.length} Correct</div>
                    </div>
                  </>
                )}
              </div>

              {/* Section by Section Breakdown for Multi-Section Exams */}
              {isMultiSection && (
                <div style={{ padding: '20px', marginBottom: '24px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <h3 style={{ fontSize: '1.1rem', marginBottom: '14px', color: '#0f2d4a', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Award size={18} style={{ color: '#0284c7' }} /> Section-by-Section Performance (Sections 1 to {totalSections})
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: `repeat(${totalSections}, 1fr)`, gap: 10 }}>
                    {Array.from({ length: totalSections }, (_, i) => i + 1).map(secNum => {
                      const start = (secNum - 1) * sectionSize;
                      const secQs = testQuestions.slice(start, start + sectionSize);
                      const secCorrect = secQs.filter(q => userAnswers[q.id] === q.correctAnswer).length;
                      const secAcc = secQs.length > 0 ? Math.round((secCorrect / secQs.length) * 100) : 0;
                      const isStrong = secAcc >= 80;
                      const isWeak = secAcc < 60;

                      return (
                        <div key={secNum} style={{ padding: '14px 8px', textAlign: 'center', background: '#ffffff', borderRadius: '8px', border: `1.5px solid ${isStrong ? '#10b981' : isWeak ? '#ef4444' : '#cbd5e1'}` }}>
                          <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#0f2d4a' }}>Section {secNum}</div>
                          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: isStrong ? '#059669' : isWeak ? '#dc2626' : '#0f2d4a', margin: '4px 0' }}>{secAcc}%</div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{secCorrect}/{secQs.length} Correct</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Topic Strengths & Weaknesses */}
              <div style={{ padding: '20px', marginBottom: '24px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '14px', color: '#0f2d4a' }}>Topic Breakdown:</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
                  {Object.entries(catStats).map(([catName, data]) => {
                    const acc = Math.round((data.correct / data.total) * 100);
                    const isStrong = acc >= 75;
                    return (
                      <div key={catName} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', borderLeft: isStrong ? '4px solid #10b981' : '4px solid #ef4444' }}>
                        <div>
                          <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0f172a' }}>{catName}</span>
                          <span style={{ fontSize: '0.75rem', color: data.isQuant ? '#0284c7' : '#0d9488', display: 'block', fontWeight: 600 }}>{data.isQuant ? 'Part 1: Quantitative' : 'Part 2: Verbal'}</span>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: '1.1rem', fontWeight: 800, color: isStrong ? '#059669' : '#dc2626' }}>{acc}%</span>
                          <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>{data.correct}/{data.total}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {mistakeQs.length > 0 && (
                <div style={{ marginBottom: '24px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  <button 
                    className="btn btn-primary" 
                    onClick={() => startGuidedRemedialTest(mistakeQs)} 
                    style={{ 
                      flex: 1,
                      padding: '14px', 
                      fontSize: '0.98rem', 
                      background: '#0f2d4a',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8
                    }}
                  >
                    <BookOpen size={18} /> Guided Review with Preppy ({mistakeQs.length} Mistakes)
                  </button>
                  <button 
                    onClick={() => startRemedialTest(mistakeQs)} 
                    style={{ 
                      flex: 1,
                      padding: '14px', 
                      fontSize: '0.98rem', 
                      background: '#f1f5f9',
                      color: '#0f2d4a',
                      border: '1px solid #cbd5e1',
                      borderRadius: '8px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8
                    }}
                  >
                    <RotateCcw size={18} /> Retake Weak Areas Quiz
                  </button>
                </div>
              )}

              <button 
                onClick={handleExitTest} 
                style={{ width: '100%', padding: '14px', background: '#0284c7', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '1rem', cursor: 'pointer' }}
              >
                Return to Simulator Hub
              </button>
            </div>
          </div>
        </div>
      );
    }

    // Official Qiyas Section Review Screen
    if (showSectionReview) {
      const sectionQuestions = testQuestions.slice(sectionStartIdx, sectionEndIdx + 1);
      const answeredCount = sectionQuestions.filter(q => userAnswers[q.id] !== undefined).length;
      const unansweredCount = sectionQuestions.length - answeredCount;
      const flaggedCount = sectionQuestions.filter(q => flaggedMap[q.id]).length;

      return (
        <div className="animate-fade-in" style={{ maxWidth: '900px', margin: '24px auto' }}>
          <div style={{ background: '#ffffff', color: '#0f172a', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.35)', border: '1px solid #cbd5e1' }}>
            {/* Qiyas Header */}
            <div style={{ background: '#0f2d4a', color: 'white', padding: '18px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '3px solid #0284c7' }}>
              <div>
                <div style={{ fontSize: '0.72rem', color: '#38bdf8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>
                  Qiyas Section Review Screen
                </div>
                <h2 style={{ fontSize: '1.4rem', margin: '2px 0 0 0', color: '#ffffff' }}>
                  Section {currentSection} {isMultiSection ? `of ${totalSections}` : ''} — Review Your Answers
                </h2>
              </div>
              <div style={{ background: '#1e3a5f', padding: '8px 16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Clock size={16} color="#38bdf8" />
                <span style={{ fontFamily: 'monospace', fontSize: '1.1rem', fontWeight: 700 }}>
                  {formatTime(timeLeft)}
                </span>
              </div>
            </div>

            <div style={{ padding: '28px' }}>
              {timeExpiredForSection && (
                <div style={{ padding: '12px 16px', background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: '8px', marginBottom: '20px', fontWeight: 700 }}>
                  ⏳ Time has expired for Section {currentSection}. Please proceed to the next section.
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: '24px' }}>
                <div style={{ padding: '16px', textAlign: 'center', background: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                  <div style={{ fontSize: '0.8rem', color: '#166534', fontWeight: 600 }}>Answered</div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#15803d' }}>{answeredCount} / {sectionQuestions.length}</div>
                </div>
                <div style={{ padding: '16px', textAlign: 'center', background: '#fef2f2', borderRadius: '8px', border: '1px solid #fecaca' }}>
                  <div style={{ fontSize: '0.8rem', color: '#991b1b', fontWeight: 600 }}>Unanswered / Incomplete</div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#dc2626' }}>{unansweredCount}</div>
                </div>
                <div style={{ padding: '16px', textAlign: 'center', background: '#fffbeb', borderRadius: '8px', border: '1px solid #fde68a' }}>
                  <div style={{ fontSize: '0.8rem', color: '#92400e', fontWeight: 600 }}>Flagged for Review</div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#d97706' }}>{flaggedCount}</div>
                </div>
              </div>

              {/* If Pure Quantitative Mode */}
              {testMode === 'quant' && (
                <div style={{ marginBottom: '28px' }}>
                  <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0f2d4a', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Quantitative Reasoning (Math) — Questions 1 to {sectionQuestions.length}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10 }}>
                    {sectionQuestions.map((q, idx) => {
                      const actualIdx = sectionStartIdx + idx;
                      const isAnswered = userAnswers[q.id] !== undefined;
                      const isFlagged = !!flaggedMap[q.id];
                      return (
                        <button
                          key={q.id}
                          disabled={timeExpiredForSection}
                          onClick={() => { setCurrentIdx(actualIdx); setShowSectionReview(false); }}
                          style={{
                            padding: '10px 8px',
                            borderRadius: '6px',
                            border: `1.5px solid ${isFlagged ? '#f59e0b' : isAnswered ? '#0284c7' : '#cbd5e1'}`,
                            background: isFlagged ? '#fffbeb' : isAnswered ? '#e0f2fe' : '#f8fafc',
                            cursor: timeExpiredForSection ? 'not-allowed' : 'pointer',
                            textAlign: 'center'
                          }}
                        >
                          <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#0f2d4a' }}>
                            Q{idx + 1} {isFlagged ? '🚩' : ''}
                          </div>
                          <div style={{ fontSize: '0.72rem', fontWeight: 600, color: isAnswered ? '#0369a1' : '#dc2626', marginTop: 2 }}>
                            {isAnswered ? `Ans: ${String.fromCharCode(65 + userAnswers[q.id])}` : 'Unanswered'}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* If Pure Verbal Mode */}
              {testMode === 'verbal' && (
                <div style={{ marginBottom: '28px' }}>
                  <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0d9488', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Verbal Reasoning (English) — Questions 1 to {sectionQuestions.length}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10 }}>
                    {sectionQuestions.map((q, idx) => {
                      const actualIdx = sectionStartIdx + idx;
                      const isAnswered = userAnswers[q.id] !== undefined;
                      const isFlagged = !!flaggedMap[q.id];
                      return (
                        <button
                          key={q.id}
                          disabled={timeExpiredForSection}
                          onClick={() => { setCurrentIdx(actualIdx); setShowSectionReview(false); }}
                          style={{
                            padding: '10px 8px',
                            borderRadius: '6px',
                            border: `1.5px solid ${isFlagged ? '#f59e0b' : isAnswered ? '#0d9488' : '#cbd5e1'}`,
                            background: isFlagged ? '#fffbeb' : isAnswered ? '#ccfbf1' : '#f8fafc',
                            cursor: timeExpiredForSection ? 'not-allowed' : 'pointer',
                            textAlign: 'center'
                          }}
                        >
                          <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#0f2d4a' }}>
                            Q{idx + 1} {isFlagged ? '🚩' : ''}
                          </div>
                          <div style={{ fontSize: '0.72rem', fontWeight: 600, color: isAnswered ? '#0f766e' : '#dc2626', marginTop: 2 }}>
                            {isAnswered ? `Ans: ${String.fromCharCode(65 + userAnswers[q.id])}` : 'Unanswered'}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* If Full or Mini Mode */}
              {(testMode === 'full' || testMode === 'mini') && (
                <>
                  <div style={{ marginBottom: '20px' }}>
                    <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0f2d4a', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Part 1: Quantitative (Math) — Questions 1 to {halfSectionSize}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10 }}>
                      {sectionQuestions.slice(0, halfSectionSize).map((q, idx) => {
                        const actualIdx = sectionStartIdx + idx;
                        const isAnswered = userAnswers[q.id] !== undefined;
                        const isFlagged = !!flaggedMap[q.id];
                        return (
                          <button
                            key={q.id}
                            disabled={timeExpiredForSection}
                            onClick={() => { setCurrentIdx(actualIdx); setShowSectionReview(false); }}
                            style={{
                              padding: '10px 8px',
                              borderRadius: '6px',
                              border: `1.5px solid ${isFlagged ? '#f59e0b' : isAnswered ? '#0284c7' : '#cbd5e1'}`,
                              background: isFlagged ? '#fffbeb' : isAnswered ? '#e0f2fe' : '#f8fafc',
                              cursor: timeExpiredForSection ? 'not-allowed' : 'pointer',
                              textAlign: 'center'
                            }}
                          >
                            <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#0f2d4a' }}>
                              Q{idx + 1} {isFlagged ? '🚩' : ''}
                            </div>
                            <div style={{ fontSize: '0.72rem', fontWeight: 600, color: isAnswered ? '#0369a1' : '#dc2626', marginTop: 2 }}>
                              {isAnswered ? `Ans: ${String.fromCharCode(65 + userAnswers[q.id])}` : 'Unanswered'}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div style={{ marginBottom: '28px' }}>
                    <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0d9488', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Part 2: Verbal (English) — Questions {halfSectionSize + 1} to {sectionQuestions.length}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10 }}>
                      {sectionQuestions.slice(halfSectionSize).map((q, idx) => {
                        const secQIdx = halfSectionSize + idx;
                        const actualIdx = sectionStartIdx + secQIdx;
                        const isAnswered = userAnswers[q.id] !== undefined;
                        const isFlagged = !!flaggedMap[q.id];
                        return (
                          <button
                            key={q.id}
                            disabled={timeExpiredForSection}
                            onClick={() => { setCurrentIdx(actualIdx); setShowSectionReview(false); }}
                            style={{
                              padding: '10px 8px',
                              borderRadius: '6px',
                              border: `1.5px solid ${isFlagged ? '#f59e0b' : isAnswered ? '#0d9488' : '#cbd5e1'}`,
                              background: isFlagged ? '#fffbeb' : isAnswered ? '#ccfbf1' : '#f8fafc',
                              cursor: timeExpiredForSection ? 'not-allowed' : 'pointer',
                              textAlign: 'center'
                            }}
                          >
                            <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#0f2d4a' }}>
                              Q{secQIdx + 1} {isFlagged ? '🚩' : ''}
                            </div>
                            <div style={{ fontSize: '0.72rem', fontWeight: 600, color: isAnswered ? '#0f766e' : '#dc2626', marginTop: 2 }}>
                              {isAnswered ? `Ans: ${String.fromCharCode(65 + userAnswers[q.id])}` : 'Unanswered'}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e2e8f0', paddingTop: '20px' }}>
                {!timeExpiredForSection ? (
                  <button
                    onClick={() => setShowSectionReview(false)}
                    style={{ padding: '12px 22px', background: '#f1f5f9', color: '#0f2d4a', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                  >
                    <ChevronLeft size={16} /> Return to Questions
                  </button>
                ) : <div />}

                <button
                  onClick={isMultiSection && currentSection < totalSections ? handleProceedNextSection : finishTest}
                  style={{ padding: '12px 28px', background: '#0f2d4a', color: '#ffffff', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '1rem', cursor: 'pointer' }}
                >
                  {isMultiSection && currentSection < totalSections ? `End Section ${currentSection} & Start Section ${currentSection + 1} ➔` : 'Submit Final Exam ➔'}
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // =========================================================================
    // ACTIVE COMPUTERIZED QIYAS EXAM SIMULATION INTERFACE
    // =========================================================================
    const isFlagged = currentQuestion ? !!flaggedMap[currentQuestion.id] : false;
    const isFirstHalfMath = localIdxInSection < halfSectionSize;

    return (
      <div style={isFullscreen ? {
        position: 'fixed',
        inset: 0,
        zIndex: 9500,
        background: 'var(--bg-primary)',
        padding: '20px 28px',
        overflowY: 'auto'
      } : { maxWidth: '1080px', margin: '0 auto', position: 'relative' }}>
        {isPaused && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backdropFilter: 'blur(25px)', WebkitBackdropFilter: 'blur(25px)', backgroundColor: 'rgba(15, 23, 42, 0.85)',
            zIndex: 9999, display: 'flex', flexDirection: 'column',
            justifyContent: 'center', alignItems: 'center', gap: 20
          }}>
            <h2 style={{ fontSize: '2.6rem', fontFamily: 'Outfit', color: 'white' }}>Qiyas Exam Paused</h2>
            <p style={{ color: '#cbd5e1', fontSize: '1.1rem', marginBottom: '10px' }}>Your section timer is paused.</p>
            <button onClick={() => setIsPaused(false)} style={{ padding: '14px 32px', fontSize: '1.1rem', fontWeight: 700, borderRadius: '8px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, background: '#0284c7', color: 'white' }}>
              <Play size={22} /> Resume Exam
            </button>
          </div>
        )}

        {/* QIYAS EXAM SHELL */}
        <div style={{
          maxWidth: isFullscreen ? '1200px' : undefined,
          margin: isFullscreen ? '0 auto' : undefined,
          borderRadius: '12px',
          overflow: 'hidden',
          border: '2px solid #1b365d',
          boxShadow: '0 16px 40px rgba(0, 0, 0, 0.35)',
          background: '#f8fafc'
        }}>
          {/* 1. TOP OFFICIAL QIYAS HEADER BAR */}
          <div style={{
            background: 'linear-gradient(90deg, #0f2d4a 0%, #1b365d 100%)',
            color: '#ffffff',
            padding: '12px 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 12,
            borderBottom: '3px solid #0284c7'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{
                background: '#0284c7',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '0.75rem',
                padding: '5px 10px',
                borderRadius: '4px',
                letterSpacing: '0.8px',
                textTransform: 'uppercase'
              }}>
                QIYAS • GAT
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '1rem', color: '#ffffff' }}>
                  {testMode === 'quant'
                    ? `Quantitative Aptitude Exam — Section ${currentSection} of ${totalSections}`
                    : testMode === 'verbal'
                    ? `Verbal Aptitude Exam — Section ${currentSection} of ${totalSections}`
                    : testMode === 'mini'
                    ? `Mini GAT Diagnostic Exam`
                    : `General Aptitude Test — Section ${currentSection} of ${totalSections}`}
                </div>
                <div style={{ fontSize: '0.76rem', color: '#bae6fd', fontWeight: 600 }}>
                  {testMode === 'quant'
                    ? `Quantitative Reasoning (Math: Q1–Q${currentSectionQuestions.length})`
                    : testMode === 'verbal'
                    ? `Verbal Reasoning (English: Q1–Q${currentSectionQuestions.length})`
                    : isFirstHalfMath
                    ? `Part 1: Quantitative Reasoning (Math: Q1–Q${halfSectionSize})`
                    : `Part 2: Verbal Reasoning (English: Q${halfSectionSize + 1}–Q${currentSectionQuestions.length})`}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{
                background: 'rgba(255,255,255,0.1)',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '0.84rem',
                fontWeight: 700,
                color: '#e0f2fe'
              }}>
                Question {localIdxInSection + 1} of {currentSectionQuestions.length}
              </div>

              <div style={{
                background: timeLeft <= 120 ? '#991b1b' : '#082038',
                border: `1.5px solid ${timeLeft <= 120 ? '#f87171' : '#38bdf8'}`,
                padding: '6px 14px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                color: '#ffffff'
              }}>
                <Clock size={16} color={timeLeft <= 120 ? '#fca5a5' : '#38bdf8'} />
                <span style={{ fontSize: '0.78rem', color: '#cbd5e1', fontWeight: 600 }}>Time Left:</span>
                <span style={{ fontWeight: 800, fontFamily: 'monospace', fontSize: '1.05rem', color: timeLeft <= 120 ? '#fecaca' : '#ffffff' }}>
                  {formatTime(timeLeft)}
                </span>
              </div>
            </div>
          </div>

          {/* 2. QIYAS SUB-TOOLBAR (Formulas, Flag, Scratchpad, Preppy, Pause/Save) */}
          <div style={{
            background: '#e2e8f0',
            padding: '8px 18px',
            borderBottom: '1px solid #cbd5e1',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 10
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <button
                onClick={toggleFlagQuestion}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: `1.5px solid ${isFlagged ? '#d97706' : '#94a3b8'}`,
                  background: isFlagged ? '#fef3c7' : '#ffffff',
                  color: isFlagged ? '#b45309' : '#1e293b',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                <Flag size={14} fill={isFlagged ? '#d97706' : 'none'} />
                {isFlagged ? 'Flagged for Review' : 'Flag Question'}
              </button>

              <button
                onClick={() => setShowFormulas(!showFormulas)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: `1.5px solid ${showFormulas ? '#0284c7' : '#94a3b8'}`,
                  background: showFormulas ? '#e0f2fe' : '#ffffff',
                  color: '#0f2d4a',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                <Calculator size={14} />
                {showFormulas ? 'Hide Formulas' : 'Reference Formulas'}
              </button>

              <button
                onClick={() => setShowScratchpad(!showScratchpad)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: `1.5px solid ${showScratchpad ? '#0284c7' : '#94a3b8'}`,
                  background: showScratchpad ? '#e0f2fe' : '#ffffff',
                  color: '#0f2d4a',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                <Edit3 size={14} />
                {showScratchpad ? 'Hide Scratchpad' : 'Scratchpad'}
              </button>

              <button
                onClick={() => setShowAITutor(!showAITutor)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: '1.5px solid #0284c7',
                  background: '#0f2d4a',
                  color: '#38bdf8',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                <Bot size={14} />
                {showAITutor ? 'Hide Preppy' : 'Ask Preppy'}
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <button
                onClick={toggleFullscreen}
                title={isFullscreen ? "Exit Full Screen" : "Full Screen"}
                style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #94a3b8', background: '#ffffff', color: '#0f2d4a', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}
              >
                {isFullscreen ? <Minimize size={13} /> : <Maximize size={13} />}
                {isFullscreen ? 'Exit Full Screen' : 'Full Screen'}
              </button>
              <button
                onClick={() => setIsPaused(true)}
                style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #94a3b8', background: '#ffffff', color: '#334155', fontWeight: 600, fontSize: '0.78rem', cursor: 'pointer' }}
              >
                Pause
              </button>
              <button
                onClick={saveAndExit}
                style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #94a3b8', background: '#ffffff', color: '#334155', fontWeight: 600, fontSize: '0.78rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
              >
                <Save size={13} /> Save & Exit
              </button>
              <button
                onClick={() => setShowExitConfirm(true)}
                style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #fca5a5', background: '#fef2f2', color: '#dc2626', fontWeight: 600, fontSize: '0.78rem', cursor: 'pointer' }}
              >
                Quit
              </button>
            </div>
          </div>

          {/* COLLAPSIBLE QIYAS FORMULA REFERENCE SHEET */}
          {showFormulas && (
            <div style={{
              background: '#f0f9ff',
              borderBottom: '2px solid #bae6fd',
              padding: '12px 20px',
              color: '#0f2d4a',
              fontSize: '0.82rem',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 10
            }}>
              <div><strong>Circle:</strong> Area = πr² &nbsp;|&nbsp; Circumference = 2πr</div>
              <div><strong>Triangle:</strong> Area = ½ × base × height &nbsp;|&nbsp; Angles = 180°</div>
              <div><strong>Pythagoras:</strong> a² + b² = c² (Triples: 3-4-5, 5-12-13, 6-8-10)</div>
              <div><strong>Algebra:</strong> x² − y² = (x − y)(x + y) &nbsp;|&nbsp; Avg Speed = 2xy / (x + y)</div>
            </div>
          )}

          {/* 3. DIVIDED QUESTION NUMBER STRIP: FIRST HALF MATH | SECOND HALF ENGLISH */}
          <div style={{
            background: '#f1f5f9',
            padding: '10px 18px',
            borderBottom: '1px solid #cbd5e1',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            overflowX: 'auto'
          }}>
            {testMode === 'verbal' ? (
              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#0d9488', background: '#ccfbf1', padding: '4px 8px', borderRadius: '4px', whiteSpace: 'nowrap' }}>
                ENGLISH (1–{currentSectionQuestions.length})
              </span>
            ) : (
              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#0284c7', background: '#e0f2fe', padding: '4px 8px', borderRadius: '4px', whiteSpace: 'nowrap' }}>
                MATH (1–{testMode === 'quant' ? currentSectionQuestions.length : halfSectionSize})
              </span>
            )}

            {currentSectionQuestions.map((q, idx) => {
              const actualIdx = sectionStartIdx + idx;
              const isCurr = currentIdx === actualIdx;
              const isAns = userAnswers[q.id] !== undefined;
              const isFlg = !!flaggedMap[q.id];

              return (
                <React.Fragment key={q.id}>
                  {(testMode === 'full' || testMode === 'mini') && idx === halfSectionSize && (
                    <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#0d9488', background: '#ccfbf1', padding: '4px 8px', borderRadius: '4px', marginLeft: 8, whiteSpace: 'nowrap' }}>
                      ENGLISH ({halfSectionSize + 1}–{currentSectionQuestions.length})
                    </span>
                  )}
                  <button
                    onClick={() => setCurrentIdx(actualIdx)}
                    style={{
                      position: 'relative',
                      minWidth: '30px',
                      height: '30px',
                      borderRadius: '5px',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      background: isCurr ? '#0f2d4a' : isAns ? '#0284c7' : '#ffffff',
                      color: isCurr || isAns ? '#ffffff' : '#334155',
                      border: isCurr ? '2px solid #38bdf8' : isFlg ? '2px solid #f59e0b' : '1px solid #cbd5e1',
                      padding: 0,
                      flexShrink: 0
                    }}
                  >
                    {idx + 1}
                    {isFlg && (
                      <span style={{
                        position: 'absolute',
                        top: -4,
                        right: -4,
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: '#f59e0b',
                        border: '1px solid white'
                      }} />
                    )}
                  </button>
                </React.Fragment>
              );
            })}
          </div>

          {/* 4. MAIN QIYAS EXAM QUESTION PAPER WORKSPACE */}
          <div
            className="mock-question-workspace"
            style={{
            position: 'relative',
            overflow: 'hidden',
            background: '#ffffff',
            color: '#0f172a',
            padding: '28px 32px',
            minHeight: '420px',
            display: 'grid',
            gridTemplateColumns: currentQuestion.passage ? '1.08fr 1fr' : '1fr',
            gap: '28px',
            alignItems: 'start'
          }}>
            {/* Box-Only Tamer-Style Centered Diagonal Watermark */}
            <div className="watermark-overlay"></div>
            {/* Left Pane: Reading Passage (if Reading Comprehension) */}
            {currentQuestion.passage && (
              <div style={{
                background: '#f8fafc',
                border: '1px solid #cbd5e1',
                borderTop: '4px solid #0d9488',
                borderRadius: '8px',
                padding: '20px 22px',
                maxHeight: '480px',
                overflowY: 'auto'
              }}>
                <div style={{ fontSize: '0.76rem', fontWeight: 800, color: '#0d9488', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '10px' }}>
                  Reading Comprehension Passage
                </div>
                <div
                  style={{
                    fontSize: '0.98rem',
                    lineHeight: 1.75,
                    color: '#1e293b',
                    fontFamily: "'Segoe UI', Georgia, serif"
                  }}
                  dangerouslySetInnerHTML={{ __html: formatText(currentQuestion.passage) }}
                />
              </div>
            )}

            {/* Right / Main Pane: Question Stem & Options A/B/C/D */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <span style={{
                  fontSize: '0.76rem',
                  padding: '4px 10px',
                  borderRadius: '4px',
                  background: isQuant ? '#e0f2fe' : '#ccfbf1',
                  color: isQuant ? '#0369a1' : '#0f766e',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  {isQuant ? `Quantitative • ${currentQuestion.category}` : `Verbal • ${currentQuestion.category}`}
                </span>

                <button
                  onClick={handleSaveWork}
                  style={{
                    background: 'transparent',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    padding: '4px 10px',
                    fontSize: '0.76rem',
                    fontWeight: 600,
                    color: '#475569',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4
                  }}
                >
                  {workSavedMap[currentQuestion.id] ? (
                    <><BookmarkCheck size={14} color="#059669" /> Saved to Library</>
                  ) : (
                    <><Bookmark size={14} /> Save Question</>
                  )}
                </button>
              </div>

              {/* Question Stem */}
              <div
                style={{
                  fontSize: '1.22rem',
                  fontWeight: 600,
                  lineHeight: 1.7,
                  color: '#0f172a',
                  marginBottom: '24px',
                  fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif"
                }}
                dangerouslySetInnerHTML={{ __html: getFormattedQuestion(currentQuestion, true) }}
              />

              {/* Qiyas Radio Options List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {currentQuestion.options.map((opt, optIdx) => {
                  const isSelected = userAnswers[currentQuestion.id] === optIdx;
                  const letter = String.fromCharCode(65 + optIdx);
                  return (
                    <button
                      key={optIdx}
                      className="mock-option-btn"
                      onClick={() => handleSelectOption(optIdx)}
                      style={{
                        position: 'relative',
                        overflow: 'hidden',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-start',
                        width: '100%',
                        textAlign: 'left',
                        padding: '14px 18px',
                        borderRadius: '8px',
                        border: isSelected ? '2px solid #0284c7' : '1.5px solid #cbd5e1',
                        background: isSelected ? '#e0f2fe' : '#f8fafc',
                        color: '#0f172a',
                        cursor: 'pointer',
                        fontSize: '1.05rem',
                        fontWeight: isSelected ? 700 : 600,
                        fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <span style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        background: isSelected ? '#0f2d4a' : '#ffffff',
                        border: isSelected ? '2px solid #0f2d4a' : '1.5px solid #64748b',
                        color: isSelected ? '#ffffff' : '#0f2d4a',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: '14px',
                        fontSize: '0.85rem',
                        fontWeight: 800,
                        fontFamily: "'Segoe UI', sans-serif",
                        flexShrink: 0
                      }}>
                        {letter}
                      </span>
                      <span dangerouslySetInnerHTML={{ __html: formatText(opt) }} />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Transparent Inline Preppy AI Tutor inside Question Paper Workspace */}
            {showAITutor && (
              <div style={{ gridColumn: '1 / -1' }}>
                <AITutorDrawer
                  isOpen={showAITutor}
                  onClose={() => setShowAITutor(false)}
                  currentQuestion={currentQuestion}
                  userAnswer={userAnswers[currentQuestion?.id]}
                  isSubmitted={false}
                  activeUser={activeUser}
                  contextType="Mock Test"
                  lightSurface={true}
                />
              </div>
            )}
          </div>

          {/* 5. OFFICIAL QIYAS BOTTOM NAVIGATION FOOTER BAR */}
          <div style={{
            background: '#0f2d4a',
            color: '#ffffff',
            padding: '12px 24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderTop: '2px solid #1e3a5f'
          }}>
            <button
              onClick={handlePrev}
              disabled={currentIdx === sectionStartIdx}
              style={{
                padding: '10px 20px',
                borderRadius: '6px',
                border: '1px solid rgba(255,255,255,0.25)',
                background: currentIdx === sectionStartIdx ? 'rgba(255,255,255,0.06)' : '#1e3a5f',
                color: currentIdx === sectionStartIdx ? 'rgba(255,255,255,0.35)' : '#ffffff',
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: currentIdx === sectionStartIdx ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              <ChevronLeft size={18} /> Previous
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button
                onClick={() => { setTimeExpiredForSection(false); setShowSectionReview(true); }}
                style={{
                  padding: '10px 18px',
                  borderRadius: '6px',
                  border: '1px solid #38bdf8',
                  background: 'rgba(2, 132, 199, 0.2)',
                  color: '#e0f2fe',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                <BookOpen size={16} /> Review Section ({Object.keys(userAnswers).filter(id => currentSectionQuestions.some(q => q.id === id)).length}/{currentSectionQuestions.length})
              </button>
            </div>

            {currentIdx < sectionEndIdx ? (
              <button
                onClick={handleNext}
                style={{
                  padding: '10px 24px',
                  borderRadius: '6px',
                  border: 'none',
                  background: '#0284c7',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '0.92rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                Next <ChevronRight size={18} />
              </button>
            ) : (
              <button
                onClick={() => {
                  setTimeExpiredForSection(false);
                  setShowSectionReview(true);
                }}
                style={{
                  padding: '10px 24px',
                  borderRadius: '6px',
                  border: 'none',
                  background: '#10b981',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '0.92rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                Review & Finish Section ➔
              </button>
            )}
          </div>
        </div>

        {/* Scratchpad Panel */}
        {showScratchpad && (
          <div style={{ width: '100%', marginTop: '16px' }}>
            <Scratchpad onClose={() => setShowScratchpad(false)} />
          </div>
        )}

        {showExitConfirm && (
          <div style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.8)',
            zIndex: 200,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 24
          }}>
            <div className="glass-panel" style={{ padding: '32px', maxWidth: '400px', width: '100%', background: 'var(--bg-secondary)' }}>
              <h3 style={{ fontSize: '1.2rem', color: 'var(--text-primary)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertTriangle size={18} style={{ color: 'var(--danger)' }} /> Quit GAT Mock Test?
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5, marginBottom: '24px' }}>
                Are you sure you want to exit the exam? Your current answers and progress will be discarded unless you click Save & Exit.
              </p>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button className="btn btn-secondary" onClick={() => setShowExitConfirm(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={handleExitTest} style={{ background: 'var(--danger)', borderColor: 'var(--danger)' }}>Quit Exam</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ position: 'relative' }}>
      {/* Locked overlay for Guests */}
      {!activeUser && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(10, 11, 15, 0.45)',
          backdropFilter: 'blur(6px)',
          borderRadius: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          zIndex: 100,
          minHeight: '400px'
        }}>
          <div className="glass-panel" style={{
            maxWidth: '450px',
            width: '100%',
            padding: '40px',
            textAlign: 'center',
            border: '1px solid rgba(255,255,255,0.15)',
            boxShadow: '0 24px 64px rgba(0,0,0,0.6)'
          }}>
            <Award size={48} style={{ color: 'var(--primary)', marginBottom: '16px', margin: '0 auto 16px auto' }} />
            <h3 style={{ fontSize: '1.5rem', marginBottom: '12px', fontFamily: 'Outfit', color: 'var(--text-primary)' }}>
              Unlock Qiyas GAT Simulator
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5, marginBottom: '28px' }}>
              Experience the official Qiyas computerized GAT exam layout: structured sections with Math in the first half and English in the second half, flagging, formula sheet, and scratchpad!
            </p>
            <button className="btn btn-primary" onClick={onAuthRequired} style={{ width: '100%', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <Lock size={16} /> Sign In / Create Account
            </button>
          </div>
        </div>
      )}

      {/* Main Mock Test Lobby */}
      <div style={{ opacity: !activeUser ? 0.35 : 1 }}>
        {testStarted ? renderContent() : (
          <div className="animate-fade-in" style={{ maxWidth: '680px', margin: '40px auto' }}>
            <div style={{ background: '#ffffff', color: '#0f172a', borderRadius: '14px', overflow: 'hidden', border: '2px solid #1b365d', boxShadow: '0 20px 50px rgba(0,0,0,0.3)' }}>
              <div style={{ background: 'linear-gradient(135deg, #0f2d4a, #1b365d)', color: 'white', padding: '28px 32px', textAlign: 'center', borderBottom: '4px solid #0284c7' }}>
                <div style={{ display: 'inline-block', background: '#0284c7', color: '#ffffff', fontSize: '0.74rem', fontWeight: 800, padding: '4px 12px', borderRadius: '20px', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '10px' }}>
                  Official ETEC • Qiyas Computerized Theme
                </div>
                <h2 style={{ fontSize: '2.1rem', margin: '0 0 6px 0', fontFamily: 'Outfit', color: '#ffffff' }}>Qiyas GAT Exam Simulator</h2>
                <p style={{ color: '#cbd5e1', margin: 0, fontSize: '0.92rem' }}>
                  Every section is structured just like the real GAT exam: <strong>First Half Quantitative (Math)</strong> followed by <strong>Second Half Verbal (English)</strong>.
                </p>
              </div>

              <div style={{ padding: '32px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: '28px', textAlign: 'left' }}>
                  <h4 style={{ fontSize: '0.95rem', color: '#0f2d4a', fontWeight: 800, margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Select Exam Simulation Mode:
                  </h4>
                  
                  <div 
                    onClick={() => setTestMode('full')}
                    style={{
                      padding: '18px 20px',
                      cursor: 'pointer',
                      borderRadius: '10px',
                      border: testMode === 'full' ? '2px solid #0284c7' : '1.5px solid #cbd5e1',
                      background: testMode === 'full' ? '#f0f9ff' : '#f8fafc',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <strong style={{ fontSize: '1.02rem', color: '#0f2d4a' }}>Full 4-Section Qiyas GAT Exam</strong>
                        <span style={{ fontSize: '0.72rem', background: '#0284c7', color: 'white', padding: '2px 8px', borderRadius: '12px', fontWeight: 800 }}>Standard</span>
                      </div>
                      <span style={{ fontSize: '0.84rem', color: '#475569', display: 'block', marginTop: 4 }}>
                        4 Timed Sections • 96 Qs • Every section: 12 Math then 12 English • Zero repetition
                      </span>
                    </div>
                    <span style={{ fontSize: '0.85rem', background: '#0284c7', color: '#ffffff', padding: '6px 12px', borderRadius: '6px', fontWeight: 700, flexShrink: 0, marginLeft: 12 }}>100 Min</span>
                  </div>

                  <div 
                    onClick={() => setTestMode('quant')}
                    style={{
                      padding: '18px 20px',
                      cursor: 'pointer',
                      borderRadius: '10px',
                      border: testMode === 'quant' ? '2px solid #0284c7' : '1.5px solid #cbd5e1',
                      background: testMode === 'quant' ? '#f0f9ff' : '#f8fafc',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <strong style={{ fontSize: '1.02rem', color: '#0f2d4a' }}>Quantitative Mock Exam Alone</strong>
                        <span style={{ fontSize: '0.72rem', background: 'rgba(2, 132, 199, 0.15)', color: '#0284c7', padding: '2px 8px', borderRadius: '12px', fontWeight: 800 }}>Pure Math</span>
                      </div>
                      <span style={{ fontSize: '0.84rem', color: '#475569', display: 'block', marginTop: 4 }}>
                        2 Timed Sections • 48 Questions (100% Math) • Arithmetic, Algebra, Geometry & Data
                      </span>
                    </div>
                    <span style={{ fontSize: '0.85rem', background: '#0f2d4a', color: '#ffffff', padding: '6px 12px', borderRadius: '6px', fontWeight: 700, flexShrink: 0, marginLeft: 12 }}>50 Min</span>
                  </div>

                  <div 
                    onClick={() => setTestMode('verbal')}
                    style={{
                      padding: '18px 20px',
                      cursor: 'pointer',
                      borderRadius: '10px',
                      border: testMode === 'verbal' ? '2px solid #0d9488' : '1.5px solid #cbd5e1',
                      background: testMode === 'verbal' ? '#f0fdfa' : '#f8fafc',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <strong style={{ fontSize: '1.02rem', color: '#0f2d4a' }}>Verbal Mock Exam Alone</strong>
                        <span style={{ fontSize: '0.72rem', background: 'rgba(13, 148, 136, 0.15)', color: '#0d9488', padding: '2px 8px', borderRadius: '12px', fontWeight: 800 }}>Pure English</span>
                      </div>
                      <span style={{ fontSize: '0.84rem', color: '#475569', display: 'block', marginTop: 4 }}>
                        2 Timed Sections • 48 Questions (100% English) • Analogies, SC, Errors & RC Passages
                      </span>
                    </div>
                    <span style={{ fontSize: '0.85rem', background: '#0d9488', color: '#ffffff', padding: '6px 12px', borderRadius: '6px', fontWeight: 700, flexShrink: 0, marginLeft: 12 }}>50 Min</span>
                  </div>

                  <div 
                    onClick={() => setTestMode('mini')}
                    style={{
                      padding: '18px 20px',
                      cursor: 'pointer',
                      borderRadius: '10px',
                      border: testMode === 'mini' ? '2px solid #6366f1' : '1.5px solid #cbd5e1',
                      background: testMode === 'mini' ? '#f5f3ff' : '#f8fafc',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <strong style={{ fontSize: '1.02rem', color: '#0f2d4a' }}>Mini Qiyas Diagnostic</strong>
                        <span style={{ fontSize: '0.72rem', background: 'rgba(99, 102, 241, 0.15)', color: '#6366f1', padding: '2px 8px', borderRadius: '12px', fontWeight: 800 }}>Quick Drill</span>
                      </div>
                      <span style={{ fontSize: '0.84rem', color: '#475569', display: 'block', marginTop: 4 }}>
                        1 Timed Section • 16 Questions (8 Math + 8 English) • Fast baseline score & speed check
                      </span>
                    </div>
                    <span style={{ fontSize: '0.85rem', background: '#6366f1', color: '#ffffff', padding: '6px 12px', borderRadius: '6px', fontWeight: 700, flexShrink: 0, marginLeft: 12 }}>20 Min</span>
                  </div>
                </div>

                {hasSavedState && (
                  <button
                    onClick={resumeTest}
                    style={{ width: '100%', padding: '14px 20px', fontSize: '1rem', fontWeight: 700, background: '#f1f5f9', color: '#0f2d4a', border: '1.5px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 12 }}
                  >
                    <Save size={16} /> Resume Saved Qiyas Exam
                  </button>
                )}
                <button
                  onClick={() => {
                    if (hasSavedState && !window.confirm("Starting a new exam will overwrite your saved exam. Continue?")) return;
                    startTest();
                  }}
                  style={{ width: '100%', padding: '15px 20px', fontSize: '1.05rem', fontWeight: 800, background: '#0f2d4a', color: '#ffffff', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                >
                  <Play size={18} /> {
                    testMode === 'quant'
                      ? 'Start Quantitative Mock Exam (48 Qs)'
                      : testMode === 'verbal'
                      ? 'Start Verbal Mock Exam (48 Qs)'
                      : testMode === 'mini'
                      ? 'Start Mini Diagnostic Exam (16 Qs)'
                      : 'Start Official Full GAT Exam (96 Qs)'
                  }
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
