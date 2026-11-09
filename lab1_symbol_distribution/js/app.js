(() => {
  const $ = (id) => document.getElementById(id);
  const els = {
    text: $('text'),
    file: $('file'),
    url: $('url'),
    loadUrl: $('load-url'),
    sample: $('sample'),
    clear: $('clear'),
    includeSpaces: $('include-spaces'),
    includeLineBreaks: $('include-line-breaks'),
    analyze: $('analyze'),
    status: $('status'),
    results: $('results'),
    total: $('total'),
    unique: $('unique'),
    minInfo: $('min-info'),
    maxInfo: $('max-info'),
    sort: $('sort'),
    chart: $('chart'),
    tableBody: $('table-body'),
    pSum: $('p-sum'),
    exportCsv: $('export-csv'),
  };

  let lastResult = null;

  function setStatus(message, isError = false) {
    els.status.textContent = message;
    els.status.classList.toggle('error', isError);
  }

  function options() {
    return {
      includeSpaces: els.includeSpaces.checked,
      includeLineBreaks: els.includeLineBreaks.checked,
    };
  }

  function formatP(p) {
    return p.toFixed(4);
  }

  function describeExtreme(ext) {
    const symbols = ext.symbols.map((s) => '«' + SymbolAnalysis.displaySymbol(s) + '»').join(', ');
    return `${formatP(ext.p)} (k = ${ext.k}): ${symbols}`;
  }

  function renderTable(rows, result) {
    const minSet = new Set(result.min.symbols);
    const maxSet = new Set(result.max.symbols);
    els.tableBody.innerHTML = '';
    rows.forEach((row, i) => {
      const tr = document.createElement('tr');
      if (maxSet.has(row.symbol)) tr.className = 'is-max';
      else if (minSet.has(row.symbol)) tr.className = 'is-min';
      for (const value of [i + 1, SymbolAnalysis.displaySymbol(row.symbol), row.k, formatP(row.p)]) {
        const td = document.createElement('td');
        td.textContent = value;
        tr.appendChild(td);
      }
      els.tableBody.appendChild(tr);
    });
    const sum = rows.reduce((acc, r) => acc + r.p, 0);
    els.pSum.textContent = formatP(sum);
  }

  function render() {
    if (!lastResult) return;
    const rows = SymbolAnalysis.sortRows(lastResult.rows, els.sort.value);
    renderTable(rows, lastResult);
    DistributionChart.draw(els.chart, rows, lastResult, els.chart.parentElement.clientWidth);
  }

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(render, 150);
  });

  function runAnalysis() {
    const text = els.text.value;
    const result = SymbolAnalysis.analyze(text, options());
    if (result.total === 0) {
      lastResult = null;
      els.results.hidden = true;
      setStatus('Текст порожній або містить лише виключені символи.', true);
      return;
    }
    lastResult = result;
    els.total.textContent = result.total;
    els.unique.textContent = result.rows.length;
    els.minInfo.textContent = describeExtreme(result.min);
    els.maxInfo.textContent = describeExtreme(result.max);
    els.results.hidden = false;
    setStatus('Аналіз виконано.');
    render();
  }

  function loadText(text, source) {
    els.text.value = SymbolAnalysis.normalizeText(text);
    setStatus(`Текст завантажено: ${source}.`);
    runAnalysis();
  }

  els.file.addEventListener('change', () => {
    const file = els.file.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => loadText(reader.result, file.name);
    reader.onerror = () => setStatus('Не вдалося прочитати файл.', true);
    reader.readAsText(file, 'UTF-8');
    els.file.value = '';
  });

  els.loadUrl.addEventListener('click', async () => {
    const url = els.url.value.trim();
    if (!url) {
      setStatus('Вкажіть посилання на текстовий документ.', true);
      return;
    }
    setStatus('Завантаження…');
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`сервер повернув код ${response.status}`);
      let text = await response.text();
      // Для HTML-сторінки аналізуємо видимий текст, а не розмітку з тегами.
      if ((response.headers.get('content-type') || '').includes('text/html')) {
        text = new DOMParser().parseFromString(text, 'text/html').body.innerText;
      }
      loadText(text, url);
    } catch (error) {
      // fetch кидає TypeError, коли браузер блокує відповідь іншого сайту (CORS) або немає мережі.
      const reason = error instanceof TypeError
        ? 'сайт не дозволяє читати свої дані з іншої сторінки (CORS) або немає з\'єднання. Спробуйте пряме посилання на .txt-файл або завантажте файл з диска'
        : error.message;
      setStatus(`Не вдалося завантажити: ${reason}.`, true);
    }
  });

  els.sample.addEventListener('click', () => loadText(SAMPLE_TEXT, 'приклад'));
  if (location.hash === '#sample') loadText(SAMPLE_TEXT, 'приклад');
  els.clear.addEventListener('click', () => {
    els.text.value = '';
    lastResult = null;
    els.results.hidden = true;
    setStatus('');
  });
  els.analyze.addEventListener('click', runAnalysis);
  els.includeSpaces.addEventListener('change', () => lastResult && runAnalysis());
  els.includeLineBreaks.addEventListener('change', () => lastResult && runAnalysis());
  els.sort.addEventListener('change', render);

  els.exportCsv.addEventListener('click', () => {
    if (!lastResult) return;
    const csv = SymbolAnalysis.toCsv(SymbolAnalysis.sortRows(lastResult.rows, els.sort.value));
    // BOM потрібен, щоб Excel відкрив CSV у UTF-8 і показав кирилицю правильно.
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'symbol_distribution.csv';
    link.click();
    URL.revokeObjectURL(link.href);
  });
})();
