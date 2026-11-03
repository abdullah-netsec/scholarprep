import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, 
  Sparkles, 
  Calendar, 
  CheckCircle2, 
  Target, 
  Send, 
  BookOpen, 
  Calculator, 
  Plus, 
  RefreshCw,
  Clock,
  TrendingUp,
  BrainCircuit,
  Settings,
  AlertCircle,
  Lock
} from 'lucide-react';
import { checkAPIRateLimit } from './SecurityMonitor.jsx';
import { formatMathAndText } from '../utils/gatFormatters.js';

export default function AISpanner({ stats, updateStats, activeUser, onAuthRequired }) {
  // Planner configurations
  const [targetScore, setTargetScore] = useState(90);
  const [prepWeeks, setPrepWeeks] = useState(4);
  const [dailyHours, setDailyHours] = useState(2);
  const [level, setLevel] = useState('intermediate');
  
  const [plan, setPlan] = useState(null);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  
  
  const chatEndRef = useRef(null);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isTyping]);

  // Load existing plan from localStorage
  useEffect(() => {
    if (activeUser) {
      const key = `scholar_gat_study_plan_${activeUser.email.replace(/[@.]/g, '_')}`;
      const savedPlan = localStorage.getItem(key);
      if (savedPlan) {
        try {
          setPlan(JSON.parse(savedPlan));
        } catch (e) {
          console.error("Error loading study plan", e);
        }
      }
    }

    // Set initial welcome message
    const welcomeMsg = {
      sender: 'bot',
      text: getWelcomeMessage(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setChatMessages([welcomeMsg]);
  }, [activeUser]);

  const getWelcomeMessage = () => {
    const userName = activeUser ? activeUser.name : 'Student';
    const totalQ = stats.quantCompleted + stats.verbalCompleted;
    if (totalQ === 0) {
      return `Hello, ${userName}! I am **Preppy** 🤖✨\n\nI can build your personalized study roadmap and tutor you on any GAT topic. Configure your target score on the left to generate your custom week by week calendar!`;
    } else {
      return `Welcome back, ${userName}! I am **Preppy**, and I have analyzed your GAT practice performance:\n• **Total Completed**: ${totalQ} questions\n• **Quant Accuracy**: ${stats.quantAccuracy}% (${stats.quantCompleted} done)\n• **Verbal Accuracy**: ${stats.verbalAccuracy}% (${stats.verbalCompleted} done)\n• **Mock Tests Completed**: ${stats.testsTaken} (Avg score: ${stats.averageTestScore}/100)\n\n${stats.quantAccuracy < stats.verbalAccuracy ? "Your quantitative skills need a bit of focus compared to verbal. Let's work on **Quantitative Modules** today!" : "You are doing well! Let's practice some advanced **Verbal Reasoning** today!"}\n\nAsk me anything! I can explain formulas, write practice questions, or adjust your schedule.`;
    }
  };

  // Generate study plan calendar items
  const generatePlan = () => {
    if (!activeUser) {
      onAuthRequired();
      return;
    }

    const planItems = [];
    const totalDays = prepWeeks * 7;
    
    const quantModules = [
      "Module 1: Arithmetic & Geometry Concepts",
      "Module 2: Algebraic Reasoning & Equations",
      "Module 3: Word Problems & Ratios",
      "Module 4: Graphs & Data Interpretation",
      "Module 5: Ratios & Advanced Geometry",
      "Module 6: Algebraic Translation",
      "Module 7: Sequences & Area Reasoning",
      "Module 8: Comparisons & Charts",
      "Module 9: Profit, Ratios & Geometry Review",
      "Module 10: Percentage & Final Mixed Practice"
    ];

    const verbalTopics = [
      "Verbal Analogies - Core relationships",
      "Sentence Completion - Blanks & transition words",
      "Contextual Error - Semantic analysis drills",
      "Reading Comprehension - Active reading & skimming",
      "High Frequency Vocabulary Flashcards (Drill 25 words)",
      "Verbal Analogy practice quiz",
      "Reading Comprehension practice passage"
    ];

    for (let day = 1; day <= totalDays; day++) {
      const weekNum = Math.ceil(day / 7);
      const dayNumInWeek = ((day - 1) % 7) + 1;
      let task = "";
      let category = "";
      
      if (day === totalDays) {
        task = "Final Full-Length GAT Mock Test & Review";
        category = "test";
      } else if (day % 7 === 0) {
        task = `Weekly Review & Weak Areas Correction (Module ${weekNum})`;
        category = "review";
      } else if (day % 2 === 1) {
        const moduleIndex = (Math.floor(day / 2)) % quantModules.length;
        task = `Quant: Learn concepts and complete practice for ${quantModules[moduleIndex]}`;
        category = "quant";
      } else {
        const topicIndex = (Math.floor(day / 2) - 1) % verbalTopics.length;
        task = `Verbal: Study ${verbalTopics[topicIndex]}`;
        category = "verbal";
      }

      planItems.push({
        day,
        week: weekNum,
        dayOfWeek: dayNumInWeek,
        task,
        category,
        completed: false
      });
    }

    const newPlan = {
      targetScore,
      prepWeeks,
      dailyHours,
      level,
      startDate: new Date().toLocaleDateString(),
      items: planItems
    };

    setPlan(newPlan);
    const key = `scholar_gat_study_plan_${activeUser.email.replace(/[@.]/g, '_')}`;
    localStorage.setItem(key, JSON.stringify(newPlan));
    updateStats({ studyPlanCreated: true });

    addCoachResponse(`I have generated a customized **${prepWeeks}-week study roadmap** targeting a score of **${targetScore}**! 📅\n\nI scheduled **${dailyHours} hours of study daily**, alternating between Quantitative modules and Verbal categories. Your calendar is ready below! Let me know if you want study tips for Week 1.`);
  };

  const toggleTaskCompletion = (dayIndex) => {
    if (!plan || !activeUser) return;
    const updatedItems = [...plan.items];
    updatedItems[dayIndex].completed = !updatedItems[dayIndex].completed;
    
    const updatedPlan = { ...plan, items: updatedItems };
    setPlan(updatedPlan);
    
    const key = `scholar_gat_study_plan_${activeUser.email.replace(/[@.]/g, '_')}`;
    localStorage.setItem(key, JSON.stringify(updatedPlan));
    
    if (updatedItems[dayIndex].completed) {
      updateStats({ streak: stats.streak + 1 });
    }
  };

  const addCoachResponse = (text) => {
    setIsTyping(true);
    setTimeout(() => {
      setChatMessages(prev => [...prev, {
        sender: 'bot',
        text,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
      setIsTyping(false);
    }, 400);
  };

  // call OpenAI or Gemini API
  const fetchLLMCompletion = async (prompt) => {
    const userName = activeUser ? activeUser.name : 'Guest';
    const userEmail = activeUser ? activeUser.email : 'guest@scholargat.com';

    const systemPrompt = `You are "Preppy", ScholarPrep's friendly and expert AI Coach for the English GAT (General Aptitude Test).
Your primary job is to tutor GAT concepts, explain formulas, solve questions, and draft study plans.
You are talking to the student: ${userName} (${userEmail}).
Here are their live GAT diagnostics:
Streak: ${stats.streak} days
Quantitative accuracy: ${stats.quantAccuracy}% (${stats.quantCompleted} questions completed)
Verbal accuracy: ${stats.verbalAccuracy}% (${stats.verbalCompleted} questions completed)
Mock tests completed: ${stats.testsTaken} (Average score: ${stats.averageTestScore}/100)
Target score: ${plan ? plan.targetScore : '90+'}

CRITICAL RULE: You MUST ONLY answer questions related to the GAT exam, academics, math, verbal logic, study strategies, or the student's feelings regarding studying.

STRICT OUTPUT STYLE:
1. Write in clean numbered steps (1., 2., 3.) or clear short paragraphs.
2. For math formulas and equations, use proper mathematical notation such as \\frac{a}{b}, \\sqrt{x}, x^{2}, \\times, \\div, and \\boxed{answer} so our math engine renders crisp textbook math fonts. Use **bold** to highlight key concepts.`;

    const response = await fetch('https://text.pollinations.ai/openai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'openai',
        messages: [
          { role: 'system', content: systemPrompt },
          ...chatMessages.slice(-6).map(m => ({
            role: m.sender === 'user' ? 'user' : 'assistant',
            content: m.text
          })),
          { role: 'user', content: prompt }
        ],
        temperature: 0.6
      })
    });

    if (response.ok) {
      const data = await response.json();
      return data.choices[0].message.content;
    } else {
      throw new Error("AI API error");
    }
  };

  const handleSendMessage = async (e, customPrompt = '') => {
    if (e) e.preventDefault();
    if (!activeUser) {
      onAuthRequired();
      return;
    }
    
    const messageText = customPrompt || chatInput;
    if (!messageText.trim()) return;

    const userMsg = {
      sender: 'user',
      text: messageText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setIsTyping(true);

    try {
      const response = await fetchLLMCompletion(messageText);
      
      setChatMessages(prev => [...prev, {
        sender: 'bot',
        text: response,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } catch (err) {
      let responseText = "";
      const prompt = messageText.toLowerCase();

      if (prompt.includes("quant") || prompt.includes("math") || prompt.includes("formula")) {
        responseText = "**Preppy's Top GAT Math Formulas**\n\n1. **Average Speed:** Average Speed = 2xy / (x + y) when traveling the same distance at speed x and speed y.\n2. **Handshakes:** n(n - 1) / 2 where n is the number of people.\n3. **Difference of Squares:** x^2 - y^2 = (x - y)(x + y).\n4. **Combined Work Rate:** 1/T = 1/A + 1/B.\n\nType 'algebra tips' or 'geometry tips' to learn more GAT strategies.";
      } else if (prompt.includes("analogy") || prompt.includes("verbal")) {
        responseText = "**Preppy's Verbal Analogy Strategy**\n\nStep 1: Build a short bridge sentence connecting the two stem words.\nStep 2: Test each option using that exact same sentence.\nStep 3: Make sure the word order and parts of speech match 100%.";
      } else if (prompt.includes("strategy") || prompt.includes("tip")) {
        responseText = "**Preppy's GAT Pacing Strategy**\n\n1. You have 25 minutes per 24-question section (roughly 60 seconds per question).\n2. Solve the straightforward questions in under 45 seconds first.\n3. Flag tricky questions and return to them at the end of the section. Never leave a question blank!";
      } else {
        responseText = `**Preppy**\n\nAsk me about **Math formulas**, **Verbal Analogy strategies**, or **GAT Pacing tips**, and I will walk you through them step by step!`;
      }

      setChatMessages(prev => [...prev, {
        sender: 'bot',
        text: responseText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const getPlanProgress = () => {
    if (!plan || plan.items.length === 0) return 0;
    const completed = plan.items.filter(i => i.completed).length;
    return Math.round((completed / plan.items.length) * 100);
  };

  const formatText = (text) => {
    if (!text) return '';
    let formatted = String(text)
      .replace(/^\s*[-*_]{3,}\s*$/gm, '')
      .replace(/^\s*[-–—*]\s+/gm, '• ')
      .replace(/^#{1,4}\s+(.+)$/gm, '<strong>$1</strong>');
    return formatMathAndText(formatted);
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
          minHeight: '450px'
        }}>
          <div className="glass-panel" style={{
            maxWidth: '450px',
            width: '100%',
            padding: '40px',
            textAlign: 'center',
            border: '1px solid var(--glass-border)',
            boxShadow: '0 24px 64px rgba(0,0,0,0.4)'
          }}>
            <Bot size={48} style={{ color: 'var(--accent-ai)', margin: '0 auto 16px auto' }} />
            <h3 style={{ fontSize: '1.5rem', marginBottom: '12px', fontFamily: 'Outfit', color: 'var(--text-primary)' }}>
              Unlock Preppy
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5, marginBottom: '28px' }}>
              Create an account or sign in to generate a custom weekly study calendar, track completed days, and chat with Preppy!
            </p>
            <button className="btn btn-ai" onClick={onAuthRequired} style={{ width: '100%', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <Lock size={16} /> Sign In / Create Account
            </button>
          </div>
        </div>
      )}

      {/* Main Workspace content */}
      <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 32, opacity: !activeUser ? 0.35 : 1 }}>
        <section style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h2 style={{ fontSize: '2rem', display: 'flex', alignItems: 'center', gap: '12px', fontFamily: 'Outfit', color: 'var(--text-primary)' }}>
              <Bot style={{ color: 'var(--accent-ai)' }} /> Preppy
            </h2>
            <p style={{ color: 'var(--text-secondary)' }}>Configure your study roadmap, check off calendar tasks, and chat with Preppy.</p>
          </div>
        </section>

        <div className="ai-planner-grid">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div className="glass-panel" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'Outfit', color: 'var(--text-primary)' }}>
                <Target size={18} style={{ color: 'var(--accent-ai)' }} /> Setup Study Plan
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                    Target GAT Score: <strong style={{ color: 'var(--accent-ai)' }}>{targetScore} / 100</strong>
                  </label>
                  <input 
                    type="range" 
                    min="70" 
                    max="100" 
                    value={targetScore} 
                    onChange={(e) => setTargetScore(Number(e.target.value))} 
                    style={{ width: '100%', accentColor: 'var(--accent-ai)' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Prep Timeline</label>
                    <select 
                      value={prepWeeks} 
                      onChange={(e) => setPrepWeeks(Number(e.target.value))}
                      style={{
                        width: '100%',
                        background: 'var(--bg-primary)',
                        border: '1px solid var(--glass-border)',
                        color: 'var(--text-primary)',
                        padding: '10px',
                        borderRadius: 'var(--radius-sm)'
                      }}
                    >
                      <option value={2}>2 Weeks (Intensive)</option>
                      <option value={4}>4 Weeks (Standard)</option>
                      <option value={6}>6 Weeks (Steady)</option>
                      <option value={8}>8 Weeks (Thorough)</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Daily Hours</label>
                    <select 
                      value={dailyHours} 
                      onChange={(e) => setDailyHours(Number(e.target.value))}
                      style={{
                        width: '100%',
                        background: 'var(--bg-primary)',
                        border: '1px solid var(--glass-border)',
                        color: 'var(--text-primary)',
                        padding: '10px',
                        borderRadius: 'var(--radius-sm)'
                      }}
                    >
                      <option value={1}>1 Hour / Day</option>
                      <option value={2}>2 Hours / Day</option>
                      <option value={3}>3+ Hours / Day</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Current Level</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                    {['beginner', 'intermediate', 'advanced'].map((lvl) => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => setLevel(lvl)}
                        style={{
                          padding: '10px',
                          fontSize: '0.84rem',
                          fontWeight: level === lvl ? 700 : 500,
                          background: level === lvl ? 'rgba(212, 119, 66, 0.22)' : 'var(--bg-primary)',
                          border: level === lvl ? '1.5px solid var(--accent-ai)' : '1px solid var(--glass-border)',
                          color: level === lvl ? 'var(--text-primary)' : 'var(--text-secondary)',
                          borderRadius: 'var(--radius-sm)',
                          textTransform: 'capitalize'
                        }}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>

                <button 
                  className="btn btn-ai" 
                  style={{ width: '100%', padding: '12px', marginTop: '8px' }}
                  onClick={generatePlan}
                >
                  <BrainCircuit size={16} /> {plan ? "Regenerate Study Plan" : "Generate Custom Plan"}
                </button>
              </div>
            </div>

            {plan && (
              <div className="glass-panel" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '1.25rem', fontFamily: 'Outfit', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
                    <Calendar size={18} style={{ color: 'var(--accent-ai)' }} /> Calendar Roadmap
                  </h3>
                  <span style={{ fontSize: '0.85rem', color: 'var(--accent-ai)', fontWeight: 700 }}>
                    {getPlanProgress()}% Complete
                  </span>
                </div>

                <div style={{ background: 'var(--bg-tertiary)', height: '6px', borderRadius: '3px', width: '100%', marginBottom: '20px', overflow: 'hidden' }}>
                  <div style={{ background: 'var(--accent-ai)', height: '100%', width: `${getPlanProgress()}%`, transition: 'width 0.4s' }} />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: '320px', overflowY: 'auto', paddingRight: '4px' }}>
                  {plan.items.map((item, idx) => (
                    <div 
                      key={idx}
                      onClick={() => toggleTaskCompletion(idx)}
                      className="glass-panel calendar-day-card"
                      style={{
                        background: item.completed ? 'var(--bg-primary)' : 'var(--bg-secondary)',
                        opacity: item.completed ? 0.65 : 1,
                        cursor: 'pointer',
                        borderLeft: item.completed ? '3px solid var(--text-muted)' : 
                                   item.category === 'quant' ? '3px solid var(--accent-quant)' : 
                                   item.category === 'verbal' ? '3px solid var(--accent-verbal)' : 
                                   item.category === 'test' ? '3px solid var(--primary)' : '3px solid var(--warning)'
                      }}
                    >
                      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                        <CheckCircle2 size={18} style={{ color: item.completed ? 'var(--text-muted)' : 'var(--accent-ai)', marginTop: '2px', flexShrink: 0 }} />
                        <div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                            Week {item.week}, Day {item.dayOfWeek}
                          </div>
                          <p style={{ fontSize: '0.9rem', color: item.completed ? 'var(--text-secondary)' : 'var(--text-primary)', textDecoration: item.completed ? 'line-through' : 'none', margin: '4px 0 0 0' }}>
                            {item.task}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="glass-panel ai-chat-box">
            <div style={{
              padding: '20px',
              borderBottom: '1px solid var(--glass-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'linear-gradient(90deg, rgba(212, 119, 66, 0.08) 0%, transparent 100%)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(212, 119, 66, 0.18)', color: 'var(--accent-ai)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Bot size={22} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', margin: 0 }}>Preppy</h3>
                  <span style={{ fontSize: '0.75rem', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--success)', display: 'inline-block' }} /> Online
                  </span>
                </div>
              </div>
            </div>

            <div className="ai-chat-messages" style={{ display: 'flex', flexDirection: 'column' }}>
              {chatMessages.map((msg, index) => (
                <div key={index} className={`chat-message ${msg.sender}`} style={{ maxWidth: '85%', alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start', fontFamily: "'Segoe UI', 'Inter', system-ui, sans-serif", fontSize: '0.96rem', lineHeight: 1.68 }}>
                  <div dangerouslySetInnerHTML={{ __html: formatText(msg.text) }} />
                  <div style={{ fontSize: '0.7rem', color: msg.sender === 'user' ? 'rgba(255,255,255,0.75)' : 'var(--text-muted)', textAlign: 'right', marginTop: '6px' }}>
                    {msg.time}
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="chat-message bot" style={{ display: 'flex', gap: '4px', padding: '12px 16px', alignSelf: 'flex-start' }}>
                  <span className="dot" />
                  <span className="dot" />
                  <span className="dot" />
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <div style={{ display: 'flex', gap: 8, padding: '10px 16px', background: 'var(--bg-tertiary)', overflowX: 'auto', borderTop: '1px solid var(--glass-border)' }}>
              {[
                "Explain GAT average speed formula",
                "Draft a study schedule for me",
                "Give me Analogy solving tips"
              ].map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendMessage(null, p)}
                  style={{ padding: '6px 12px', background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', borderRadius: '16px', color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.76rem', whiteSpace: 'nowrap', cursor: 'pointer' }}
                >
                  {p}
                </button>
              ))}
            </div>

            <form className="ai-chat-input-area" onSubmit={(e) => handleSendMessage(e)}>
              <input 
                type="text" 
                placeholder="Ask Preppy about GAT formulas, vocabulary, or strategies..." 
                className="ai-chat-input"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
              />
              <button type="submit" aria-label="Send message to Preppy" className="btn btn-ai" style={{ padding: '0 16px', borderRadius: 'var(--radius-sm)' }}>
                <Send size={16} />
              </button>
            </form>
          </div>
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes pulse {
          0%, 100% { transform: translateY(0); opacity: 0.4; }
          50% { transform: translateY(-4px); opacity: 1; }
        }
        .chat-message.bot .dot {
          display: inline-block;
          width: 6px;
          height: 6px;
          background: var(--text-secondary);
          border-radius: 50%;
          animation: pulse 1s infinite;
          margin: 0 2px;
        }
        .chat-message.bot .dot:nth-child(2) { animation-delay: 0.2s; }
        .chat-message.bot .dot:nth-child(3) { animation-delay: 0.4s; }
      `}} />
    </div>
  );
}
