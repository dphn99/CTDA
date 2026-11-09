const ScoreChart = (() => {
  const HEIGHT = 400;
  const MARGIN = { top: 16, right: 16, bottom: 92, left: 44 };
  const BAR_WIDTH = 22;
  const GROUP_GAP = 40;
  const MAX_SCORE = 10;

  // Довгі назви критеріїв переносимо по словах, щоб підписи під групами не накладалися.
  function wrap(ctx, text, maxWidth) {
    const lines = [];
    let line = '';
    for (const word of text.split(' ')) {
      const candidate = line ? line + ' ' + word : word;
      if (ctx.measureText(candidate).width > maxWidth && line) {
        lines.push(line);
        line = word;
      } else {
        line = candidate;
      }
    }
    if (line) lines.push(line);
    return lines;
  }

  function draw(canvas, criteria, tools) {
    const groupWidth = tools.length * BAR_WIDTH;
    const plotWidth = criteria.length * (groupWidth + GROUP_GAP);
    const width = MARGIN.left + plotWidth + MARGIN.right;
    const plotHeight = HEIGHT - MARGIN.top - MARGIN.bottom;
    const base = MARGIN.top + plotHeight;

    const ratio = window.devicePixelRatio || 1;
    canvas.width = width * ratio;
    canvas.height = HEIGHT * ratio;
    canvas.style.width = width + 'px';
    canvas.style.height = HEIGHT + 'px';
    const ctx = canvas.getContext('2d');
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.clearRect(0, 0, width, HEIGHT);
    ctx.font = '12px "Segoe UI", Arial, sans-serif';

    const y = (score) => MARGIN.top + plotHeight * (1 - score / MAX_SCORE);

    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (let s = 0; s <= MAX_SCORE; s += 2) {
      ctx.strokeStyle = '#e3e6ec';
      ctx.beginPath();
      ctx.moveTo(MARGIN.left, y(s));
      ctx.lineTo(MARGIN.left + plotWidth, y(s));
      ctx.stroke();
      ctx.fillStyle = '#5b6270';
      ctx.fillText(String(s), MARGIN.left - 8, y(s));
    }

    criteria.forEach((criterion, c) => {
      const groupX = MARGIN.left + c * (groupWidth + GROUP_GAP) + GROUP_GAP / 2;
      tools.forEach((tool, t) => {
        const score = tool.scores[c];
        const x = groupX + t * BAR_WIDTH;
        ctx.fillStyle = tool.color;
        ctx.fillRect(x + 1, y(score), BAR_WIDTH - 2, base - y(score));
        ctx.fillStyle = '#2b2f36';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText(String(score), x + BAR_WIDTH / 2, y(score) - 2);
      });

      ctx.fillStyle = '#2b2f36';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      const center = groupX + groupWidth / 2;
      ctx.fillText(String(c + 1), center, base + 6);
      ctx.fillStyle = '#6b7280';
      ctx.font = '11px "Segoe UI", Arial, sans-serif';
      wrap(ctx, criterion, groupWidth + GROUP_GAP - 10).slice(0, 5).forEach((line, i) => {
        ctx.fillText(line, center, base + 22 + i * 13);
      });
      ctx.font = '12px "Segoe UI", Arial, sans-serif';
    });

    ctx.strokeStyle = '#5b6270';
    ctx.beginPath();
    ctx.moveTo(MARGIN.left, MARGIN.top);
    ctx.lineTo(MARGIN.left, base);
    ctx.lineTo(MARGIN.left + plotWidth, base);
    ctx.stroke();
  }

  return { draw };
})();
