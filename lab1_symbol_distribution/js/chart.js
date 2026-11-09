const DistributionChart = (() => {
  const COLORS = {
    bar: '#7a9cd8',
    min: '#2e9e5b',
    max: '#d9534f',
    axis: '#5b6270',
    grid: '#e3e6ec',
    text: '#2b2f36',
  };
  const MIN_SLOT = 16;
  const MAX_SLOT = 28;
  const HEIGHT = 340;
  const MARGIN = { top: 20, right: 20, bottom: 46, left: 62 };

  const MIN_BAR_HEIGHT = 3;

  // Округлює верхню межу осі до «красивого» значення (1, 1.5, 2, 2.5, 3, 4, 5, 6, 8 · 10^n),
  // щоб поділки були читабельними і над найвищим стовпцем не лишалося багато порожнього місця.
  function niceMax(value) {
    const exponent = Math.floor(Math.log10(value));
    const fraction = value / 10 ** exponent;
    const nice = [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10].find((n) => fraction <= n);
    return nice * 10 ** exponent;
  }

  // Діаграма займає доступну ширину. Якщо символів так багато, що стовпець став би вужчим за MIN_SLOT,
  // ширина фіксується і з'являється горизонтальна прокрутка.
  function draw(canvas, rows, result, availableWidth) {
    const fitSlot = Math.floor((availableWidth - MARGIN.left - MARGIN.right) / Math.max(rows.length, 1));
    const slot = Math.min(MAX_SLOT, Math.max(MIN_SLOT, fitSlot));
    const BAR_GAP = Math.max(3, Math.round(slot * 0.25));
    const BAR_WIDTH = slot - BAR_GAP;
    const plotWidth = Math.max(rows.length * slot, 300);
    const width = MARGIN.left + plotWidth + MARGIN.right;
    const plotHeight = HEIGHT - MARGIN.top - MARGIN.bottom;

    // Полотно масштабується під щільність пікселів екрана, інакше на HiDPI-моніторах текст розмитий.
    const ratio = window.devicePixelRatio || 1;
    canvas.width = width * ratio;
    canvas.height = HEIGHT * ratio;
    canvas.style.width = width + 'px';
    canvas.style.height = HEIGHT + 'px';
    const ctx = canvas.getContext('2d');
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.clearRect(0, 0, width, HEIGHT);
    ctx.font = '12px "Segoe UI", Arial, sans-serif';

    if (rows.length === 0) return;

    const yMax = niceMax(result.max.p);
    const y = (p) => MARGIN.top + plotHeight * (1 - p / yMax);

    const ticks = 5;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (let i = 0; i <= ticks; i++) {
      const value = (yMax / ticks) * i;
      ctx.strokeStyle = COLORS.grid;
      ctx.beginPath();
      ctx.moveTo(MARGIN.left, y(value));
      ctx.lineTo(MARGIN.left + plotWidth, y(value));
      ctx.stroke();
      ctx.fillStyle = COLORS.axis;
      ctx.fillText(value.toFixed(3), MARGIN.left - 8, y(value));
    }

    ctx.save();
    ctx.translate(14, MARGIN.top + plotHeight / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.fillText('Pn', 0, 0);
    ctx.restore();

    const minSet = new Set(result.min.symbols);
    const maxSet = new Set(result.max.symbols);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    rows.forEach((row, i) => {
      const x = MARGIN.left + i * (BAR_WIDTH + BAR_GAP) + BAR_GAP / 2;
      const base = MARGIN.top + plotHeight;
      // Рідкісні символи дають стовпці висотою менше пікселя. Мінімальна висота лишає їх видимими.
      const top = Math.min(y(row.p), base - MIN_BAR_HEIGHT);
      const color = maxSet.has(row.symbol) ? COLORS.max : minSet.has(row.symbol) ? COLORS.min : null;
      ctx.fillStyle = color || COLORS.bar;
      ctx.fillRect(x, top, BAR_WIDTH, base - top);
      ctx.fillStyle = color || COLORS.text;
      ctx.font = color ? 'bold 12px "Segoe UI", Arial, sans-serif' : '12px "Segoe UI", Arial, sans-serif';
      ctx.fillText(SymbolAnalysis.chartLabel(row.symbol), x + BAR_WIDTH / 2, base + 8);
    });

    ctx.strokeStyle = COLORS.axis;
    ctx.beginPath();
    ctx.moveTo(MARGIN.left, MARGIN.top);
    ctx.lineTo(MARGIN.left, MARGIN.top + plotHeight);
    ctx.lineTo(MARGIN.left + plotWidth, MARGIN.top + plotHeight);
    ctx.stroke();

    ctx.fillStyle = COLORS.axis;
    ctx.font = '12px "Segoe UI", Arial, sans-serif';
    ctx.fillText('Символ', MARGIN.left + plotWidth / 2, HEIGHT - 16);
  }

  return { draw, COLORS };
})();
