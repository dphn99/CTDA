const SymbolAnalysis = (() => {
  const SPECIAL_NAMES = {
    ' ': '␣ (пробіл)',
    '\n': '↵ (новий рядок)',
    '\t': '⇥ (табуляція)',
    ' ': '⍽ (нерозривний пробіл)',
  };

  // Файли з Windows містять \r\n. Без нормалізації \r рахувався б як окремий невидимий символ.
  function normalizeText(text) {
    return text.replace(/\r\n?/g, '\n');
  }

  function countSymbols(text, { includeSpaces, includeLineBreaks }) {
    const counts = new Map();
    // for...of проходить рядок кодовими точками, тому символи поза BMP (емодзі тощо) не розпадаються на половинки.
    for (const ch of normalizeText(text)) {
      if (ch === '\n' && !includeLineBreaks) continue;
      if (ch === ' ' && !includeSpaces) continue;
      counts.set(ch, (counts.get(ch) || 0) + 1);
    }
    return counts;
  }

  function extreme(rows, total, pick) {
    const k = pick(...rows.map((r) => r.k));
    return { k, p: k / total, symbols: rows.filter((r) => r.k === k).map((r) => r.symbol) };
  }

  function analyze(text, options) {
    const counts = countSymbols(text, options);
    let total = 0;
    for (const k of counts.values()) total += k;

    const rows = [...counts].map(([symbol, k]) => ({ symbol, k, p: k / total }));
    if (rows.length === 0) {
      return { total: 0, rows, min: null, max: null };
    }
    // Однакову найменшу (найбільшу) частоту можуть мати кілька символів, тому екстремум — це група символів.
    return { total, rows, min: extreme(rows, total, Math.min), max: extreme(rows, total, Math.max) };
  }

  const collator = new Intl.Collator('uk', { caseFirst: 'upper' });

  function sortRows(rows, mode) {
    const copy = [...rows];
    if (mode === 'symbol') {
      copy.sort((a, b) => collator.compare(a.symbol, b.symbol) || (a.symbol < b.symbol ? -1 : 1));
    } else {
      copy.sort((a, b) => b.k - a.k || collator.compare(a.symbol, b.symbol));
    }
    return copy;
  }

  function displaySymbol(ch) {
    if (SPECIAL_NAMES[ch]) return SPECIAL_NAMES[ch];
    const code = ch.codePointAt(0);
    if (code < 32 || (code >= 127 && code < 160)) {
      return 'U+' + code.toString(16).toUpperCase().padStart(4, '0');
    }
    return ch;
  }

  function chartLabel(ch) {
    return displaySymbol(ch).split(' ')[0];
  }

  function toCsv(rows) {
    const escape = (value) => '"' + String(value).replace(/"/g, '""') + '"';
    const lines = ['Символ;ki;Pn'];
    for (const r of rows) {
      lines.push([escape(displaySymbol(r.symbol)), r.k, r.p.toFixed(6).replace('.', ',')].join(';'));
    }
    return lines.join('\r\n');
  }

  return { normalizeText, analyze, sortRows, displaySymbol, chartLabel, toCsv };
})();
