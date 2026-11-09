// Renders a student progress page from profile.json + data.json in the same folder.
const css = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
const SUBJECTS = { P1: "Physics 1st Paper", P2: "Physics 2nd Paper", HM1: "Higher Math 1st Paper", HM2: "Higher Math 2nd Paper" };
const fmtDate = (iso) => new Date(iso + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
const shortDate = (iso) => new Date(iso + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short" });
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

async function load() {
  const [profile, data] = await Promise.all(["profile.json", "data.json"].map((f) => fetch(f, { cache: "no-store" }).then((r) => r.json())));
  renderProfile(profile);
  document.getElementById("updated").textContent = fmtDate(data.updated);
  document.getElementById("target-text").textContent = `${data.target.mcq} MCQ in ${data.target.minutes} min (${data.target.sec_per_mcq} s per MCQ)`;
  const present = [...new Set(data.sessions.map((s) => s.subject))];
  const bar = document.getElementById("filters");
  const buttons = ["All", ...present].map((key) => {
    const b = document.createElement("button");
    b.textContent = key === "All" ? "All subjects" : `${key} (${SUBJECTS[key] || key})`;
    b.setAttribute("aria-pressed", key === "All");
    b.onclick = () => { buttons.forEach((x) => x.setAttribute("aria-pressed", x === b)); render(data, key); };
    bar.appendChild(b); return b;
  });
  render(data, "All");
}

function renderProfile(p) {
  const row = (k, v) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`;
  document.getElementById("student-name").textContent = p.name;
  document.title = `${p.name}: MCQ Progress`;
  document.getElementById("profile").innerHTML = `
    <div class="card"><h2>Student</h2><dl>${row("Name", p.name)}${row("Target", p.target)}${row("Subjects", p.subjects)}</dl></div>
    <div class="card"><h2>SSC</h2><dl>${row("Batch", p.ssc.batch)}${row("School", p.ssc.school)}${row("Result", p.ssc.result)}</dl></div>
    <div class="card"><h2>HSC</h2><dl>${row("Batch", p.hsc.batch)}${row("College", p.hsc.college)}${row("Result", p.hsc.result)}</dl></div>`;
}

function render(data, subject) {
  const S = data.sessions.filter((s) => subject === "All" || s.subject === subject);
  const x = S.map((s, i) => `${shortDate(s.date)} (${s.subject})` + (S.filter((t) => t.date === s.date && t.subject === s.subject).length > 1 ? ` #${i + 1}` : ""));
  const last = S[S.length - 1];
  const avg = S.length ? S.reduce((a, s) => a + s.percentage, 0) / S.length : null;
  const best = S.length ? Math.max(...S.map((s) => s.percentage)) : null;
  const tile = (label, value, hint) => `<div class="card tile"><div class="label">${label}</div><div class="value">${value}</div><div class="hint">${hint}</div></div>`;
  document.getElementById("tiles").innerHTML = !S.length ? "" :
    tile("Sessions", S.length, "practice tests logged") +
    tile("Latest score", `${last.percentage.toFixed(1)}%`, fmtDate(last.date)) +
    tile("Average score", `${avg.toFixed(1)}%`, "all sessions shown") +
    tile("Best score", `${best.toFixed(1)}%`, "highest so far") +
    tile("Latest speed", `${last.sec_per_mcq} s`, `per MCQ, target ${data.target.sec_per_mcq} s`);

  const base = (yTitle, extra = {}) => ({
    margin: { l: 48, r: 12, t: 8, b: 44 }, paper_bgcolor: "rgba(0,0,0,0)", plot_bgcolor: "rgba(0,0,0,0)",
    font: { family: "system-ui, Segoe UI, Arial, sans-serif", size: 12, color: css("--text-secondary") },
    xaxis: { type: "category", showgrid: false, linecolor: css("--border"), fixedrange: true, range: [-0.5, x.length - 0.5] },
    uniformtext: { mode: "hide", minsize: 10 },
    yaxis: { title: { text: yTitle }, gridcolor: css("--grid"), zeroline: false, fixedrange: true, ...extra },
    hovermode: "x unified", showlegend: false, bargap: 0.45,
    hoverlabel: { bgcolor: css("--surface-1"), bordercolor: css("--border"), font: { color: css("--text-primary") } },
  });
  const cfg = { displayModeBar: false, responsive: true };
  const blue = css("--series-1");
  const line = { color: blue, width: 2 }, marker = { size: 9, color: blue, line: { color: css("--surface-1"), width: 2 } };
  const lastOnly = (arr, f) => arr.map((v, i) => (i === arr.length - 1 ? f(v) : ""));

  const pct = S.map((s) => s.percentage);
  Plotly.react("plot-score", [{ x, y: pct, type: "scatter", mode: "lines+markers+text", line, marker,
    text: lastOnly(pct, (v) => `${v.toFixed(1)}%`), textposition: "top center", textfont: { color: css("--text-primary") },
    hovertemplate: "Score: %{y:.1f}%<extra></extra>" }], base("score (%)", { range: [0, 105], ticksuffix: "%" }), cfg);

  const slow = S.map((s) => s.slow_by_min);
  Plotly.react("plot-slow", [{ x, y: slow, type: "bar", width: 0.5, marker: { color: blue },
    text: lastOnly(slow, (v) => `${v.toFixed(1)} min`), textposition: "outside", textfont: { color: css("--text-primary") }, cliponaxis: false,
    hovertemplate: "Slow by: %{y:.1f} min<extra></extra>" }],
    { ...base("minutes", { zeroline: true, zerolinecolor: css("--text-muted"), zerolinewidth: 1,
      range: [Math.min(0, ...slow) * 1.25, Math.max(1, ...slow) * 1.25] }) }, cfg);

  const stack = (key, name, color) => ({ x, y: S.map((s) => s[key]), name, type: "bar", width: 0.5, marker: { color, line: { color: css("--surface-1"), width: 2 } },
    text: S.map((s) => s[key]), textposition: "inside", insidetextanchor: "middle", textangle: 0, textfont: { color: "#fff" },
    hovertemplate: `${name}: %{y}<extra></extra>` });
  Plotly.react("plot-cws", [stack("correct", "Correct", css("--good")), stack("wrong", "Wrong", css("--critical")), stack("skipped", "Skipped", css("--neutral"))],
    { ...base("number of MCQs"), barmode: "stack", showlegend: true, legend: { orientation: "h", y: -0.2, x: 0, traceorder: "normal" } }, cfg);

  const sec = S.map((s) => s.sec_per_mcq);
  const tgt = data.target.sec_per_mcq;
  Plotly.react("plot-speed", [
    { x, y: sec, name: "Seconds per MCQ", type: "scatter", mode: "lines+markers+text", line, marker,
      text: lastOnly(sec, (v) => `${v} s`), textposition: "top center", textfont: { color: css("--text-primary") },
      hovertemplate: `Speed: %{y} s per MCQ (target ${tgt} s)<extra></extra>` }],
    { ...base("seconds", { range: [0, Math.max(tgt, ...sec) * 1.25] }),
      shapes: [{ type: "line", xref: "paper", x0: 0, x1: 1, y0: tgt, y1: tgt, line: { color: css("--text-secondary"), width: 2, dash: "dash" } }],
      annotations: [{ xref: "paper", x: 1, y: tgt, yanchor: "top", xanchor: "right", text: `Target ${tgt} s`, showarrow: false,
        font: { color: css("--text-secondary"), size: 12 } }] }, cfg);

  document.getElementById("rows").innerHTML = S.slice().reverse().map((s) => `<tr>
    <td>${fmtDate(s.date)}</td><td>${esc(s.subject)}</td><td>${esc(s.chapter)}</td><td>${s.total}</td><td>${s.timing_min} min</td>
    <td>${s.correct}</td><td>${s.wrong}</td><td>${s.skipped}</td><td>${s.percentage.toFixed(1)}%</td>
    <td class="${s.slow_by_min > 0 ? "slow" : "ok"}">${s.slow_by_min > 0 ? s.slow_by_min.toFixed(1) + " min slow" : "On target"}</td>
    <td>${s.sec_per_mcq} s</td><td class="left">${esc(s.book)}${s.notes ? "<br><small>" + esc(s.notes) + "</small>" : ""}</td></tr>`).join("");
}

load().catch((e) => { document.querySelector("main").insertAdjacentHTML("afterbegin", `<p class="card">Could not load data: ${esc(e.message)}</p>`); });
