// Renders a student progress page from profile.json + data.json (+ shared syllabus.json), in Bangla or English.
const css = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const I = window.I18N, t = I.t;
const chNo = (ch) => (String(ch).match(/\d+/) || [""])[0];
let STATE = { profile: null, data: null, syllabus: null, subject: "All" };

async function load() {
  const [profile, data, syllabus] = await Promise.all(["profile.json", "data.json", "../assets/syllabus.json"]
    .map((f) => fetch(f, { cache: "no-store" }).then((r) => r.json())));
  STATE = { profile, data, syllabus, subject: "All" };
  document.querySelectorAll(".lang-switch button").forEach((b) => (b.onclick = () => { I.set(b.dataset.lang); renderAll(); }));
  setupModal();
  renderAll();
  if (new URLSearchParams(location.search).get("popup") !== "0") openModal();   // ?popup=0 opens the page without the popup
}

const paperName = (subj) => (I.lang === "bn" ? STATE.syllabus[subj]?.paper_bn : STATE.syllabus[subj]?.paper) || subj;
const chName = (subj, ch) => { const c = STATE.syllabus[subj]?.chapters?.[chNo(ch)]; return c ? (I.lang === "bn" ? c.name_bn || c.name : c.name) : ""; };

function renderAll() {
  const { profile, data } = STATE;
  document.documentElement.lang = I.lang;
  document.querySelectorAll(".lang-switch button").forEach((b) => b.setAttribute("aria-pressed", b.dataset.lang === I.lang));
  document.querySelectorAll("[data-t]").forEach((el) => (el.textContent = t(el.dataset.t)));
  document.getElementById("modal-close").setAttribute("aria-label", t("close"));
  document.getElementById("student-name").textContent = profile.name;
  document.title = `${profile.name}: ${t("title")}`;
  document.getElementById("sub").textContent = t("sub", { mcq: I.num(data.target.mcq), min: I.num(data.target.minutes), sec: I.num(data.target.sec_per_mcq), date: I.date(data.updated), neg: I.num(data.target.negative_mark ?? 0.25), pen: I.num(data.target.skip_penalty_min ?? 1) });
  renderProfile(profile);
  const report = window.buildReport(data, STATE.syllabus);
  document.getElementById("report-body").innerHTML = report;
  const gist = window.buildGist(data, STATE.syllabus, profile);
  document.getElementById("modal-title").textContent = gist.title;
  document.getElementById("modal-body").innerHTML = gist.html;
  document.getElementById("modal-ok").textContent = gist.full;
  renderFilters();
  render();
}

function examRow(p) {
  if (!p.exam?.date) return "";
  const d = Math.ceil((new Date(p.exam.date + "T11:00:00") - new Date()) / 86400000);
  if (d < 0) return "";
  return `<dt>${esc(t("exam"))}</dt><dd>${esc(t("examVal", { date: I.date(p.exam.date), d: I.num(d) }))}</dd>`;
}

function renderProfile(p) {
  const P = I.lang === "bn" && p.bn ? { ...p, ...p.bn, ssc: { ...p.ssc, ...p.bn.ssc }, hsc: { ...p.hsc, ...p.bn.hsc } } : p;
  const row = (k, v) => `<dt>${esc(t(k))}</dt><dd>${esc(v)}</dd>`;
  document.getElementById("profile").innerHTML = `
    <div class="card"><h2>${t("student")}</h2><dl>${row("name", P.name)}${row("target", P.target)}${row("subjects", P.subjects)}${examRow(p)}</dl></div>
    <div class="card"><h2>${t("ssc")}</h2><dl>${row("batch", P.ssc.batch)}${row("school", P.ssc.school)}${row("version", P.ssc.version)}${row("result", P.ssc.result)}</dl></div>
    <div class="card"><h2>${t("hsc")}</h2><dl>${row("batch", P.hsc.batch)}${row("college", P.hsc.college)}${row("version", P.hsc.version)}${row("result", P.hsc.result)}</dl></div>`;
}

