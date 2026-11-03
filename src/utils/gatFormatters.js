// Shared Math Typography & Reading Comprehension Evidence Highlighter for ScholarPrep GAT

const UNICODE_FRACTIONS = {
  '½': ['1', '2'],
  '⅓': ['1', '3'],
  '⅔': ['2', '3'],
  '¼': ['1', '4'],
  '¾': ['3', '4'],
  '⅕': ['1', '5'],
  '⅖': ['2', '5'],
  '⅗': ['3', '5'],
  '⅘': ['4', '5'],
  '⅙': ['1', '6'],
  '⅚': ['5', '6'],
  '⅛': ['1', '8'],
  '⅜': ['3', '8'],
  '⅝': ['5', '8'],
  '⅞': ['7', '8']
};

export function makeFrac(num, den) {
  return `<span class="math-frac"><span class="num">${num}</span><span class="den">${den}</span></span>`;
}

export function makeSqrt(radicand) {
  return `<span class="math-sqrt"><span class="rad-sym">&radic;</span><span class="radicand">${radicand}</span></span>`;
}

/**
 * Formats mathematical expressions, fractions, square roots, exponents,
 * comparison columns, and SVG diagrams in questions, options, explanations, and AI chat.
 */
export function formatMathAndText(text, opts = {}) {
  if (text === null || text === undefined) return '';
  const { isQuestionStem = false } = opts;

  // Split out <svg>...</svg> blocks so we never alter SVG internals
  const parts = String(text).split(/(<svg[\s\S]*?<\/svg>)/gi);

  return parts
    .map((part) => {
      if (part.toLowerCase().startsWith('<svg')) {
        return `<span class="svg-watermark-box">${part}</span>`;
      }

      let formatted = part;

      // 1. LaTeX commands -> clean HTML/Unicode math
      formatted = formatted
        .replace(/\\\[|\\\]|\\\(|\\\)/g, '')
        .replace(/\\times/g, '×')
        .replace(/\\div/g, '÷')
        .replace(/\\cdot/g, '·')
        .replace(/\\pm/g, '±')
        .replace(/\\le(?:q)?/g, '≤')
        .replace(/\\ge(?:q)?/g, '≥')
        .replace(/\\neq/g, '≠')
        .replace(/\\approx/g, '≈')
        .replace(/\\implies|\\Rightarrow/g, '⇒')
        .replace(/\\to|\\rightarrow/g, '→')
        .replace(/\\pi/g, 'π')
        .replace(/\\theta/g, 'θ')
        .replace(/\\alpha/g, 'α')
        .replace(/\\beta/g, 'β')
        .replace(/\\angle/g, '∠')
        .replace(/\\parallel/g, '∥')
        .replace(/\\perp/g, '⊥')
        .replace(/\\triangle/g, '△')
        .replace(/\\infty/g, '∞')
        .replace(/\\text\{([^}]+)\}/g, '$1')
        .replace(/\\boxed\{([^{}]+)\}/g, '<span class="math-boxed">$1</span>');

      // 2. LaTeX \frac{a}{b} and \dfrac{a}{b} (handle nested braces up to 2 levels)
      for (let pass = 0; pass < 2; pass++) {
        formatted = formatted.replace(
          /\\d?frac\{([^{}]+)\}\{([^{}]+)\}/g,
          (_, n, d) => makeFrac(n, d)
        );
      }

      // 3. LaTeX \sqrt[n]{x} and \sqrt{x}
      formatted = formatted.replace(
        /\\sqrt\[([^\]]+)\]\{([^{}]+)\}/g,
        (_, root, rad) => `<sup>${root}</sup>${makeSqrt(rad)}`
      );
      formatted = formatted.replace(
        /\\sqrt\{([^{}]+)\}/g,
        (_, rad) => makeSqrt(rad)
      );
      formatted = formatted.replace(/\\sqrt/g, '√');

      // 4. Convert <sup>NUM</sup>&frasl;<sub>DEN</sub> into .math-frac
      formatted = formatted.replace(
        /<sup>((?:(?!<\/sup>).)*?(?:<sup>.*?<\/sup>.*?)?)<\/sup>\s*(?:&frasl;|⁄)\s*<sub>((?:(?!<\/sub>).)*?(?:<sup>.*?<\/sup>.*?)?)<\/sub>/gi,
        (_, n, d) => makeFrac(n, d)
      );

      // 5. Convert Unicode vulgar fractions (½, ¾, etc.) into .math-frac
      formatted = formatted.replace(
        /(\d+)?([½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞])/g,
        (_, whole, vf) => {
          const [n, d] = UNICODE_FRACTIONS[vf];
          return (whole ? `<span class="math-num-whole">${whole}</span>` : '') + makeFrac(n, d);
        }
      );

      // 6. Convert parenthesized fractions like (x + 1)/(x - 2) or (225 ÷ 50)
      formatted = formatted.replace(
        /\(([^()<>]{1,28})\)\s*\/\s*\(([^()<>]{1,28})\)/g,
        (_, n, d) => makeFrac(n.trim(), d.trim())
      );

      // 7. Process text segments outside HTML tags so we don't break tag attributes or closing tags
      const htmlTokens = formatted.split(/(<[^>]+>)/g);
      formatted = htmlTokens
        .map((tok) => {
          if (tok.startsWith('<')) return tok;

          let t = tok;

          // Exponents: x^{2n} or x^2
          t = t.replace(/([a-zA-Z0-9)\]])\^\{([^}]+)\}/g, '$1<sup>$2</sup>');
          t = t.replace(/([a-zA-Z0-9)\]])\^([+-]?\d+[a-zA-Z]*)/g, '$1<sup>$2</sup>');

          // Subscripts: x_{1} or x_1
          t = t.replace(/([a-zA-Z0-9)\]])_\{([^}]+)\}/g, '$1<sub>$2</sub>');
          t = t.replace(/([a-zA-Z])_(\d+)/g, '$1<sub>$2</sub>');

          // Square roots with parentheses: √(10² − 8²)
          t = t.replace(/√\(([^()]+)\)/g, (_, rad) => makeSqrt(rad));
          // Square roots with numbers/variables: √144, √3, √x
          t = t.replace(/√(\d+(?:\.\d+)?[a-zA-Z]*|[a-zA-Z]\b)/g, (_, rad) => makeSqrt(rad));

          // Standalone numeric or simple algebraic slash fractions: e.g. 1/4, 23/20, 1/m, √3/4
          // Avoid dates like 10/2026 or units like km/h, m/s
          t = t.replace(
            /(^|[\s(=+−\-×÷,:;])(\d{1,4}|[a-zA-Z])\s*\/\s*(\d{1,4}|[a-zA-Z])(?=[\s)=+−\-×÷.,:;?!]|$)/g,
            (match, pre, n, d) => {
              const pair = `${n}/${d}`.toLowerCase();
              if (['km/h', 'm/s', 'mi/h', 'ft/s', 'l/m', 'g/l', 'a/b', 'c/d', 'x/y'].includes(pair) && /[a-z]/i.test(n) && /[a-z]/i.test(d)) {
                if (['km/h', 'm/s', 'mi/h', 'ft/s'].includes(pair)) return match;
              }
              return `${pre}${makeFrac(n, d)}`;
            }
          );

          return t;
        })
        .join('');

      // 8. Markdown bold & italic
      formatted = formatted.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
      formatted = formatted.replace(/\*([^*\n]+)\*/g, '<em>$1</em>');
      formatted = formatted.replace(/\$/g, '');

      // 9. Clean GAT Comparison Columns: "A) ... &nbsp;&nbsp; B) ..." or "Column A: ... &nbsp;&nbsp; Column B: ..."
      if (isQuestionStem) {
        formatted = formatted.replace(
          /(?:<br\s*\/?>|\n)\s*(?:A\)|Column\s*A\s*:)\s*([\s\S]*?)\s*(?:&nbsp;\s*){2,}(?:B\)|Column\s*B\s*:)\s*([^\n<]+(?:<(?:sup|sub|span)[^>]*>[\s\S]*?<\/(?:sup|sub|span)>[^\n<]*)*)/i,
          (_, colA, colB) =>
            `<div class="gat-compare-grid">` +
            `<div class="gat-compare-card"><span class="gat-compare-label">Column A</span><div class="gat-compare-val">${colA.trim()}</div></div>` +
            `<div class="gat-compare-card"><span class="gat-compare-label">Column B</span><div class="gat-compare-val">${colB.trim()}</div></div>` +
            `</div>`
        );
      }

      // 10. Figure callout fallback
      formatted = formatted.replace(
        /\[Figure:\s*(.*?)\]/gi,
        '<div style="background:var(--bg-secondary); padding:12px; border-left:4px solid var(--accent-quant); margin:12px 0; font-style:italic; border-radius:4px;"><strong>Figure:</strong> $1</div>'
      );

      formatted = formatted.replace(/\n/g, '<br/>');
      return formatted;
    })
    .join('');
}

