// Builds the "Overall report" (shown as a popup on entry and as a section on the page).
// Rule-based, recomputed from data.json every time, so it stays current as new rows are added.
(function () {
  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const pct = (a, b) => (b ? (100 * a) / b : 0);
  const f1 = (v) => (Math.round(v * 10) / 10).toFixed(1);
  const chNo = (ch) => (String(ch).match(/\d+/) || [""])[0];

  function sum(rows, key) { return rows.reduce((a, r) => a + (Number(r[key]) || 0), 0); }

  function aggregate(rows) {
    const c = sum(rows, "correct"), w = sum(rows, "wrong"), s = sum(rows, "skipped"), t = sum(rows, "total");
    const time = sum(rows, "timing_min");
    return { tests: rows.length, correct: c, wrong: w, skipped: s, total: t, answered: c + w,
      score: pct(c, t), wrongRate: pct(w, c + w), skipRate: pct(s, t), sec: c + w ? (time * 60) / (c + w) : null };
  }

  // One point per sitting (same date + subject), using the real sitting time.
  function sittings(S) {
    const map = new Map();
    for (const r of S) {
      const k = r.date + "|" + r.subject;
      if (!map.has(k)) map.set(k, { date: r.date, subject: r.subject, rows: [], time: r.session_time_min });
      map.get(k).rows.push(r);
    }
    return [...map.values()].map((g) => {
      const a = aggregate(g.rows);
      return { ...g, score: a.score, sec: a.answered ? (g.time * 60) / a.answered : null };
    });
  }

  function trendLine(points, label, target) {
    if (points.length < 2) return `<li><b>${esc(label)}:</b> only ${points.length} sitting so far, so there is no trend yet. It will show after the next test.</li>`;
    const a = points[0], b = points[points.length - 1];
    const ds = b.score - a.score, dsec = b.sec - a.sec;
    const scoreTxt = Math.abs(ds) < 2 ? `score stayed about the same (${f1(a.score)}% to ${f1(b.score)}%)`
      : ds > 0 ? `score went <span class="up">up</span> from ${f1(a.score)}% to ${f1(b.score)}%`
      : `score went <span class="down">down</span> from ${f1(a.score)}% to ${f1(b.score)}%`;
    const secTxt = Math.abs(dsec) < 2 ? `speed stayed about the same (${f1(a.sec)} s to ${f1(b.sec)} s per MCQ)`
      : dsec < 0 ? `speed got <span class="up">faster</span> from ${f1(a.sec)} s to ${f1(b.sec)} s per MCQ`
      : `speed got <span class="down">slower</span> from ${f1(a.sec)} s to ${f1(b.sec)} s per MCQ`;
    return `<li><b>${esc(label)}</b> (${points.length} sittings): ${scoreTxt}; ${secTxt} (target ${target} s).</li>`;
  }

  // Speed with the REAL sitting time (each sitting counted once), not the rounded-up chapter times.
  function realSec(rows) {
    const sit = sittings(rows);
    const time = sit.reduce((a, p) => a + (Number(p.time) || 0), 0);
    const ans = rows.reduce((a, r) => a + r.correct + r.wrong, 0);
    return ans ? (time * 60) / ans : null;
  }

  window.buildReport = function (data, syllabus) {
    const S = data.sessions;
    const tgt = data.target.sec_per_mcq;
    if (!S.length) return "<p>No tests logged yet.</p>";
    const name = (subj, ch) => syllabus[subj]?.chapters?.[chNo(ch)]?.name;
    const topics = (subj, ch) => syllabus[subj]?.chapters?.[chNo(ch)]?.topics;
    const paper = (subj) => syllabus[subj]?.paper || subj;

    // ---- per chapter (all tests of the same chapter combined)
    const byCh = new Map();
    for (const r of S) { const k = r.subject + "|" + chNo(r.chapter); if (!byCh.has(k)) byCh.set(k, []); byCh.get(k).push(r); }
    const chapters = [...byCh.entries()].map(([k, rows]) => {
      const [subj, no] = k.split("|"); const a = aggregate(rows);
      const need = (100 - a.score) + 2 * Math.max(0, (a.sec ?? tgt) - tgt);   // lower score and slower speed both raise priority
      return { subj, no, rows, ...a, need };
    }).sort((x, y) => y.need - x.need);

    // ---- per subject
    const subjects = [...new Set(S.map((r) => r.subject))].map((subj) => { const rows = S.filter((r) => r.subject === subj); return { subj, ...aggregate(rows), sec: realSec(rows) }; });
    const all = { ...aggregate(S), sec: realSec(S) };
    const sit = sittings(S);

    // ---- headline
    const slowSubj = subjects.filter((s) => s.sec > tgt).map((s) => paper(s.subj));
    const fastSubj = subjects.filter((s) => s.sec <= tgt).map((s) => paper(s.subj));
    let html = `<p class="lead">Based on <b>${S.length} chapter tests</b> in <b>${sit.length} sittings</b>
      (${esc(new Date(S[0].date + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short" }))} to
      ${esc(new Date(S[S.length - 1].date + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }))}).
      Overall score <b>${f1(all.score)}%</b>. Overall speed <b>${f1(all.sec)} s</b> per MCQ (real sitting time; target ${tgt} s).
      ${S.length < 8 ? "This is still a small amount of data, so treat it as an early picture." : ""}</p>`;

    // ---- trend
    html += `<h3>Overall trend</h3>`;
    const comparable = subjects.filter((s) => sit.filter((p) => p.subject === s.subj).length >= 2);
    if (!comparable.length) {
      html += `<p>No trend yet. A fair trend needs at least 2 sittings of the <b>same subject</b>. So far: ${subjects.map((s) => `${esc(paper(s.subj))} ${sit.filter((p) => p.subject === s.subj).length} sitting`).join(", ")}.
        Comparing a Physics sitting with a Higher Math sitting would not show real growth.</p>`;
    } else {
      html += `<ul>`;
      for (const s of subjects) html += trendLine(sit.filter((p) => p.subject === s.subj), paper(s.subj), tgt);
      html += `</ul><p class="note">Trend compares the first and the latest sitting of each subject. Different chapters can be easier or harder, so read it as a rough direction.</p>`;
    }

    // ---- subject summary
    html += `<h3>By subject</h3><ul>`;
    for (const s of subjects) {
      const speed = s.sec > tgt ? `<span class="down">${f1(s.sec - tgt)} s slower</span> than target per MCQ` : `<span class="up">within target</span> speed`;
      html += `<li><b>${esc(paper(s.subj))}</b>: score ${f1(s.score)}%, ${f1(s.sec)} s per MCQ (${speed}), ${f1(s.wrongRate)}% of answered MCQs wrong.</li>`;
    }
    html += `</ul>`;

    // ---- focus list
    html += `<h3>Where to focus first</h3><ol>`;
    for (const c of chapters) {
      const nm = name(c.subj, c.no);
      const reasons = [];
      if (c.score < 60) reasons.push(`low score (${f1(c.score)}%): revise the theory and basic formulas first`);
      else if (c.score < 75) reasons.push(`score ${f1(c.score)}%: needs more practice`);
      else reasons.push(`good score (${f1(c.score)}%)`);
      if (c.sec > tgt) reasons.push(`slow (${f1(c.sec)} s per MCQ, target ${tgt} s): do timed sets`);
      if (c.wrongRate > 25) reasons.push(`${c.wrong} of ${c.answered} answered were wrong (${f1(c.wrongRate)}%): check doubtful MCQs before marking`);
      if (c.skipRate > 10) reasons.push(`${c.skipped} skipped: find out which topics were left`);
      const tp = topics(c.subj, c.no);
      html += `<li><b>${esc(c.subj)} Ch ${esc(c.no)}${nm ? ": " + esc(nm) : ""}</b> (${c.tests} test${c.tests > 1 ? "s" : ""}). ${reasons.join("; ")}.
        ${tp && c.score < 75 ? `<br><span class="topics">Revise: ${esc(tp)}.</span>` : ""}</li>`;
    }
    html += `</ol>`;

    // ---- shared topic hint (Vector appears in both Physics 1st and Higher Math 1st)
    const pv = chapters.find((c) => c.subj === "P1" && c.no === "2"), hv = chapters.find((c) => c.subj === "HM1" && c.no === "2");
    if (pv && hv) {
      html += `<p class="note">Vector is in both Physics 1st Paper (Ch 2) and Higher Math 1st Paper (Ch 2). Score: Physics ${f1(pv.score)}%, Higher Math ${f1(hv.score)}%.
        The math is the same, so practise them together. ${pv.score < hv.score ? "In Physics, focus on the uses: river and boat, relative velocity, resolution of forces." : ""}</p>`;
    }

    // ---- what to do next
    const tested = new Set(chapters.map((c) => c.subj + "|" + c.no));
    html += `<h3>Not tested yet</h3><ul>`;
    for (const subj of ["P1", "HM1"]) {
      const left = Object.entries(syllabus[subj].chapters).filter(([no]) => !tested.has(subj + "|" + no));
      if (left.length) html += `<li><b>${esc(paper(subj))}</b>: ${left.map(([no, c]) => `Ch ${no} ${esc(c.name)}`).join(", ")}.</li>`;
    }
    const twoDone = [...new Set(S.map((r) => r.subject))].filter((s) => s === "P2" || s === "HM2");
    if (!twoDone.length) html += `<li>No 2nd Paper chapters (Physics or Higher Math) tested yet.</li>`;
    html += `</ul>`;

    html += `<p class="how">How this report is made: it is worked out from the logged MCQ results only (score, time and counts per chapter).
      Lower score and slower speed put a chapter higher in the focus list. Subject and overall speed use the real sitting time; chapter speed uses the chapter time (rounded up to a full minute). It cannot see which exact questions were wrong.
      To find the weak topic inside a chapter, mark the wrong MCQs during checking.</p>`;
    return html;
  };
})();
