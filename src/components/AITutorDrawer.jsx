import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, 
  Sparkles, 
  Send, 
  X
} from 'lucide-react';
import { formatMathAndText } from '../utils/gatFormatters.js';

export default function AITutorDrawer({ 
  isOpen, 
  onClose, 
  currentQuestion, 
  userAnswer, 
  isSubmitted, 
  activeUser,
  contextType = "Quiz", // "Quiz", "Mock Test", "Guided Remedial"
  lightSurface = false
}) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const panelRef = useRef(null);
  const chatEndRef = useRef(null);

  // Smoothly bring the inline transparent panel into view when opened
  useEffect(() => {
    if (isOpen && panelRef.current) {
      panelRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [isOpen]);

  // Auto-scroll chat container when new messages arrive
  useEffect(() => {
    if (messages.length > 1 || loading) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [messages, loading]);

  // Reset or prime messages when a new question is opened
  useEffect(() => {
    if (!currentQuestion) return;

    const initialText = `Hello! I am **Preppy**, your ScholarPrep AI Tutor 🤖✨

I am here to help you master this **${currentQuestion.category || 'GAT'}** question.
${isSubmitted && userAnswer !== undefined 
  ? (userAnswer === currentQuestion.correctAnswer 
      ? `Great job getting this right! Would you like to see a **30 second speed shortcut** or a deeper breakdown of the math & logic?` 
      : `Let's review this together. Would you like me to **explain why option ${String.fromCharCode(65 + (userAnswer >= 0 ? userAnswer : 0))} is incorrect**, or walk you through the solution step by step?`)
  : `Need a **subtle hint**, a **formula reminder**, or a **step by step explanation** right here inside the question? Click a button below or ask me anything!`
}`;

    setMessages([
      {
        sender: 'ai',
        text: initialText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  }, [currentQuestion?.id, isSubmitted]);

  if (!isOpen || !currentQuestion) return null;

  const cleanTextForPrompt = (str) => str
    ? String(str)
        .replace(/<svg[\s\S]*?<\/svg>/gi, '[Diagram]')
        .replace(/<span class="math-frac">\s*<span class="num">([\s\S]*?)<\/span>\s*<span class="den">([\s\S]*?)<\/span>\s*<\/span>/gi, '($1)/($2)')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&gt;/g, '>')
        .replace(/&lt;/g, '<')
        .replace(/&frasl;/g, '/')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/\s+/g, ' ')
        .trim()
    : '';

  const formatChatMessage = (text) => {
    if (!text) return '';
    let s = String(text);

    // Remove markdown horizontal divider lines (---, ***, ___)
    s = s.replace(/^\s*[-*_]{3,}\s*$/gm, '');

    // Remove markdown table separator pipes if any
    s = s.replace(/^\s*\|[-:\s|]+\|\s*$/gm, '');

    // Replace leading bullet dashes "- " or "* " with clean bullet dots
    s = s.replace(/^\s*[-–—*]\s+/gm, '• ');

    // Headings ### Title
    s = s.replace(
      /^#{1,4}\s+(.+)$/gm,
      '<div style="color:var(--accent-ai);font-weight:700;font-size:0.98rem;margin:8px 0 2px 0;">$1</div>'
    );

    // Highlight "Step 1:", "Step 2:", etc.
    s = s.replace(
      /\b(Step\s+\d+\s*:)/gi,
      '<strong style="color:var(--accent-ai);font-family:Outfit,sans-serif;">$1</strong>'
    );

    // Render all fractions (\frac{a}{b}, a/b, .math-frac), roots (\sqrt{}, √()), exponents (x^2), and symbols in crisp math fonts
    return formatMathAndText(s);
  };

  const getSystemPrompt = () => {
    const qClean = cleanTextForPrompt(currentQuestion.question);
    const passageClean = currentQuestion.passage ? cleanTextForPrompt(currentQuestion.passage) : '';
    const optionsText = (currentQuestion.options || [])
      .map((opt, i) => `${String.fromCharCode(65 + i)}) ${cleanTextForPrompt(opt)}`)
      .join('\n');
    const correctLetter = String.fromCharCode(65 + (currentQuestion.correctAnswer || 0));
    const userLetter = userAnswer !== undefined && userAnswer >= 0 ? String.fromCharCode(65 + userAnswer) : 'None / Skipped';

    return `You are "Preppy", ScholarPrep's friendly, elite AI Tutor specializing exclusively in the Saudi English GAT (General Aptitude Test / Qiyas).

CURRENT QUESTION (${contextType}):
Category: ${currentQuestion.category || 'General'}
${passageClean ? `Reading Passage: ${passageClean}\n` : ''}Question: ${qClean}
Options:
${optionsText}
Correct Answer: ${correctLetter} (${cleanTextForPrompt(currentQuestion.options?.[currentQuestion.correctAnswer])})
Official Explanation: ${cleanTextForPrompt(currentQuestion.explanation)}
Student Selected: ${userLetter}

STRICT OUTPUT STYLE RULES:
1. Write in clean, clear numbered steps (Step 1:, Step 2:, Step 3:) or short paragraphs.
2. For math questions, use proper mathematical notation: write fractions as \\frac{numerator}{denominator}, square roots as \\sqrt{expression}, exponents as x^{2}, multiplication as \\times, division as \\div, and wrap the final answer in \\boxed{answer} so our math engine renders crisp textbook math fonts!
3. For Reading Comprehension questions, quote the exact phrase from the passage that proves the answer.
4. Keep your response concise (4 to 7 clear sentences), warm, and easy to read.

TOPIC GUARDRAIL:
Only answer questions related to the GAT exam, math, verbal reasoning, and this problem. Politely refuse off-topic requests.`;
  };

  const buildSmartLocalFallback = (userQuery) => {
    const qLower = userQuery.toLowerCase();
    const cat = currentQuestion.category || 'GAT';
    const correctIdx = typeof currentQuestion.correctAnswer === 'number' ? currentQuestion.correctAnswer : 0;
    const correctLetter = String.fromCharCode(65 + correctIdx);
    const correctVal = currentQuestion.options?.[correctIdx] || '';
    const exp = currentQuestion.explanation || '';
    const userLetter = userAnswer !== undefined && userAnswer >= 0 ? String.fromCharCode(65 + userAnswer) : null;
    const userVal = userAnswer !== undefined && userAnswer >= 0 ? currentQuestion.options?.[userAnswer] : null;

    if (qLower.includes('hint')) {
      if (cat === 'Analogy') {
        return `**💡 Preppy's Hint (Analogy)**\n\nStep 1: Build a short bridge sentence connecting the two words in the question stem.\n\nStep 2: Check the exact direction of the relationship (for example, Part to Whole vs. Whole to Part).\n\nStep 3: Eliminate any option whose word order is reversed.`;
      }
      if (cat === 'Contextual Error') {
        return `**💡 Preppy's Hint (Contextual Error)**\n\nStep 1: Read the whole sentence to understand its overall positive or negative meaning.\n\nStep 2: Check each of the 4 underlined words in context.\n\nStep 3: Find the single underlined word that contradicts the main idea of the sentence.`;
      }
      if (cat === 'Sentence Completion') {
        return `**💡 Preppy's Hint (Sentence Completion)**\n\nStep 1: Look for transition words in the sentence such as although, despite, therefore, or because.\n\nStep 2: Test the first word of each choice in the first blank to quickly eliminate two options before checking the second blank.`;
      }
      if (cat === 'Reading Comprehension') {
        return `**💡 Preppy's Hint (Reading Comprehension)**\n\nStep 1: Locate the key phrase from the question inside the passage.\n\nStep 2: Read the sentence right before and right after that phrase. Every correct GAT answer is directly supported by the passage text.`;
      }
      return `**💡 Preppy's Hint (${cat})**\n\nStep 1: Identify what quantity or relationship the question is asking you to find.\n\nStep 2: ${exp.split('. ')[0]}.`;
    }

    if (qLower.includes('shortcut') || qLower.includes('30s') || qLower.includes('fast')) {
      return `**⚡ Preppy's 30 Second Shortcut**\n\nStep 1: Focus on the core ${cat} rule tested here.\n\nStep 2: ${exp || `Match the relationship directly to **Option ${correctLetter} (${correctVal})**.`}\n\nStep 3: Final Answer: \\boxed{${correctLetter}) ${correctVal}}`;
    }

    if (qLower.includes('wrong') && userLetter && userAnswer !== correctIdx) {
      return `**🔍 Why Option ${userLetter} (${userVal}) is Incorrect**\n\nStep 1: Option ${userLetter} (${userVal}) is a common distractor designed to look appealing at first glance.\n\nStep 2: ${exp}\n\nStep 3: Therefore, the correct choice is \\boxed{${correctLetter}) ${correctVal}}.`;
    }

    return `**📘 Preppy's Step by Step Solution (${cat})**\n\nStep 1: Identify the given values and target expression in the question.\n\nStep 2: ${exp || `Compare each option against the rule in the question.`}\n\nStep 3: Therefore, the correct answer is \\boxed{${correctLetter}) ${correctVal}}.`;
  };

  const handleSend = async (textToSend) => {
    const userQuery = textToSend || input.trim();
    if (!userQuery || loading) return;

    setInput('');
    const newMsg = {
      sender: 'user',
      text: userQuery,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, newMsg]);
    setLoading(true);

    const payloadMessages = [
      { role: 'system', content: getSystemPrompt() },
      ...messages.slice(-5).map(m => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.text
      })),
      { role: 'user', content: userQuery }
    ];

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 14000);

      const response = await fetch('https://text.pollinations.ai/openai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'openai',
          messages: payloadMessages,
          temperature: 0.4
        }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error('AI API returned non-200');
      }

      const data = await response.json();
      const botReply = data.choices?.[0]?.message?.content?.trim();
      if (!botReply) throw new Error('Empty AI reply');

      setMessages(prev => [...prev, {
        sender: 'ai',
        text: botReply,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } catch (err) {
      const fallbackReply = buildSmartLocalFallback(userQuery);
      setMessages(prev => [...prev, {
        sender: 'ai',
        text: fallbackReply,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } finally {
      setLoading(false);
    }
  };

  const quickPrompts = [
    { label: "Give me a hint", prompt: "Can you give me a subtle hint to point me in the right direction without revealing the answer?" },
    { label: "Explain step by step", prompt: "Please explain how to solve this question step by step using clear math formulas and fractions." },
    { label: "30s Speed Shortcut", prompt: "Is there a faster trick or shortcut to solve this in under 30 seconds on the GAT?" },
    { label: "Why is my answer wrong?", prompt: "Can you explain why the choice I picked might be a common trap or incorrect?" }
  ];

  const textColor = lightSurface ? '#0f172a' : 'var(--text-primary)';
  const subTextColor = lightSurface ? '#475569' : 'var(--text-secondary)';
  const panelBg = lightSurface ? 'rgba(255, 255, 255, 0.68)' : 'rgba(26, 20, 17, 0.42)';
  const msgBg = lightSurface ? 'rgba(241, 245, 249, 0.72)' : 'rgba(255, 255, 255, 0.05)';
  const borderCol = lightSurface ? 'rgba(2, 132, 199, 0.32)' : 'rgba(212, 119, 66, 0.35)';

  return (
    <div
      ref={panelRef}
      className="animate-fade-in"
      style={{
        marginTop: '18px',
        width: '100%',
        background: panelBg,
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: `1.5px solid ${borderCol}`,
        borderRadius: '14px',
        boxShadow: '0 8px 28px rgba(0, 0, 0, 0.14)',
        display: 'flex',
        flexDirection: 'column',
        color: textColor,
        fontFamily: "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif",
        overflow: 'hidden',
        position: 'relative',
        zIndex: 12
      }}
    >
      {/* Transparent Header Integrated with Question */}
      <div style={{
        padding: '12px 18px',
        borderBottom: `1px solid ${borderCol}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: lightSurface ? 'rgba(224, 242, 254, 0.45)' : 'rgba(212, 119, 66, 0.10)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: '34px',
            height: '34px',
            borderRadius: '9px',
            background: 'linear-gradient(135deg, var(--accent-ai), #D47742)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white'
          }}>
            <Bot size={19} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1rem', color: textColor, display: 'flex', alignItems: 'center', gap: 6 }}>
              Preppy AI Tutor
              <span style={{ fontSize: '0.7rem', padding: '2px 7px', borderRadius: '999px', background: 'rgba(212, 119, 66, 0.18)', color: 'var(--accent-ai)', fontWeight: 700 }}>
                Math & GAT Ready
              </span>
            </div>
            <div style={{ fontSize: '0.74rem', color: subTextColor }}>
              Integrated live helper for Question • Instant step-by-step math & shortcuts
            </div>
          </div>
        </div>

        <button 
          onClick={onClose}
          title="Close Preppy"
          style={{
            background: 'transparent',
            border: 'none',
            color: subTextColor,
            cursor: 'pointer',
            padding: '6px',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <X size={18} />
        </button>
      </div>

      {/* Quick Prompts Bar */}
      <div style={{
        padding: '10px 16px',
        background: 'transparent',
        borderBottom: `1px solid ${borderCol}`,
        display: 'flex',
        gap: 8,
        overflowX: 'auto',
        flexWrap: 'wrap'
      }}>
        {quickPrompts.map((qp, i) => (
          <button
            key={i}
            onClick={() => handleSend(qp.prompt)}
            disabled={loading}
            style={{
              padding: '5px 12px',
              borderRadius: '20px',
              fontSize: '0.78rem',
              fontWeight: 600,
              background: msgBg,
              border: `1px solid ${borderCol}`,
              color: textColor,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              transition: 'all 0.2s'
            }}
          >
            <Sparkles size={12} style={{ color: 'var(--accent-ai)' }} />
            {qp.label}
          </button>
        ))}
      </div>

      {/* Chat Messages */}
      <div style={{
        maxHeight: '340px',
        overflowY: 'auto',
        padding: '16px 18px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        background: 'transparent'
      }}>
        {messages.map((m, i) => (
          <div 
            key={i}
            style={{
              alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '92%',
              background: m.sender === 'user' ? 'var(--primary)' : msgBg,
              border: m.sender === 'user' ? 'none' : `1px solid ${borderCol}`,
              padding: '12px 16px',
              borderRadius: m.sender === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
              color: m.sender === 'user' ? '#ffffff' : textColor,
              fontSize: '0.95rem',
              fontWeight: 500,
              lineHeight: 1.75,
              letterSpacing: '0.01em'
            }}
          >
            <div
              dangerouslySetInnerHTML={{ __html: formatChatMessage(m.text) }}
            />
            <div style={{ fontSize: '0.66rem', color: m.sender === 'user' ? 'rgba(255,255,255,0.75)' : subTextColor, marginTop: 6, textAlign: 'right' }}>
              {m.time}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{
            alignSelf: 'flex-start',
            background: msgBg,
            border: `1px solid ${borderCol}`,
            padding: '10px 14px',
            borderRadius: '12px 12px 12px 2px',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            color: textColor,
            fontSize: '0.88rem'
          }}>
            <Bot size={16} className="animate-spin" style={{ color: 'var(--accent-ai)' }} />
            Preppy is writing the solution...
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input Box */}
      <form 
        onSubmit={(e) => { e.preventDefault(); handleSend(); }}
        style={{
          padding: '12px 16px',
          borderTop: `1px solid ${borderCol}`,
          background: 'transparent',
          display: 'flex',
          gap: 10
        }}
      >
        <input 
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask Preppy any math or verbal question right here..."
          style={{
            flexGrow: 1,
            background: msgBg,
            border: `1px solid ${borderCol}`,
            borderRadius: '8px',
            padding: '9px 14px',
            color: textColor,
            fontSize: '0.9rem',
            outline: 'none'
          }}
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="btn btn-ai"
          style={{
            borderRadius: '8px',
            padding: '0 16px',
            cursor: input.trim() && !loading ? 'pointer' : 'default',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Send size={17} />
        </button>
      </form>
    </div>
  );
}
