import React, { useState } from 'react';
import { 
  Calculator, 
  BookOpen, 
  Download, 
  HelpCircle, 
  ChevronDown, 
  ChevronUp, 
  Award,
  Sparkles,
  ArrowRight,
  GraduationCap,
  Lock
} from 'lucide-react';
import { quantQuestions } from '../data/quantQuestions.js';
import PracticeQuiz from './PracticeQuiz.jsx';

export default function QuantitativeHub({ stats, updateStats, recordQuizResults, activeUser, onAuthRequired, onReadPdf }) {
  const [activeSubTab, setActiveSubTab] = useState(() => {
    const hash = window.location.hash.replace(/^#\/?/, '');
    const parts = hash.split('/');
    if (parts[0] === 'quantitative' && parts.length > 1) {
      return (parts[1] === 'concepts' || parts[1] === 'modules') ? parts[1] : 'concepts';
    }
    return 'concepts';
  });

  React.useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace(/^#\/?/, '');
      const parts = hash.split('/');
      if (parts[0] === 'quantitative' && parts.length > 1) {
        if (parts[1] === 'concepts' || parts[1] === 'modules') {
          setActiveSubTab(parts[1]);
        }
      } else if (parts[0] === 'quantitative') {
        setActiveSubTab('concepts');
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    
    if (window.location.hash === '#/quantitative' || window.location.hash === '#quantitative') {
        window.location.replace('#/quantitative/concepts');
    }
    
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);
  const [activeQuizQuestions, setActiveQuizQuestions] = useState(null);
  const [activeQuizTitle, setActiveQuizTitle] = useState('');
  // 10 Concept Sheet PDFs list
  const conceptPDFs = [
    {
      filename: "M1. Arithmetic-Geometry-and-Quantitative-Comparison.pdf",
      title: "M1. Arithmetic, Geometry & Comparisons",
      topics: "Numbers, factors, vertical angles, quantitative comparison structures."
    },
    {
      filename: "M2. Mixed-Quantitative-Reasoning-and-Algebra.pdf",
      title: "M2. Quantitative Reasoning & Algebra",
      topics: "Linear equations, simplifying algebraic variables, comparisons."
    },
    {
      filename: "M3-Equations-Geometry-and-Word-Problems.pdf",
      title: "M3. Equations, Geometry & Word Problems",
      topics: "Work rates, speed problems, multi-step geometry rules."
    },
    {
      filename: "M4-Graphs-Charts-and-Data-Interpretation.pdf",
      title: "M4. Graphs, Charts & Data Interpretation",
      topics: "Pie charts, double bar graphs, mean, median, mode, range."
    },
    {
      filename: "m5-Ratios-Comparisons-and-Geometry-Practice.pdf",
      title: "M5. Ratios, Comparisons & Geometry",
      topics: "Ratio scaling, similar triangles, circle sectors, and angle properties."
    },
    {
      filename: "m6-Algebraic-Translation-and-Plane-Geometry.pdf",
      title: "M6. Algebraic Translation & Plane Geometry",
      topics: "Translating statements to algebra, quadratic factoring, polygons."
    },
    {
      filename: "m7-Sequences-Algebra-and-Area-Reasoning.pdf",
      title: "M7. Sequences, Algebra & Shaded Areas",
      topics: "Arithmetic/geometric sequences, shaded area calculation rules."
    },
    {
      filename: "m8-Comparisons-Percentages-and-Charts.pdf",
      title: "M8. Comparisons, Percentages & Charts",
      topics: "Percentage change tricks, compound ratios, complex charts."
    },
    {
      filename: "m9-Data-Profit-Ratios-and-Geometry.pdf",
      title: "M9. Data, Profit, Ratios & Coordinate Grids",
      topics: "Profit margins, discounts, circle arcs, coordinate coordinates."
    },
    {
      filename: "m10-Percentages-Ratios-and-Final-Mixed-Practice.pdf",
      title: "M10. Percentages, Ratios & Mixed Methods",
      topics: "Mixture formulas, consecutive integers, final GAT cheat sheets."
    }
  ];

  // 10 Quantitative Modules list (for practice)
  const quantModules = [
    {
      id: "m1",
      filename: "Module-1-practice.pdf",
      title: "Module 1: Arithmetic & Geometry Practice",
      category: "Arithmetic",
      description: "Practice questions covering number properties, fractions, divisibility, and angles."
    },
    {
      id: "m2",
      filename: "Module-2-Mixed-Quantitative-Reasoning-and-Algebra.pdf",
      title: "Module 2: Algebra Reasoning Practice",
      category: "Algebra",
      description: "Practice algebra simplifications, linear systems, and equations."
    },
    {
      id: "m3",
      filename: "Module-3-Practice-GAT-MATH.pdf",
      title: "Module 3: Word Problems Practice",
      category: "Geometry",
      description: "GAT math exam questions on rate, time, speed, and geometric figures."
    },
    {
      id: "m4",
      filename: "Module-4-GAT-MATHS.pdf",
      title: "Module 4: Graphs, Charts & Data",
      category: "Data Analysis",
      description: "Practice interpreting bar charts, pie charts, and tabular data."
    },
    {
      id: "m6",
      filename: "MODULE 6-10 MATHS PRACTICE (1)/MODULE-6-Algebraic-Translation-and-Plane-Geometry.pdf",
      title: "Module 6: Algebraic translation & Planes",
      category: "Algebra",
      description: "Practice translating statements, solving quadratics, and plane geometry properties."
    },
    {
      id: "m5",
      filename: "MODULE 6-10 MATHS PRACTICE (1)/MODULE 5.pdf",
      title: "Module 5: Ratios & Shapes Practice",
      category: "Geometry",
      description: "Detailed practice worksheets for ratios, comparisons, and triangles."
    },
    {
      id: "m7",
      filename: "MODULE 6-10 MATHS PRACTICE (1)/MODULE 7.pdf",
      title: "Module 7: Sequences & Area Practice",
      category: "Algebra",
      description: "Practice arithmetic sequences and solving shaded geometry areas."
    },
    {
      id: "m8",
      filename: "MODULE 6-10 MATHS PRACTICE (1)/MODULE-8-Comparisons-Percentages-and-Charts.pdf",
      title: "Module 8: Percentages & Data Practice",
      category: "Arithmetic",
      description: "Worksheet covering percentages, comparisons, and charts."
    },
    {
      id: "m9",
      filename: "MODULE 6-10 MATHS PRACTICE (1)/MODULE-9-Data-Profit-Ratios-and-Geometry.pdf",
      title: "Module 9: Advanced Practice Math",
      category: "Arithmetic",
      description: "Drill profit/loss, percentages, ratios, and geometry."
    },
    {
      id: "m10",
      filename: "MODULE 6-10 MATHS PRACTICE (1)/MODULE-10-Percentages-Ratios-and-Final-Mixed-Practice.pdf",
      title: "Module 10: Final Mixed GAT Math",
      category: "Data Analysis",
      description: "Final comprehensive mixed practice math tests covering all categories."
    },
    {
      id: "m11",
      title: "M11. Module 11: Latest Of Prep",
      category: "Latest Of Prep",
      description: "Latest high-frequency GAT quantitative questions covering Arithmetic, Algebra, Geometry, and Data Analysis."
    }
  ];

  const handleStartQuiz = (module, quizIndex) => {
    if (!activeUser) {
      onAuthRequired();
      return;
    }

    if (module.id === "m11") {
      const part11Pool = quantQuestions.filter(q => q.part11);
      let selected = [];
      if (quizIndex === 1) {
        selected = part11Pool.slice(0, 20);
      } else if (quizIndex === 2) {
        selected = part11Pool.slice(20, 40);
      } else if (quizIndex === 3) {
        selected = part11Pool.slice(40, 58);
      } else {
        selected = [...part11Pool].sort(() => Math.random() - 0.5).slice(0, 25);
      }
      const shuffled = [...selected].sort(() => Math.random() - 0.5);
      setActiveQuizQuestions(shuffled);
      setActiveQuizTitle(`${module.title} - Quiz ${quizIndex}`);
      return;
    }

    let filtered = quantQuestions.filter(q => q.category && q.category.toLowerCase() === module.category.toLowerCase());
    if (filtered.length === 0) {
      filtered = [...quantQuestions];
    }
    
    // Each module has 100 questions. Divide by 25.
    const startIdx = (quizIndex - 1) * 25;
    const endIdx = quizIndex * 25;
    let selected = filtered.slice(startIdx, endIdx);
    
    // Fallback if not enough questions
    if (selected.length === 0) {
      selected = [...filtered].sort(() => Math.random() - 0.5).slice(0, 25);
    }
    
    // Shuffle the 25 questions so they aren't always in the same order
    const shuffled = [...selected].sort(() => Math.random() - 0.5);
    
    setActiveQuizQuestions(shuffled);
    setActiveQuizTitle(`${module.title} - Quiz ${quizIndex}`);
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

  const handleQuizFinish = (totalQ, accuracy, questionStats) => {
    const totalCompleted = stats.quantCompleted + totalQ;
    let newAccuracy = stats.quantAccuracy;
    
    if (stats.quantCompleted === 0) {
      newAccuracy = accuracy;
    } else {
      newAccuracy = Math.round(((stats.quantAccuracy * stats.quantCompleted) + (accuracy * totalQ)) / totalCompleted);
    }

    updateStats({
      quantCompleted: totalCompleted,
      quantAccuracy: newAccuracy
    });

    if (recordQuizResults) {
      recordQuizResults(questionStats);
    }
  };

  if (activeQuizQuestions) {
    return (
      <PracticeQuiz 
        questions={activeQuizQuestions} 
        categoryTitle={activeQuizTitle} 
        isQuant={true}
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
            <Calculator style={{ color: 'var(--accent-quant)' }} /> Quantitative Reasoning
          </h2>
          <p style={{ color: 'var(--text-secondary)' }}>Download concept overview sheets to learn math formulas, and complete practice modules.</p>
        </div>
      </section>

      {/* Quantitative Mock Test Banner */}
      <a 
        href="#/mock-test/quant" 
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '18px 24px',
          background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.12), rgba(15, 45, 74, 0.25))',
          border: '1.5px solid #0284c7',
          borderRadius: '12px',
          textDecoration: 'none',
          color: 'inherit',
          cursor: 'pointer',
          flexWrap: 'wrap',
          gap: 12
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#0284c7', fontWeight: 800, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 4 }}>
            <Award size={16} /> Computerized Simulation
          </div>
          <h3 style={{ margin: 0, fontSize: '1.2rem', fontFamily: 'Outfit', color: 'var(--text-primary)' }}>
            Take Quantitative Mock Exam Alone (48 Questions)
          </h3>
          <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: '0.86rem' }}>
            2 Timed sections • 24 Math questions each (50 mins total) • Pure Arithmetic, Algebra, Geometry & Data Analysis
          </p>
        </div>
        <button className="btn btn-primary" style={{ pointerEvents: 'none', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, padding: '10px 20px', background: '#0284c7', borderColor: '#0284c7' }}>
          Start Math Exam <ArrowRight size={16} />
        </button>
      </a>

      {/* Sub-Tabs: Concepts vs Modules */}
      <div className="tab-container">
        <button 
          onClick={() => { setActiveSubTab('concepts'); window.location.hash = '/quantitative/concepts'; }}
          className={`section-tab quant ${activeSubTab === 'concepts' ? 'active' : ''}`}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <GraduationCap size={16} /> Math Concepts (Learn)
          </span>
        </button>
        <button 
          onClick={() => { setActiveSubTab('modules'); window.location.hash = '/quantitative/modules'; }}
          className={`section-tab quant ${activeSubTab === 'modules' ? 'active' : ''}`}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <BookOpen size={16} /> Practice Modules (Practice)
          </span>
        </button>
      </div>

      {/* Concept Learning Panel (PDF Grid) */}
      {activeSubTab === 'concepts' && (
        <div className="cards-grid animate-fade-in">
          {conceptPDFs.map((pdf, idx) => (
            <div key={idx} className="glass-panel glass-panel-hover pdf-card quant">
              <div>
                <h3 className="pdf-card-title" style={{ fontSize: '1.05rem', color: 'var(--text-primary)' }}>{pdf.title}</h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--accent-quant)', display: 'block', marginBottom: 8, fontWeight: 600 }}>
                  Concept Overview Sheet
                </span>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {pdf.topics}
                </p>
              </div>

              <div className="pdf-card-footer" style={{ marginTop: '20px' }}>
                <button 
                  onClick={() => handleReadPdf(`/resources/Quantative/zip file Mathematics concept/${pdf.filename}`, pdf.filename)}
                  className="btn btn-quant"
                  style={{ width: '100%', fontSize: '0.8rem', padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                >
                  {!activeUser ? <Lock size={14} /> : <GraduationCap size={14} />} 
                  {activeUser ? 'Read Concept Sheet' : 'Sign In to Read'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Practice Modules PDF downloads & practice quizzes */}
      {activeSubTab === 'modules' && (
        <div className="cards-grid">
          {quantModules.map((module) => (
            <div key={module.id} className="glass-panel glass-panel-hover pdf-card quant animate-fade-in">
              <div>
                <h3 className="pdf-card-title" style={{ fontSize: '1.05rem', color: 'var(--text-primary)' }}>{module.title}</h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--accent-quant)', marginBottom: '8px', fontWeight: 600 }}>
                  Focus: {module.category}
                </p>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {module.description}
                </p>
              </div>

              <div className="pdf-card-footer" style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, width: '100%' }}>
                  <button onClick={() => handleStartQuiz(module, 1)} className="btn btn-quant" style={{ padding: '8px', fontSize: '0.8rem', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>{!activeUser && <Lock size={12} style={{marginRight: 4}}/>} Quiz 1</button>
                  <button onClick={() => handleStartQuiz(module, 2)} className="btn btn-quant" style={{ padding: '8px', fontSize: '0.8rem', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>{!activeUser && <Lock size={12} style={{marginRight: 4}}/>} Quiz 2</button>
                  <button onClick={() => handleStartQuiz(module, 3)} className="btn btn-quant" style={{ padding: '8px', fontSize: '0.8rem', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>{!activeUser && <Lock size={12} style={{marginRight: 4}}/>} Quiz 3</button>
                  <button onClick={() => handleStartQuiz(module, 4)} className="btn btn-quant" style={{ padding: '8px', fontSize: '0.8rem', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>{!activeUser && <Lock size={12} style={{marginRight: 4}}/>} Quiz 4</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
