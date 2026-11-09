(() => {
  const $ = (id) => document.getElementById(id);
  // Робоча копія оцінок: користувач може змінювати бали, а кнопка «Скинути» повертає вихідні значення.
  const tools = EVALUATION.tools.map((tool) => ({ ...tool, scores: [...tool.scores] }));

  const total = (tool) => tool.scores.reduce((sum, s) => sum + s, 0);
  const average = (tool) => total(tool) / tool.scores.length;
  const formatAverage = (value) => value.toFixed(1).replace('.', ',');

  // Українська форма слова залежить від останніх цифр: 1 бал, 2–4 бали, 5–20 балів, 21 бал, 64 бали.
  function pointsWord(n) {
    const lastTwo = n % 100;
    const last = n % 10;
    if (lastTwo >= 11 && lastTwo <= 14) return 'балів';
    if (last === 1) return 'бал';
    if (last >= 2 && last <= 4) return 'бали';
    return 'балів';
  }

  function cell(tag, text, className) {
    const el = document.createElement(tag);
    if (text !== undefined) el.textContent = text;
    if (className) el.className = className;
    return el;
  }

  function renderScale() {
    const body = $('scale-body');
    for (const level of EVALUATION.scale) {
      const tr = document.createElement('tr');
      tr.append(cell('td', level.range), cell('td', level.name), cell('td', level.description));
      body.appendChild(tr);
    }
  }

  function renderHeader() {
    const head = $('scores-head');
    head.append(cell('th', '№'), cell('th', 'Критерій'));
    for (const tool of tools) {
      const th = cell('th');
      th.append(cell('span', tool.name, 'tool-name'), cell('span', tool.note, 'tool-note'));
      th.style.borderTop = `4px solid ${tool.color}`;
      head.appendChild(th);
    }
  }

  function renderScores() {
    const body = $('scores-body');
    body.innerHTML = '';
    EVALUATION.criteria.forEach((criterion, c) => {
      const tr = document.createElement('tr');
      tr.append(cell('td', c + 1), cell('td', criterion));
      tools.forEach((tool) => {
        const td = cell('td', undefined, 'score');
        const input = document.createElement('input');
        input.type = 'number';
        input.min = 1;
        input.max = 10;
        input.value = tool.scores[c];
        input.title = tool.reasons[c];
        input.addEventListener('change', () => {
          const value = Math.round(Number(input.value));
          tool.scores[c] = Math.min(10, Math.max(1, Number.isFinite(value) ? value : tool.scores[c]));
          input.value = tool.scores[c];
          update();
        });
        td.append(input, cell('div', tool.reasons[c], 'reason'));
        tr.appendChild(td);
      });
      body.appendChild(tr);
    });
  }

  function renderTotals() {
    const foot = $('scores-foot');
    foot.innerHTML = '';
    const max = EVALUATION.criteria.length * 10;
    const best = Math.max(...tools.map(total));
    const rows = [
      ['Сума балів (з ' + max + ')', (tool) => String(total(tool))],
      ['Середній бал', (tool) => formatAverage(average(tool))],
    ];
    for (const [label, value] of rows) {
      const tr = document.createElement('tr');
      tr.append(cell('td', ''), cell('td', label));
      tools.forEach((tool) => tr.appendChild(cell('td', value(tool), total(tool) === best ? 'best' : '')));
      foot.appendChild(tr);
    }
  }

  function renderRanking() {
    const list = $('ranking');
    list.innerHTML = '';
    [...tools]
      .sort((a, b) => total(b) - total(a))
      .forEach((tool) => {
        const li = document.createElement('li');
        li.textContent = `${tool.name} (${tool.note}) — ${total(tool)} ${pointsWord(total(tool))}, середній бал ${formatAverage(average(tool))}`;
        list.appendChild(li);
      });
  }

  function renderLegend() {
    const legend = $('legend');
    for (const tool of tools) {
      const span = cell('span');
      const swatch = cell('i', undefined, 'swatch');
      swatch.style.background = tool.color;
      span.append(swatch, document.createTextNode(tool.name));
      legend.appendChild(span);
    }
  }

  function renderConclusions() {
    const container = $('conclusions');
    for (const tool of EVALUATION.tools) {
      const block = cell('div', undefined, 'conclusion');
      block.style.borderLeftColor = tool.color;
      block.append(cell('h3', `${tool.name} (${tool.note})`), cell('p', tool.conclusion));
      container.appendChild(block);
    }
    const overall = cell('div', undefined, 'conclusion overall');
    overall.append(cell('h3', 'Загальний висновок'), cell('p', EVALUATION.overallConclusion));
    container.appendChild(overall);
  }

  function update() {
    renderTotals();
    renderRanking();
    ScoreChart.draw($('chart'), EVALUATION.criteria, tools);
  }

  $('reset').addEventListener('click', () => {
    EVALUATION.tools.forEach((original, i) => {
      tools[i].scores = [...original.scores];
    });
    renderScores();
    update();
  });

  renderScale();
  renderHeader();
  renderScores();
  renderLegend();
  renderConclusions();
  update();
})();
