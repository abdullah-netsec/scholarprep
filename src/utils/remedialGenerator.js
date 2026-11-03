/**
 * Generates a number-varied clone of a missed GAT question for Remedial Mode.
 * Keeps the exact question structure, wording, and diagram/chart, while changing
 * the numbers in the stem (and SVG/table), recomputing the 4 options, correctAnswer,
 * and explanation.
 */

function formatNumWithCommas(n, hadCommas) {
  if (!Number.isFinite(n)) return String(n);
  const rounded = Math.abs(n - Math.round(n)) < 1e-6 ? Math.round(n) : Number(n.toFixed(2));
  if (hadCommas && Math.abs(rounded) >= 1000 && Number.isInteger(rounded)) {
    return rounded.toLocaleString('en-US');
  }
  return String(rounded);
}

function parseNumericOption(optStr) {
  if (typeof optStr !== 'string') return null;
  const s = optStr.trim();
  const m = s.match(/^([^0-9+-]*?)([+-]?\d(?:\d|,(?=\d))*(?:\.\d+)?)\s*([^0-9]*)$/);
  if (!m) return null;
  const prefix = m[1];
  const rawNum = m[2];
  const suffix = m[3];
  const hadCommas = rawNum.includes(',');
  const value = parseFloat(rawNum.replace(/,/g, ''));
  if (!Number.isFinite(value)) return null;
  return { prefix, rawNum, value, suffix, hadCommas };
}

function formatNumericOption(parsed, newVal) {
  const numStr = formatNumWithCommas(newVal, parsed.hadCommas);
  return `${parsed.prefix}${numStr}${parsed.suffix}`;
}

function shuffleOptionsWithCorrect(options, correctIdx, seed = 1) {
  const items = options.map((opt, idx) => ({ opt, isCorrect: idx === correctIdx }));
  const shift = (seed % 3) + 1;
  const rotated = items.map((_, i) => items[(i + shift) % items.length]);
  const newCorrectIdx = rotated.findIndex(x => x.isCorrect);
  return {
    options: rotated.map(x => x.opt),
    correctAnswer: newCorrectIdx >= 0 ? newCorrectIdx : 0,
  };
}

/**
 * Single-pass simultaneous replacement of standalone numbers in HTML text nodes
 * (never touches HTML/SVG tag attributes, coordinates, or chained replacements).
 */
function replaceNumbersInHtmlSinglePass(html, replacementMap) {
  if (!html || !replacementMap || replacementMap.size === 0) return html;
  const parts = html.split(/(<[^>]+>)/g);
  // Match any number token (with internal commas/decimals) and optional trailing % or °
  const numTokenRegex = /\b(\d(?:\d|,(?=\d))*(?:\.\d+)?)(\s*(?:%|°))?/g;

  for (let i = 0; i < parts.length; i++) {
    // Only modify text nodes (even indices), never HTML/SVG tags
    if (i % 2 === 0 && parts[i]) {
      // Skip if preceded by <sup> or <sub> UNLESS it is part of a fraction (&frasl;)
      const prevTag = i > 0 ? parts[i - 1] : '';
      if (/^<(?:sup|sub)\b/i.test(prevTag)) {
        const nextText = i + 2 < parts.length ? parts[i + 2] : '';
        const prevText = i >= 2 ? parts[i - 2] : '';
        const isFractionPart = nextText.includes('&frasl;') || prevText.includes('&frasl;') || nextText.includes('⁄') || prevText.includes('⁄');
        if (!isFractionPart) continue;
      }

      parts[i] = parts[i].replace(numTokenRegex, (fullMatch, numStr, unitSuffix) => {
        const cleanUnit = (unitSuffix || '').trim();
        const keyWithUnit = cleanUnit ? `${numStr}${cleanUnit}` : numStr;
        if (replacementMap.has(keyWithUnit)) {
          return replacementMap.get(keyWithUnit);
        }
        if (!cleanUnit && replacementMap.has(numStr)) {
          return replacementMap.get(numStr);
        }
        return fullMatch;
      });
    }
  }
  return parts.join('');
}