function renderFilters() {
  const bar = document.getElementById("filters");
  bar.innerHTML = `<span>${t("show")}</span>`;
  const present = [...new Set(STATE.data.sessions.map((s) => s.subject))];
  ["All", ...present].forEach((key) => {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = key === "All" ? t("all") : `${key} (${paperName(key)})`;
    b.setAttribute("aria-pressed", key === STATE.subject);
    b.onclick = () => { STATE.subject = key; renderFilters(); render(); };
    bar.appendChild(b);
  });
}

function render() {
  const { data, profile } = STATE;
  const S = data.sessions.filter((s) => STATE.subject === "All" || s.subject === STATE.subject);
  const x = S.map((s) => t("chLabel", { date: I.date(s.date, false), subj: s.subject, no: I.num(chNo(s.chapter)) }));
  const last = S[S.length - 1];
  const avg = S.length ? S.reduce((a, s) => a + s.percentage, 0) / S.length : null;
  const best = S.length ? Math.max(...S.map((s) => s.percentage)) : null;
  const tile = (label, value, hint) => `<div class="card tile"><div class="label">${label}</div><div class="value">${value}</div><div class="hint">${hint}</div></div>`;
  document.getElementById("tiles").innerHTML = !S.length ? "" :
    tile(t("tTests"), I.num(S.length), t("hTests")) +
    tile(t("tLatest"), `${I.f1(last.percentage)}%`, I.date(last.date)) +
    tile(t("tAvg"), `${I.f1(avg)}%`, t("hAvg")) +
    tile(t("tBest"), `${I.f1(best)}%`, t("hBest")) +
    tile(t("tSpeed"), `${I.num(Math.round(last.sec_per_mcq))} ${t("secUnit")}`, t("hSpeed", { sec: I.num(data.target.sec_per_mcq) }));

  const base = (yTitle, extra = {}) => ({
    margin: { l: 52, r: 12, t: 8, b: 20 }, paper_bgcolor: "rgba(0,0,0,0)", plot_bgcolor: "rgba(0,0,0,0)",
    font: { family: "'Noto Sans Bengali', system-ui, Segoe UI, Arial, sans-serif", size: 12, color: css("--text-secondary") },
    xaxis: { type: "category", showgrid: false, linecolor: css("--border"), fixedrange: true, range: [-0.5, x.length - 0.5], automargin: true, tickangle: x.length > 4 ? -35 : 0, tickfont: { size: 11 } },
    yaxis: { title: { text: yTitle }, gridcolor: css("--grid"), zeroline: false, fixedrange: true, ...extra },
    uniformtext: { mode: "hide", minsize: 10 },
    hovermode: "x unified", showlegend: false, bargap: 0.45,
    hoverlabel: { bgcolor: css("--surface-1"), bordercolor: css("--border"), font: { color: css("--text-primary") } },
  });
  const cfg = { displayModeBar: false, responsive: true };
  const blue = css("--series-1");
  const line = { color: blue, width: 2 }, marker = { size: 9, color: blue, line: { color: css("--surface-1"), width: 2 } };
  const lastOnly = (arr, fn) => arr.map((v, i) => (i === arr.length - 1 ? fn(v) : ""));

  const pct = S.map((s) => s.percentage);
  Plotly.react("plot-score", [{ x, y: pct, type: "scatter", mode: "lines+markers+text", line, marker,
    text: lastOnly(pct, (v) => `${I.f1(v)}%`), textposition: "top center", textfont: { color: css("--text-primary") },
    hovertemplate: `${t("hScore")}: %{y:.1f}%<extra></extra>` }], base(t("ySc"), { range: [0, 105], ticksuffix: "%" }), cfg);

  const slow = S.map((s) => s.slow_by_min);
  Plotly.react("plot-slow", [{ x, y: slow, type: "bar", width: 0.5, marker: { color: blue },
    text: lastOnly(slow, (v) => `${I.f1(v)} ${t("minUnit")}`), textposition: "outside", textfont: { color: css("--text-primary") }, cliponaxis: false,
    hovertemplate: `${t("hSlow")}: %{y:.1f} ${t("minUnit")}<extra></extra>` }],
    { ...base(t("yMin"), { zeroline: true, zerolinecolor: css("--text-muted"), zerolinewidth: 1,
      range: [Math.min(0, ...slow) * 1.25, Math.max(1, ...slow) * 1.25] }) }, cfg);

  const stack = (key, name, color) => ({ x, y: S.map((s) => s[key]), name, type: "bar", width: 0.5, marker: { color, line: { color: css("--surface-1"), width: 2 } },
    text: S.map((s) => I.num(s[key])), textposition: "inside", insidetextanchor: "middle", textangle: 0, textfont: { color: "#fff" },
    hovertemplate: `${name}: %{y}<extra></extra>` });
  Plotly.react("plot-cws", [stack("correct", t("correct"), css("--good")), stack("wrong", t("wrong"), css("--critical")), stack("skipped", t("skipped"), css("--neutral"))],
    { ...base(t("yN")), barmode: "stack", showlegend: true, legend: { orientation: "h", y: -0.22, x: 0, traceorder: "normal" } }, cfg);

  const sec = S.map((s) => s.sec_per_mcq);
  const tgt = data.target.sec_per_mcq;
  Plotly.react("plot-speed", [{ x, y: sec, name: t("cSpeed"), type: "scatter", mode: "lines+markers+text", line, marker,
    text: lastOnly(sec, (v) => `${I.num(Math.round(v))} ${t("secUnit")}`), textposition: sec.map((v) => (v < tgt ? "bottom center" : "top center")), textfont: { color: css("--text-primary") },
    hovertemplate: `${t("hSpd")}: %{y} ${t("secUnit")}<extra></extra>` }],
    { ...base(t("ySec"), { range: [0, Math.max(tgt, ...sec) * 1.25] }),
      shapes: [{ type: "line", xref: "paper", x0: 0, x1: 1, y0: tgt, y1: tgt, line: { color: css("--text-secondary"), width: 2, dash: "dash" } }],
      annotations: [{ xref: "paper", x: 0, y: tgt, yanchor: "top", xanchor: "left", text: t("tgtLbl", { sec: I.num(tgt) }), showarrow: false,
        font: { color: css("--text-secondary"), size: 12 } }] }, cfg);

  const books = I.lang === "bn" ? (profile.bn?.books || {}) : {};
  renderWritten();
  document.getElementById("rows").innerHTML = S.slice().reverse().map((s) => {
    const sb = s.slow_by_min;
    const vs = sb > 0 ? `<td class="slow">${t("slowBy", { x: I.f1(sb) })}</td>` : sb < 0 ? `<td class="ok">${t("fastBy", { x: I.f1(-sb) })}</td>` : `<td class="ok">${t("onTarget")}</td>`;
    return `<tr>
    <td>${I.date(s.date)}</td><td>${esc(s.subject)}</td><td class="left">${esc(t("chFull", { no: I.num(chNo(s.chapter)), name: chName(s.subject, s.chapter) }))}</td>
    <td>${I.num(s.total)}</td><td>${I.num(s.timing_min ?? 0)} ${t("minUnit")}${s.penalty_min ? `<br><small class="slow">${t("plusPen", { p: I.num(s.penalty_min) })}</small>` : ""}<br><small>${t("ofSitting", { s: I.num(s.session_time_min) })}</small></td>
    <td>${I.num(s.correct)}</td><td>${I.num(s.wrong)}</td><td>${I.num(s.skipped)}</td><td><b>${I.f1(s.percentage)}%</b><br><small>${t("rawLbl", { r: I.f1(s.raw_percentage) })}</small></td>
    ${vs}<td>${I.num(Math.round(s.sec_per_mcq))} ${t("secUnit")}</td>
    <td class="left">${esc(books[s.book] || s.book)}${s.notes && I.lang === "en" ? "<br><small>" + esc(s.notes) + "</small>" : ""}</td></tr>`;
  }).join("");
}

