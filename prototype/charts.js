/* Minimal SVG chart kit: stacked columns + multi-line, both with hover tooltips.
   Colors come from CSS custom properties so light/dark swap in one place. */
window.Charts = (() => {
  const tip = () => document.getElementById("tip");
  function showTip(e, html) {
    const t = tip(); t.innerHTML = html; t.classList.add("on");
    const pad = 14, w = t.offsetWidth, h = t.offsetHeight;
    let x = e.clientX + pad, y = e.clientY + pad;
    if (x + w > innerWidth - 8) x = e.clientX - w - pad;
    if (y + h > innerHeight - 8) y = e.clientY - h - pad;
    t.style.left = x + "px"; t.style.top = y + "px";
  }
  function hideTip() { tip().classList.remove("on"); }
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  /* Axis scale with 1-2-5 steps so tick labels are always round numbers. */
  function scale(v) {
    v = Math.max(v, 1);
    const raw = v / 4, p = Math.pow(10, Math.floor(Math.log10(raw))), n = raw / p;
    const step = (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p;
    const k = Math.ceil(v / step);
    return { max: step * k, step, k };
  }
  function topRounded(x, y, w, h, r) {
    r = Math.min(r, w / 2, h);
    return `M${x},${y + h}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h}Z`;
  }
  function ticksFor(n, want) { const step = Math.max(1, Math.ceil(n / want)); const out = []; for (let i = 0; i < n; i += step) out.push(i); return out; }

  /* rows: [{label, values:{k:n}}]; series: [{key,name,color}] (bottom → top) */
  function stacked(el, rows, series, o = {}) {
    const W = o.width || 760, H = o.height || 240, pl = 40, pr = 8, pt = 8, pb = 26;
    const totals = rows.map(r => series.reduce((s, k) => s + r.values[k.key], 0));
    const sc = scale(Math.max(...totals) * 1.05), max = sc.max;
    const iw = W - pl - pr, ih = H - pt - pb, slot = iw / rows.length, bw = Math.max(2, Math.min(28, slot - Math.max(2, slot * 0.28)));
    let s = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(o.aria || "")}">`;
    for (let g = 0; g <= sc.k; g++) {
      const v = sc.step * g, y = pt + ih - (ih * v) / max;
      s += `<line x1="${pl}" x2="${W - pr}" y1="${y}" y2="${y}" stroke="var(${g === 0 ? "--axis" : "--grid"})" stroke-width="1"/>`;
      s += `<text x="${pl - 8}" y="${y + 4}" text-anchor="end" class="num">${o.fmtY ? o.fmtY(v) : v}</text>`;
    }
    rows.forEach((r, i) => {
      const x = pl + i * slot + (slot - bw) / 2;
      let y = pt + ih;
      const visible = series.filter(k => r.values[k.key] > 0);
      series.forEach(k => {
        const v = r.values[k.key]; if (!v) return;
        const h = (ih * v) / max, gap = visible[visible.length - 1] === k ? 0 : 2;
        y -= h;
        const isTop = visible[visible.length - 1] === k;
        s += isTop ? `<path d="${topRounded(x, y, bw, Math.max(0, h), 3)}" fill="var(${k.color})"/>`
                   : `<rect x="${x}" y="${y + gap}" width="${bw}" height="${Math.max(0, h - gap)}" fill="var(${k.color})"/>`;
      });
      s += `<rect class="hit" data-i="${i}" x="${pl + i * slot}" y="${pt}" width="${slot}" height="${ih}" fill="transparent"/>`;
    });
    ticksFor(rows.length, o.ticks || 6).forEach(i => {
      s += `<text x="${pl + i * slot + slot / 2}" y="${H - 6}" text-anchor="middle">${esc(rows[i].label)}</text>`;
    });
    (o.markers || []).forEach(m => {
      const x = pl + m.i * slot + slot / 2;
      s += `<g><line x1="${x}" x2="${x}" y1="${pt}" y2="${pt + ih}" stroke="var(--ink-2)" stroke-dasharray="2 3" stroke-width="1"/>
        <circle cx="${x}" cy="${pt + 6}" r="9" fill="var(--surface)" stroke="var(--ink-2)"/><text x="${x}" y="${pt + 10}" text-anchor="middle" class="lbl-strong" style="font-size:11px">${m.n}</text></g>`;
    });
    el.innerHTML = s + "</svg>";
    el.querySelectorAll(".hit").forEach(h => {
      h.addEventListener("mousemove", e => {
        const r = rows[+h.dataset.i];
        const tot = series.reduce((a, k) => a + r.values[k.key], 0);
        showTip(e, `<div class="tt">${esc(r.tip || r.label)}</div>` + series.slice().reverse().map(k =>
          `<div class="tr"><span><i style="background:var(${k.color})"></i>${esc(k.name)}</span><b class="num">${o.fmt ? o.fmt(r.values[k.key]) : r.values[k.key]}</b></div>`).join("") +
          `<div class="tr" style="margin-top:4px;border-top:1px solid var(--border);padding-top:4px"><span>${esc(o.totalLabel || "Total")}</span><b class="num">${o.fmt ? o.fmt(tot) : tot}</b></div>`);
        h.setAttribute("fill", "color-mix(in srgb, var(--ink) 5%, transparent)");
      });
      h.addEventListener("mouseleave", () => { hideTip(); h.setAttribute("fill", "transparent"); });
    });
  }

  /* xs: [{label, tip}], series: [{name,color,values[]}] — one y-axis only */
  function lines(el, xs, series, o = {}) {
    const W = o.width || 760, H = o.height || 240, pl = 40, pr = series.length <= 4 ? 130 : 12, pt = 10, pb = 26;
    const sc = scale(Math.max(...series.flatMap(s => s.values)) * 1.08), max = sc.max;
    const iw = W - pl - pr, ih = H - pt - pb, n = xs.length;
    const X = i => pl + (n === 1 ? iw / 2 : (iw * i) / (n - 1)), Y = v => pt + ih - (ih * v) / max;
    let s = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(o.aria || "")}">`;
    for (let g = 0; g <= sc.k; g++) {
      const v = sc.step * g, y = Y(v);
      s += `<line x1="${pl}" x2="${W - pr}" y1="${y}" y2="${y}" stroke="var(${g === 0 ? "--axis" : "--grid"})"/>`;
      s += `<text x="${pl - 8}" y="${y + 4}" text-anchor="end" class="num">${o.fmtY ? o.fmtY(v) : v}</text>`;
    }
    ticksFor(n, o.ticks || 6).forEach(i => { s += `<text x="${X(i)}" y="${H - 6}" text-anchor="middle">${esc(xs[i].label)}</text>`; });
    series.forEach(se => {
      s += `<path d="${se.values.map((v, i) => (i ? "L" : "M") + X(i).toFixed(1) + "," + Y(v).toFixed(1)).join("")}" fill="none" stroke="var(${se.color})" stroke-width="${se.emph ? 2.5 : 2}" stroke-linejoin="round" stroke-linecap="round"/>`;
    });
    if (series.length <= 4) {
      const ends = series.map(se => ({ se, y: Y(se.values[n - 1]) })).sort((a, b) => a.y - b.y);
      for (let i = 1; i < ends.length; i++) if (ends[i].y - ends[i - 1].y < 15) ends[i].y = ends[i - 1].y + 15;
      ends.forEach(({ se, y }) => {
        s += `<circle cx="${X(n - 1)}" cy="${Y(se.values[n - 1])}" r="4" fill="var(${se.color})" stroke="var(--surface)" stroke-width="2"/>`;
        s += `<text x="${X(n - 1) + 10}" y="${y + 4}" class="${se.emph ? "lbl-strong" : "lbl"}">${esc(se.name)}</text>`;
      });
    }
    s += `<g class="xh" style="display:none"><line y1="${pt}" y2="${pt + ih}" stroke="var(--axis)"/>${series.map(se => `<circle r="4" fill="var(${se.color})" stroke="var(--surface)" stroke-width="2"/>`).join("")}</g>`;
    s += `<rect class="ov" x="${pl}" y="${pt}" width="${iw}" height="${ih}" fill="transparent"/>`;
    el.innerHTML = s + "</svg>";
    const svg = el.querySelector("svg"), ov = el.querySelector(".ov"), xh = el.querySelector(".xh");
    ov.addEventListener("mousemove", e => {
      const pt2 = svg.createSVGPoint(); pt2.x = e.clientX; pt2.y = e.clientY;
      const p = pt2.matrixTransform(svg.getScreenCTM().inverse());
      const i = Math.max(0, Math.min(n - 1, Math.round(((p.x - pl) / iw) * (n - 1))));
      xh.style.display = ""; const ln = xh.querySelector("line"); ln.setAttribute("x1", X(i)); ln.setAttribute("x2", X(i));
      xh.querySelectorAll("circle").forEach((c, k) => { c.setAttribute("cx", X(i)); c.setAttribute("cy", Y(series[k].values[i])); });
      const rows = series.map(se => ({ se, v: se.values[i] })).sort((a, b) => b.v - a.v);
      showTip(e, `<div class="tt">${esc(xs[i].tip || xs[i].label)}</div>` + rows.map(r =>
        `<div class="tr"><span><i style="background:var(${r.se.color})"></i>${esc(r.se.name)}</span><b class="num">${o.fmt ? o.fmt(r.v) : r.v}</b></div>`).join(""));
    });
    ov.addEventListener("mouseleave", () => { xh.style.display = "none"; hideTip(); });
  }

  return { stacked, lines, showTip, hideTip, esc };
})();