function buildDistinctOptions(newCorrectVal, oldParsedOptions, oldCorrectIdx, minVal = 1) {
  const correctParsed = oldParsedOptions[oldCorrectIdx];
  const oldCorrectVal = correctParsed.value;
  const isInt = Number.isInteger(newCorrectVal) && oldParsedOptions.every(p => Number.isInteger(p.value));

  const newValues = [];
  const used = new Set();

  oldParsedOptions.forEach((p, idx) => {
    let v;
    if (idx === oldCorrectIdx) {
      v = newCorrectVal;
    } else if (oldCorrectVal !== 0) {
      const ratio = newCorrectVal / oldCorrectVal;
      const diff = p.value - oldCorrectVal;
      if (Math.abs(ratio - Math.round(ratio)) < 1e-6 && ratio > 0) {
        v = p.value * ratio;
      } else {
        v = newCorrectVal + diff;
      }
    } else {
      v = p.value + (newCorrectVal - oldCorrectVal);
    }
    if (isInt) v = Math.round(v);
    else v = Number(v.toFixed(2));
    if (v <= 0 && oldCorrectVal > 0 && minVal > 0) {
      v = Math.max(minVal, isInt ? Math.abs(v) + 2 : Number((Math.abs(v) + 1).toFixed(2)));
    }
    newValues.push(v);
  });

  const step = isInt ? Math.max(1, Math.round(Math.abs(newCorrectVal) * 0.1) || 2) : 0.5;
  const finalOptions = newValues.map((v, idx) => {
    let candidate = v;
    let attempts = 0;
    while (used.has(candidate) && attempts < 20) {
      attempts++;
      candidate = isInt ? candidate + step * attempts : Number((candidate + step * attempts).toFixed(2));
    }
    used.add(candidate);
    return formatNumericOption(oldParsedOptions[idx], candidate);
  });

  return finalOptions;
}