function renderWritten() {
  const { data } = STATE, sec = document.getElementById("written-sec");
  const W = (data.written || []).filter((w) => STATE.subject === "All" || w.subject === STATE.subject);
  sec.hidden = !W.length;
  if (!W.length) return;
  const wt = data.written_target || {}, mpq = W[0].marks_per_q;
  const du = wt.du_marks ? (wt.du_minutes / wt.du_marks) * mpq : null;
  document.getElementById("w-sub").textContent = t("wSub", { m: I.num(mpq), t: I.num(wt.min_per_q), dm: I.num(wt.du_marks), dmin: I.num(wt.du_minutes), du: I.f1(du) });
  const got = W.reduce((a, w) => a + w.obtained, 0), full = W.reduce((a, w) => a + w.full_marks, 0);
  // sittings: same date + same session time; pace uses the whole sitting (all subjects in it)
  const all = data.written, key = (w) => w.date + "|" + w.session_time_min;
  const lastKey = key(all[all.length - 1]);
  const lastSit = all.filter((w) => key(w) === lastKey), q = lastSit.reduce((a, w) => a + w.questions, 0), smin = lastSit[0].session_time_min;
  const tile = (label, value, hint) => `<div class="card tile"><div class="label">${label}</div><div class="value">${value}</div><div class="hint">${hint}</div></div>`;
  document.getElementById("w-tiles").innerHTML =
    tile(t("wTot"), `${I.num(got)}`, t("wTotH", { f: I.num(full), p: I.f1(100 * got / full) })) +
    tile(t("wDu"), `${I.f1(40 * got / full)}`, t("wDuH")) +
    tile(t("wPace"), `${I.f1(smin / q)}`, t("wPaceH", { t: I.num(wt.min_per_q) }) + "<br>" + t("wSit", { q: I.num(q), s: I.num(smin) }));
  const x = W.map((w) => t("chLabel", { date: I.date(w.date, false), subj: w.subject, no: I.num(chNo(w.chapter)) }));
  const y = W.map((w) => w.percentage);
  Plotly.react("plot-written", [{ x, y, type: "bar", width: 0.5, marker: { color: css("--written") },
    text: W.map((w) => `${I.num(w.obtained)}/${I.num(w.full_marks)}`), textposition: "outside", cliponaxis: false, textfont: { color: css("--text-primary") },
    hovertemplate: `${t("thScore2")}: %{y:.1f}%<extra></extra>` }],
    { margin: { l: 52, r: 12, t: 16, b: 20 }, paper_bgcolor: "rgba(0,0,0,0)", plot_bgcolor: "rgba(0,0,0,0)",
      font: { family: "'Noto Sans Bengali', system-ui, Segoe UI, Arial, sans-serif", size: 12, color: css("--text-secondary") },
      xaxis: { type: "category", showgrid: false, linecolor: css("--border"), fixedrange: true, automargin: true, tickfont: { size: 11 } },
      yaxis: { title: { text: t("yPct") }, range: [0, 110], ticksuffix: "%", gridcolor: css("--grid"), zeroline: false, fixedrange: true },
      showlegend: false, hoverlabel: { bgcolor: css("--surface-1"), bordercolor: css("--border"), font: { color: css("--text-primary") } } },
    { displayModeBar: false, responsive: true });
  document.getElementById("wrows").innerHTML = W.slice().reverse().map((w) => `<tr>
    <td>${I.date(w.date)}</td><td>${esc(w.subject)}</td><td class="left">${esc(t("chFull", { no: I.num(chNo(w.chapter)), name: chName(w.subject, w.chapter) }))}</td>
    <td>${I.num(w.questions)}</td><td>${I.num(w.obtained)} / ${I.num(w.full_marks)}</td><td><b>${I.f1(w.percentage)}%</b></td>
    <td><small>${t("ofSitting", { s: I.num(w.session_time_min) })}</small></td></tr>`).join("");
}

function setupModal() {
  const m = document.getElementById("report-modal"), close = document.getElementById("modal-close");
  const shut = () => { m.hidden = true; document.body.classList.remove("no-scroll"); };
  close.onclick = shut;
  document.getElementById("modal-ok").onclick = () => { shut(); document.getElementById("report").scrollIntoView({ behavior: "smooth" }); };
  m.onclick = (e) => { if (e.target === m) shut(); };
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !m.hidden) shut(); });
  document.getElementById("open-report").onclick = openModal;
}
function openModal() {
  const m = document.getElementById("report-modal");
  m.hidden = false; document.body.classList.add("no-scroll"); document.getElementById("modal-close").focus();
}

load().catch((e) => { document.querySelector("main").insertAdjacentHTML("afterbegin", `<p class="card">${esc(t("loadErr"))}: ${esc(e.message)}</p>`); });