const STOPWORDS = new Set([
  'the', 'and', 'for', 'that', 'this', 'with', 'from', 'are', 'was', 'were',
  'have', 'has', 'had', 'not', 'but', 'what', 'which', 'when', 'where', 'who',
  'whom', 'whose', 'why', 'how', 'can', 'could', 'would', 'should', 'will',
  'according', 'passage', 'paragraph', 'first', 'second', 'third', 'fourth',
  'final', 'last', 'opening', 'sentence', 'states', 'stated', 'mentions',
  'mentioned', 'explains', 'explained', 'notes', 'noted', 'indicates', 'shows',
  'following', 'statement', 'statements', 'true', 'false', 'best', 'most',
  'likely', 'infer', 'inferred', 'implied', 'means', 'meaning', 'closest',
  'word', 'phrase', 'refers', 'refer', 'used', 'author', 'text', 'about',
  'into', 'over', 'more', 'less', 'than', 'very', 'some', 'many', 'such',
  'they', 'them', 'their', 'there', 'been', 'being', 'only', 'also', 'each',
  'both', 'does', 'did', 'because', 'while', 'Although', 'although', 'however'
]);

function tokenizeWords(str) {
  if (!str) return [];
  return String(str)
    .toLowerCase()
    .replace(/<[^>]+>/g, ' ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !STOPWORDS.has(w));
}

function stemWord(w) {
  return w.replace(/(?:ing|ed|es|s|ly|tion|ment)$/i, '');
}

/**
 * Highlights the exact sentence(s) in a Reading Comprehension passage
 * that provide the evidence for the correct answer once the user submits.
 */
export function formatPassageWithHighlight(passage, questionObj, isSubmitted = false) {
  if (!passage) return '';
  if (!isSubmitted || !questionObj) {
    return formatMathAndText(passage);
  }

  const rawPassage = String(passage);
  const paragraphs = rawPassage.split(/\n\s*\n/);

  const qText = String(questionObj.question || '');
  const expText = String(questionObj.explanation || '');
  const correctOpt = String(questionObj.options?.[questionObj.correctAnswer] || '');

  // Detect target paragraph index if mentioned in question or explanation
  let targetParaIdx = -1;
  const combinedMeta = `${qText} ${expText}`.toLowerCase();
  if (/paragraph\s*1|first\s+paragraph|opening\s+paragraph|opening\s+sentence/.test(combinedMeta)) {
    targetParaIdx = 0;
  } else if (/paragraph\s*2|second\s+paragraph/.test(combinedMeta)) {
    targetParaIdx = 1;
  } else if (/paragraph\s*3|third\s+paragraph/.test(combinedMeta)) {
    targetParaIdx = 2;
  } else if (/paragraph\s*4|fourth\s+paragraph/.test(combinedMeta)) {
    targetParaIdx = 3;
  } else if (/final\s+paragraph|last\s+paragraph/.test(combinedMeta)) {
    targetParaIdx = paragraphs.length - 1;
  }

  // Detect if question asks about a specific quoted or bolded word
  let quotedTarget = null;
  const quoteMatch = qText.match(/["“'‘]([^"”'’]{2,25})["”'’]/);
  if (quoteMatch) {
    quotedTarget = quoteMatch[1].trim().toLowerCase();
  }

  const optWords = tokenizeWords(correctOpt);
  const expWords = tokenizeWords(expText);
  const qWords = tokenizeWords(qText);

  const optStems = new Set(optWords.map(stemWord));
  const expStems = new Set(expWords.map(stemWord));
  const qStems = new Set(qWords.map(stemWord));

  // Build bigrams from correct option and explanation for exact phrase matching
  const makeBigrams = (words) => {
    const bg = [];
    for (let i = 0; i < words.length - 1; i++) {
      bg.push(`${stemWord(words[i])} ${stemWord(words[i + 1])}`);
    }
    return bg;
  };
  const optBigrams = makeBigrams(optWords);
  const expBigrams = makeBigrams(expWords);

  // Split each paragraph into sentences and score each sentence
  const allSentences = [];
  paragraphs.forEach((para, pIdx) => {
    const sentences = para.match(/[^.!?]+[.!?]+["'”)]*|\s*[^.!?]+$/g) || [para];
    sentences.forEach((sent, sIdx) => {
      const sWords = tokenizeWords(sent);
      const sStems = sWords.map(stemWord);
      const sStemSet = new Set(sStems);
      const sBigrams = new Set(makeBigrams(sWords));
      const sentLower = sent.toLowerCase();

      let score = 0;

      // Paragraph hint boost
      if (targetParaIdx === pIdx) {
        score += 3.5;
      }

      // Quoted target or **bolded** word match
      if (quotedTarget && sentLower.includes(quotedTarget)) {
        score += 9.0;
        if (sent.includes(`**${quotedTarget}**`) || sent.toLowerCase().includes(`**${quotedTarget}**`)) {
          score += 5.0;
        }
      }

      // Match stems from Correct Option (highest weight)
      optStems.forEach((st) => {
        if (st.length >= 3 && sStemSet.has(st)) score += 3.2;
      });

      // Match stems from Explanation
      expStems.forEach((st) => {
        if (st.length >= 3 && sStemSet.has(st)) score += 2.4;
      });

      // Match stems from Question
      qStems.forEach((st) => {
        if (st.length >= 3 && sStemSet.has(st)) score += 1.4;
      });

      // Bigram phrase boosts
      optBigrams.forEach((bg) => {
        if (sBigrams.has(bg)) score += 5.5;
      });
      expBigrams.forEach((bg) => {
        if (sBigrams.has(bg)) score += 4.5;
      });

      // Numeric match boost (e.g. "85%", "1416", "19th")
      const numsInMeta = ( `${correctOpt} ${expText} ${qText}`.match(/\b\d+(?:%|th|st|nd|rd)?\b/g) || [] );
      numsInMeta.forEach((num) => {
        if (num !== '1' && num !== '2' && num !== '3' && sentLower.includes(num.toLowerCase())) {
          score += 4.0;
        }
      });

      allSentences.push({ pIdx, sIdx, text: sent, score });
    });
  });

  // Find best sentence
  let best = allSentences[0];
  for (const item of allSentences) {
    if (item.score > best.score) {
      best = item;
    }
  }

  // Reconstruct passage with <mark class="rc-evidence-highlight"> on the winning sentence
  const highlightedParagraphs = paragraphs.map((para, pIdx) => {
    const sentences = para.match(/[^.!?]+[.!?]+["'”)]*|\s*[^.!?]+$/g) || [para];
    return sentences
      .map((sent, sIdx) => {
        if (best && best.pIdx === pIdx && best.sIdx === sIdx) {
          return `<mark class="rc-evidence-highlight"><span class="rc-evidence-badge">📍 Answer Source</span>${sent.trim()}</mark> `;
        }
        return sent;
      })
      .join('');
  });

  return formatMathAndText(highlightedParagraphs.join('\n\n'));
}