export function generateNumberVariantQuestion(question, variantIndex = 1) {
  if (!question) return question;

  const clone = {
    ...question,
    id: `${question.id}_rem_${variantIndex}`,
    originalId: question.id,
    isRemedialVariant: true,
    options: Array.isArray(question.options) ? [...question.options] : [],
  };

  const stemAndFig = question.question || '';
  const figSplitIdx = stemAndFig.search(/<div|<svg|<table/i);
  const stemPart = figSplitIdx >= 0 ? stemAndFig.slice(0, figSplitIdx) : stemAndFig;
  const figPart = figSplitIdx >= 0 ? stemAndFig.slice(figSplitIdx) : '';

  const parsedOpts = clone.options.map(parseNumericOption);
  const allOptsNumeric = parsedOpts.length === 4 && parsedOpts.every(Boolean);
  const correctIdx = typeof question.correctAnswer === 'number' ? question.correctAnswer : 0;

  // ==========================================================================
  // CASE 1: Angle / Geometry questions with degrees (complement, supplement, triangle angles)
  // ==========================================================================
  if (allOptsNumeric && parsedOpts[correctIdx].value > 0 && parsedOpts[correctIdx].value < 360) {
    const cVal = parsedOpts[correctIdx].value;
    const degMatches = [...stemAndFig.replace(/<[^>]+>/g, ' ').matchAll(/\b(\d{1,3})\s*°/g)];
    const uniqueDegs = [...new Set(degMatches.map(m => Number(m[1])).filter(n => n > 0 && n < 360 && n !== 90 && n !== 180 && n !== 360))];

    // 1A. Isosceles triangle vertex angle -> base angle = (180 - A)/2
    if (/isosceles/i.test(stemPart) && uniqueDegs.length === 1) {
      const oldA = uniqueDegs[0];
      if (Math.abs(cVal - (180 - oldA) / 2) < 1e-4) {
        const candidates = [40, 50, 70, 80, 20].filter(a => a !== oldA);
        const newA = candidates[variantIndex % candidates.length];
        const newAns = (180 - newA) / 2;
        const map = new Map([
          [`${oldA}°`, `${newA}°`],
          [`${oldA}`, `${newA}`],
        ]);
        clone.question = replaceNumbersInHtmlSinglePass(stemAndFig, map);
        const newOpts = buildDistinctOptions(newAns, parsedOpts, correctIdx);
        const shuffled = shuffleOptionsWithCorrect(newOpts, correctIdx, variantIndex);
        clone.options = shuffled.options;
        clone.correctAnswer = shuffled.correctAnswer;
        clone.explanation = `In an isosceles triangle, the two base angles are equal: x = (180° − ${newA}°) ÷ 2 = ${newAns}°.`;
        return clone;
      }
    }

    // 1B. Right triangle complement: cVal + oldA === 90
    if (uniqueDegs.length === 1 && Math.abs(cVal + uniqueDegs[0] - 90) < 1e-4) {
      const oldA = uniqueDegs[0];
      const candidates = [35, 40, 25, 50, 55, 20].filter(a => a !== oldA && a !== cVal);
      const newA = candidates[variantIndex % candidates.length];
      const newAns = 90 - newA;
      const map = new Map([
        [`${oldA}°`, `${newA}°`],
        [`${oldA}`, `${newA}`],
      ]);
      clone.question = replaceNumbersInHtmlSinglePass(stemAndFig, map);
      const newOpts = buildDistinctOptions(newAns, parsedOpts, correctIdx);
      const shuffled = shuffleOptionsWithCorrect(newOpts, correctIdx, variantIndex);
      clone.options = shuffled.options;
      clone.correctAnswer = shuffled.correctAnswer;
      clone.explanation = `Since the acute angles of a right triangle sum to 90°, x = 90° − ${newA}° = ${newAns}°.`;
      return clone;
    }

    // 1C. Supplementary angle: cVal + oldA === 180
    if (uniqueDegs.length === 1 && Math.abs(cVal + uniqueDegs[0] - 180) < 1e-4) {
      const oldA = uniqueDegs[0];
      const delta = oldA <= 140 ? 15 : -20;
      const newA = oldA + delta;
      const newAns = 180 - newA;
      const map = new Map([
        [`${oldA}°`, `${newA}°`],
        [`${oldA}`, `${newA}`],
      ]);
      clone.question = replaceNumbersInHtmlSinglePass(stemAndFig, map);
      const newOpts = buildDistinctOptions(newAns, parsedOpts, correctIdx);
      const shuffled = shuffleOptionsWithCorrect(newOpts, correctIdx, variantIndex);
      clone.options = shuffled.options;
      clone.correctAnswer = shuffled.correctAnswer;
      clone.explanation = `Using the supplementary angle relationship (sum = 180°), the angle is 180° − ${newA}° = ${newAns}°.`;
      return clone;
    }

    // 1D. Exterior angle or two-angle triangle sum
    if (uniqueDegs.length === 2) {
      const [d1, d2] = uniqueDegs;
      if (Math.abs(cVal - (d2 - d1)) < 1e-4 && d2 > d1) {
        const newD1 = d1 + 5;
        const newD2 = d2 + 15;
        const newAns = newD2 - newD1;
        const map = new Map([
          [`${d1}°`, `${newD1}°`],
          [`${d2}°`, `${newD2}°`],
        ]);
        clone.question = replaceNumbersInHtmlSinglePass(stemAndFig, map);
        const newOpts = buildDistinctOptions(newAns, parsedOpts, correctIdx);
        const shuffled = shuffleOptionsWithCorrect(newOpts, correctIdx, variantIndex);
        clone.options = shuffled.options;
        clone.correctAnswer = shuffled.correctAnswer;
        clone.explanation = `By the Exterior Angle Theorem, the interior angle is ${newD2}° − ${newD1}° = ${newAns}°.`;
        return clone;
      }
      if (Math.abs(cVal - (180 - d1 - d2)) < 1e-4) {
        const newD1 = d1 + 5;
        const newD2 = d2 + 5;
        const newAns = 180 - newD1 - newD2;
        const map = new Map([
          [`${d1}°`, `${newD1}°`],
          [`${d2}°`, `${newD2}°`],
        ]);
        clone.question = replaceNumbersInHtmlSinglePass(stemAndFig, map);
        const newOpts = buildDistinctOptions(newAns, parsedOpts, correctIdx);
        const shuffled = shuffleOptionsWithCorrect(newOpts, correctIdx, variantIndex);
        clone.options = shuffled.options;
        clone.correctAnswer = shuffled.correctAnswer;
        clone.explanation = `Since the angles of a triangle sum to 180°, the unknown angle is 180° − (${newD1}° + ${newD2}°) = ${newAns}°.`;
        return clone;
      }
    }
  }

  // ==========================================================================
  // CASE 2: Median / Mode / Mean of a comma-separated list of numbers
  // ==========================================================================
  if (allOptsNumeric && /median|mean|average|range/i.test(stemPart) && !figPart) {
    const listMatch = stemPart.match(/:\s*(\d+(?:\s*,\s*\d+){3,})/);
    if (listMatch) {
      const nums = listMatch[1].split(',').map(s => Number(s.trim()));
      const offset = ((variantIndex % 3) + 1) * 4;
      const newNums = nums.map(n => n + offset);
      const oldListStr = listMatch[1];
      const newListStr = newNums.join(', ');
      const cVal = parsedOpts[correctIdx].value;
      const isRange = /range/i.test(stemPart) && !/median|mean|average/i.test(stemPart);
      const newAns = isRange ? cVal : cVal + offset;
      clone.question = stemAndFig.replace(oldListStr, newListStr);
      const newOpts = buildDistinctOptions(newAns, parsedOpts, correctIdx);
      const shuffled = shuffleOptionsWithCorrect(newOpts, correctIdx, variantIndex);
      clone.options = shuffled.options;
      clone.correctAnswer = shuffled.correctAnswer;
      clone.explanation = `With the updated dataset [${newListStr}], the answer is ${newAns}.`;
      return clone;
    }
  }

  // ==========================================================================
  // CASE 3: General Numeric Questions (4 numeric options)
  // ==========================================================================
  // Keep fraction numerators/denominators in textOnly, only strip exponent <sup>2</sup> / <sup>3</sup> not adjacent to &frasl;
  const textOnly = stemAndFig
    .replace(/<sup>\s*\d+\s*<\/sup>(?!\s*(?:&frasl;|⁄))/gi, ' ')
    .replace(/<[^>]+>/g, ' ');
  const tokenMatches = [...textOnly.matchAll(/\b(\d(?:\d|,(?=\d))*(?:\.\d+)?)(\s*(?:%|°))?/g)];

  const scalableTokens = [];
  const seenRaw = new Set();

  tokenMatches.forEach(m => {
    const raw = m[1];
    const unit = (m[2] || '').trim();
    const val = parseFloat(raw.replace(/,/g, ''));
    if (!Number.isFinite(val) || val === 0) return;
    if (unit === '%' || unit === '°') return;
    // Skip Hijri and Gregorian years
    if (Number.isInteger(val) && ((val >= 1410 && val <= 1455) || (val >= 1770 && val <= 2030))) return;
    // Skip labels like Grade 3, Level 1, Week 2, Month 6
    const ctxRegex = new RegExp(`(?:Grade|Level|Week|Month|Quarter|Sector|Year|Column|part|stage|Score|Mark)\\s+${raw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    if (ctxRegex.test(textOnly)) return;

    if (!seenRaw.has(raw)) {
      seenRaw.add(raw);
      scalableTokens.push({ raw, val, hadCommas: raw.includes(',') });
    }
  });

  if (allOptsNumeric) {
    const oldCorrectVal = parsedOpts[correctIdx].value;
    const isPercentOrDegOption = parsedOpts[correctIdx].suffix.includes('%') || parsedOpts[correctIdx].suffix.includes('°');

    if (scalableTokens.length > 0 && !isPercentOrDegOption) {
      const isArea = /\barea\b|cm\s*2|m\s*2|<sup>2<\/sup>/i.test(stemPart) && !/area is \d/i.test(stemPart);
      const scaleFactor = 2;
      const ansMultiplier = isArea ? scaleFactor * scaleFactor : scaleFactor;

      const repMap = new Map();
      scalableTokens.forEach(t => {
        const newVal = t.val * scaleFactor;
        repMap.set(t.raw, formatNumWithCommas(newVal, t.hadCommas));
      });
      const newAns = oldCorrectVal * ansMultiplier;

      clone.question = replaceNumbersInHtmlSinglePass(stemAndFig, repMap);
      const newOpts = buildDistinctOptions(newAns, parsedOpts, correctIdx);
      const shuffled = shuffleOptionsWithCorrect(newOpts, correctIdx, variantIndex);
      clone.options = shuffled.options;
      clone.correctAnswer = shuffled.correctAnswer;

      const expRepMap = new Map(repMap);
      const oldAnsStr = parsedOpts[correctIdx].rawNum;
      if (!expRepMap.has(oldAnsStr)) {
        expRepMap.set(oldAnsStr, formatNumWithCommas(newAns, parsedOpts[correctIdx].hadCommas));
      }
      const replacedExp = replaceNumbersInHtmlSinglePass(question.explanation || '', expRepMap);
      clone.explanation = `${replacedExp} (With the updated values, the answer is ${clone.options[clone.correctAnswer]}.)`;
      return clone;
    }
  }

  // ==========================================================================
  // CASE 4: Comparison Questions, Percentage/Ratio Questions, or Verbal/Text Options
  // ==========================================================================
  const repMap = new Map();
  scalableTokens.forEach(t => {
    if (t.val <= 1) return;
    const newVal = t.val * 2;
    repMap.set(t.raw, formatNumWithCommas(newVal, t.hadCommas));
  });

  if (repMap.size > 0) {
    clone.question = replaceNumbersInHtmlSinglePass(stemAndFig, repMap);
    clone.explanation = replaceNumbersInHtmlSinglePass(question.explanation || '', repMap);
  }

  const isComparisonOpts =
    clone.options.length === 4 &&
    clone.options[0].trim().toUpperCase().startsWith('A') &&
    clone.options[1].trim().toUpperCase().startsWith('B');

  if (!isComparisonOpts && clone.options.length === 4) {
    const updatedOptions = clone.options.map(opt => replaceNumbersInHtmlSinglePass(opt, repMap));
    const shuffled = shuffleOptionsWithCorrect(updatedOptions, correctIdx, variantIndex);
    clone.options = shuffled.options;
    clone.correctAnswer = shuffled.correctAnswer;
  }

  return clone;
}
