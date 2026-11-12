// Builds the "Overall report" (popup on entry + section on the page), in Bangla or English.
// Rule-based and recomputed from data.json every time, so it stays current as new rows are added.
(function () {
  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const pct = (a, b) => (b ? (100 * a) / b : 0);
  const chNo = (ch) => (String(ch).match(/\d+/) || [""])[0];
  const sum = (rows, key) => rows.reduce((a, r) => a + (Number(r[key]) || 0), 0);

  function aggregate(rows) {
    const c = sum(rows, "correct"), w = sum(rows, "wrong"), s = sum(rows, "skipped"), t = sum(rows, "total");
    const time = sum(rows, "timing_min");
    return { tests: rows.length, correct: c, wrong: w, skipped: s, total: t, answered: c + w,
      score: t ? (100 * sum(rows, "net_score")) / t : 0, raw: pct(c, t), penalty: sum(rows, "penalty_min"), wrongRate: pct(w, c + w), skipRate: pct(s, t), sec: c + w ? (time * 60) / (c + w) : null };
  }
  // One point per sitting (same date + subject), using the real sitting time.
  function sittings(S) {
    const map = new Map();
    for (const r of S) {
      const k = r.date + "|" + r.subject + "|" + r.session_time_min;   // one sitting = same date + subject + session time
      if (!map.has(k)) map.set(k, { date: r.date, subject: r.subject, rows: [], time: r.session_time_min });
      map.get(k).rows.push(r);
    }
    return [...map.values()].map((g) => { const a = aggregate(g.rows); return { ...g, score: a.score, sec: a.answered ? (g.time * 60) / a.answered : null }; });
  }
  // Speed with the REAL sitting time (each sitting counted once), not the rounded-up chapter times.
  function realSec(rows) {
    const sit = sittings(rows);
    const time = sit.reduce((a, p) => a + (Number(p.time) || 0), 0);
    const ans = rows.reduce((a, r) => a + r.correct + r.wrong, 0);
    return ans ? (time * 60) / ans : null;
  }

  // ---------- text templates
  const TX = {
    bn: {
      empty: "এখনো কোনো টেস্ট লগ করা হয়নি।",
      lead: (v) => `মোট <b>${v.n}টি অধ্যায়ভিত্তিক টেস্ট</b>, <b>${v.s}টি সিটিং</b> (${v.from} থেকে ${v.to})। সার্বিক নেট স্কোর <b>${v.score}%</b> (ঢাবির নিয়মে প্রতি ভুলে ${v.neg} কাটা; কাটা ছাড়া ${v.raw}%)। সার্বিক গতি প্রতি এমসিকিউতে <b>${v.sec} সেকেন্ড</b> (আসল সিটিং সময় ধরে; টার্গেট ${v.tgt} সেকেন্ড)।`,
      early: "ডেটা এখনো কম, তাই এটিকে প্রাথমিক চিত্র হিসেবে দেখুন।",
      hTrend: "MCQ: সার্বিক ট্রেন্ড",
      noTrend: (v) => `এখনো ট্রেন্ড বলা যাচ্ছে না। সঠিক তুলনার জন্য <b>একই বিষয়ের</b> অন্তত ২টি সিটিং লাগবে। এখন পর্যন্ত: ${v.list}। পদার্থবিজ্ঞানের একটি সিটিং আর উচ্চতর গণিতের একটি সিটিং তুলনা করলে আসল উন্নতি বোঝা যায় না।`,
      sitCount: (v) => `${v.paper} ${v.k}টি সিটিং`,
      single: (v) => `<li><b>${v.paper}</b>: এখন পর্যন্ত মাত্র ${v.k}টি সিটিং, তাই ট্রেন্ড নেই। পরের টেস্টের পর দেখা যাবে।</li>`,
      scoreSame: (v) => `স্কোর প্রায় একই আছে (${v.a}% থেকে ${v.b}%)`,
      scoreUp: (v) => `স্কোর ${v.a}% থেকে ${v.b}% এ <span class="up">বেড়েছে</span>`,
      scoreDown: (v) => `স্কোর ${v.a}% থেকে ${v.b}% এ <span class="down">কমেছে</span>`,
      secSame: (v) => `গতি প্রায় একই আছে (প্রতি এমসিকিউতে ${v.a} থেকে ${v.b} সেকেন্ড)`,
      secUp: (v) => `গতি <span class="up">দ্রুত হয়েছে</span> (প্রতি এমসিকিউতে ${v.a} থেকে ${v.b} সেকেন্ড)`,
      secDown: (v) => `গতি <span class="down">ধীর হয়েছে</span> (প্রতি এমসিকিউতে ${v.a} থেকে ${v.b} সেকেন্ড)`,
      trendLi: (v) => `<li><b>${v.paper}</b> (${v.k}টি সিটিং): ${v.score}; ${v.sec} (টার্গেট ${v.tgt} সেকেন্ড)।</li>`,
      trendNote: "ট্রেন্ড প্রতিটি বিষয়ের প্রথম আর সর্বশেষ সিটিং তুলনা করে। অধ্যায় ভেদে প্রশ্ন সহজ বা কঠিন হতে পারে, তাই এটিকে মোটামুটি দিক হিসেবে পড়ুন।",
      hSubj: "MCQ: বিষয়ভিত্তিক",
      slowS: (v) => `টার্গেটের চেয়ে <span class="down">${v.d} সেকেন্ড ধীর</span>`,
      fastS: `<span class="up">টার্গেটের মধ্যে</span>`,
      subjLi: (v) => `<li><b>${v.paper}</b>: নেট স্কোর ${v.score}%, প্রতি এমসিকিউতে ${v.sec} সেকেন্ড (${v.speed}), উত্তর দেওয়া এমসিকিউর ${v.w}% ভুল।</li>`,
      hFocus: "MCQ: কোথায় আগে মনোযোগ দিতে হবে",
      rLow: (v) => `স্কোর কম (${v.s}%): আগে তত্ত্ব আর মূল সূত্রগুলো আবার পড়তে হবে`,
      rMid: (v) => `স্কোর ${v.s}%: আরও অনুশীলন দরকার`,
      rGood: (v) => `ভালো স্কোর (${v.s}%)`,
      rSlow: (v) => `ধীর (প্রতি এমসিকিউতে ${v.sec} সেকেন্ড, টার্গেট ${v.tgt} সেকেন্ড): সময় ধরে প্র্যাকটিস করতে হবে`,
      rWrong: (v) => `উত্তর দেওয়া ${v.a}টির মধ্যে ${v.w}টি ভুল (${v.r}%): সন্দেহ থাকলে দাগানোর আগে আবার যাচাই করতে হবে`,
      rSkip: (v) => `${v.k}টি স্কিপ (${v.k} মিনিট পেনাল্টি): কোন টপিক বাদ গেছে খুঁজে বের করতে হবে`,
      focusLi: (v) => `<li><b>${v.subj} অধ্যায় ${v.no}${v.name ? ": " + v.name : ""}</b> (${v.k}টি টেস্ট)। ${v.reasons}।${v.topics ? `<br><span class="topics">আবার পড়ুন: ${v.topics}।</span>` : ""}</li>`,
      vector: (v) => `ভেক্টর দুই বইতেই আছে: পদার্থবিজ্ঞান ১ম পত্র (অধ্যায় ২) আর উচ্চতর গণিত ১ম পত্র (অধ্যায় ২)। স্কোর: পদার্থবিজ্ঞান ${v.p}%, উচ্চতর গণিত ${v.h}%। গণিতের অংশ একই, তাই দুটো একসাথে প্র্যাকটিস করা ভালো।${v.phyWeaker ? " পদার্থবিজ্ঞানে প্রয়োগের অংশে বেশি জোর দিতে হবে: নদী ও নৌকা, আপেক্ষিক বেগ, ভেক্টরের উপাংশ।" : ""}`,
      hLeft: "এখনো টেস্ট হয়নি",
      hWritten: "লিখিত পরীক্ষা: সারসংক্ষেপ",
      wLead: (v) => `${v.q}টি প্রশ্নে ${v.full} এর মধ্যে ${v.got} (${v.p}%)। এই হারে ঢাবির ৪০ নম্বরের লিখিত অংশে আসবে প্রায় ${v.s40}। গতি: প্রতি প্রশ্নে ${v.pace} মিনিট (টার্গেট ${v.t}, আসল পরীক্ষায় প্রায় ${v.du})।`,
      wLi: (v) => `<li><b>${v.ch}</b>: ${v.got}/${v.full} (${v.p}%)${v.mcq != null ? `; একই অধ্যায়ের MCQ নেট স্কোর ${v.mcq}%` : ""}</li>`,
      wNote: "লিখিতে প্রতিটা ধাপ খাতায় দেখাতে হয়। MCQ তে যে অধ্যায় চলে, লিখিতে সেটা কম হলে বুঝতে হবে সূত্র মুখস্থ আছে কিন্তু পুরো সমাধান লেখার অভ্যাস কম। প্রতিদিন অন্তত ২-৩টা লিখিত প্রশ্ন সময় ধরে করা দরকার।",
      leftLi: (v) => `<li><b>${v.paper}</b>: ${v.list}।</li>`,
      leftCh: (v) => `অধ্যায় ${v.no} ${v.name}`,
      noSecond: "<li>২য় পত্রের (পদার্থবিজ্ঞান বা উচ্চতর গণিত) কোনো অধ্যায় এখনো টেস্ট হয়নি।</li>",
      how: "এই রিপোর্ট কীভাবে তৈরি: শুধু লগ করা এমসিকিউ ফলাফল (প্রতি অধ্যায়ের স্কোর, সময় ও সংখ্যা) থেকে হিসাব করা। স্কোর মানে নেট স্কোর: সঠিক থেকে প্রতি ভুলে ০.২৫ বাদ (ঢাবির নিয়ম)। প্রতিটি স্কিপে ১ মিনিট পেনাল্টি সময়ে যোগ হয়। স্কোর কম আর গতি ধীর হলে অধ্যায়টি তালিকায় উপরে আসে। বিষয় ও সার্বিক গতি আসল সিটিং সময় দিয়ে হিসাব করা; অধ্যায়ের গতি অধ্যায়ের সময় দিয়ে (পূর্ণ মিনিটে ধরা)। কোন প্রশ্নটি ভুল হয়েছে তা এখানে দেখা যায় না। অধ্যায়ের ভেতরের দুর্বল টপিক খুঁজতে খাতা দেখার সময় ভুল এমসিকিউগুলো চিহ্নিত করে রাখুন।",
      sep: "; ",
    },
    en: {
      empty: "No tests logged yet.",
      lead: (v) => `Based on <b>${v.n} chapter tests</b> in <b>${v.s} sittings</b> (${v.from} to ${v.to}). Overall net score <b>${v.score}%</b> (DU rule: ${v.neg} cut per wrong; ${v.raw}% without the cut). Overall speed <b>${v.sec} s</b> per MCQ (real sitting time; target ${v.tgt} s).`,
      early: "This is still a small amount of data, so treat it as an early picture.",
      hTrend: "MCQ: overall trend",
      noTrend: (v) => `No trend yet. A fair trend needs at least 2 sittings of the <b>same subject</b>. So far: ${v.list}. Comparing a Physics sitting with a Higher Math sitting would not show real growth.`,
      sitCount: (v) => `${v.paper} ${v.k} sitting${v.k > 1 ? "s" : ""}`,
      single: (v) => `<li><b>${v.paper}</b>: only ${v.k} sitting so far, so there is no trend yet. It will show after the next test.</li>`,
      scoreSame: (v) => `score stayed about the same (${v.a}% to ${v.b}%)`,
      scoreUp: (v) => `score went <span class="up">up</span> from ${v.a}% to ${v.b}%`,
      scoreDown: (v) => `score went <span class="down">down</span> from ${v.a}% to ${v.b}%`,
      secSame: (v) => `speed stayed about the same (${v.a} s to ${v.b} s per MCQ)`,
      secUp: (v) => `speed got <span class="up">faster</span> from ${v.a} s to ${v.b} s per MCQ`,
      secDown: (v) => `speed got <span class="down">slower</span> from ${v.a} s to ${v.b} s per MCQ`,
      trendLi: (v) => `<li><b>${v.paper}</b> (${v.k} sittings): ${v.score}; ${v.sec} (target ${v.tgt} s).</li>`,
      trendNote: "Trend compares the first and the latest sitting of each subject. Different chapters can be easier or harder, so read it as a rough direction.",
      hSubj: "MCQ: by subject",
      slowS: (v) => `<span class="down">${v.d} s slower</span> than target per MCQ`,
      fastS: `<span class="up">within target</span> speed`,
      subjLi: (v) => `<li><b>${v.paper}</b>: net score ${v.score}%, ${v.sec} s per MCQ (${v.speed}), ${v.w}% of answered MCQs wrong.</li>`,
      hFocus: "MCQ: where to focus first",
      rLow: (v) => `low score (${v.s}%): revise the theory and basic formulas first`,
      rMid: (v) => `score ${v.s}%: needs more practice`,
      rGood: (v) => `good score (${v.s}%)`,
      rSlow: (v) => `slow (${v.sec} s per MCQ, target ${v.tgt} s): do timed sets`,
      rWrong: (v) => `${v.w} of ${v.a} answered were wrong (${v.r}%): check doubtful MCQs before marking`,
      rSkip: (v) => `${v.k} skipped (${v.k} min penalty): find out which topics were left`,
      focusLi: (v) => `<li><b>${v.subj} Ch ${v.no}${v.name ? ": " + v.name : ""}</b> (${v.k} test${v.kn > 1 ? "s" : ""}). ${v.reasons}.${v.topics ? `<br><span class="topics">Revise: ${v.topics}.</span>` : ""}</li>`,
      vector: (v) => `Vector is in both Physics 1st Paper (Ch 2) and Higher Math 1st Paper (Ch 2). Score: Physics ${v.p}%, Higher Math ${v.h}%. The math is the same, so practise them together.${v.phyWeaker ? " In Physics, focus on the uses: river and boat, relative velocity, resolution of vectors." : ""}`,
      hLeft: "Not tested yet",
      hWritten: "Written exam: summary",
      wLead: (v) => `${v.got} out of ${v.full} (${v.p}%) in ${v.q} questions. At this rate DU's 40-mark written part would give about ${v.s40}. Pace: ${v.pace} min per question (target ${v.t}, about ${v.du} in the real exam).`,
      wLi: (v) => `<li><b>${v.ch}</b>: ${v.got}/${v.full} (${v.p}%)${v.mcq != null ? `; MCQ net score in the same chapter ${v.mcq}%` : ""}</li>`,
      wNote: "In written answers every step must be shown. If a chapter is fine in MCQ but low in written, the formulas are known but writing a full solution needs practice. Do at least 2-3 timed written questions every day.",
      leftLi: (v) => `<li><b>${v.paper}</b>: ${v.list}.</li>`,
      leftCh: (v) => `Ch ${v.no} ${v.name}`,
      noSecond: "<li>No 2nd Paper chapters (Physics or Higher Math) tested yet.</li>",
      how: "How this report is made: it is worked out from the logged MCQ results only (score, time and counts per chapter). Score means net score: 0.25 cut for each wrong answer (DU rule). Each skipped MCQ adds a 1 minute penalty to the time. Lower score and slower speed put a chapter higher in the focus list. Subject and overall speed use the real sitting time; chapter speed uses the chapter time (rounded up to a full minute). It cannot see which exact questions were wrong. To find the weak topic inside a chapter, mark the wrong MCQs during checking.",
      sep: "; ",
    },
  };

  window.buildReport = function (data, syllabus) {
    const I = window.I18N, L = I.lang, T = TX[L], n = I.num, f = I.f1;
    const S = data.sessions, tgt = data.target.sec_per_mcq;
    if (!S.length) return `<p>${T.empty}</p>`;
    const bn = L === "bn";
    const ch = (subj, no) => syllabus[subj]?.chapters?.[no];
    const name = (subj, no) => { const c = ch(subj, no); return c ? (bn ? c.name_bn || c.name : c.name) : ""; };
    const topics = (subj, no) => { const c = ch(subj, no); return c ? (bn ? c.topics_bn || c.topics : c.topics) : ""; };
    const paper = (subj) => (bn ? syllabus[subj]?.paper_bn : syllabus[subj]?.paper) || subj;

    // per chapter (all tests of the same chapter combined)
    const byCh = new Map();
    for (const r of S) { const k = r.subject + "|" + chNo(r.chapter); if (!byCh.has(k)) byCh.set(k, []); byCh.get(k).push(r); }
    const chapters = [...byCh.entries()].map(([k, rows]) => {
      const [subj, no] = k.split("|"); const a = aggregate(rows);
      const need = (100 - a.score) + 2 * Math.max(0, (a.sec ?? tgt) - tgt);   // lower score and slower speed both raise priority
      return { subj, no, rows, ...a, need };
    }).sort((x, y) => y.need - x.need);

    const subjects = [...new Set(S.map((r) => r.subject))].map((subj) => { const rows = S.filter((r) => r.subject === subj); return { subj, ...aggregate(rows), sec: realSec(rows) }; });
    const all = { ...aggregate(S), sec: realSec(S) };
    const sit = sittings(S);

    let html = `<p class="lead">${T.lead({ n: n(S.length), s: n(sit.length), from: I.date(S[0].date, false), to: I.date(S[S.length - 1].date),
      score: f(all.score), raw: f(all.raw), neg: n(data.target.negative_mark ?? 0.25), sec: f(all.sec), tgt: n(tgt) })} ${S.length < 8 ? T.early : ""}</p>`;

    // trend (only within the same subject)
    html += `<h3>${T.hTrend}</h3>`;
    const sitOf = (subj) => sit.filter((p) => p.subject === subj);
    if (!subjects.some((s) => sitOf(s.subj).length >= 2)) {
      html += `<p>${T.noTrend({ list: subjects.map((s) => T.sitCount({ paper: esc(paper(s.subj)), k: n(sitOf(s.subj).length) })).join(bn ? ", " : ", ") })}</p>`;
    } else {
      html += "<ul>";
      for (const s of subjects) {
        const pts = sitOf(s.subj);
        if (pts.length < 2) { html += T.single({ paper: esc(paper(s.subj)), k: n(pts.length) }); continue; }
        const a = pts[0], b = pts[pts.length - 1], ds = b.score - a.score, dsec = b.sec - a.sec;
        const sv = { a: f(a.score), b: f(b.score) }, tv = { a: f(a.sec), b: f(b.sec) };
        html += T.trendLi({ paper: esc(paper(s.subj)), k: n(pts.length), tgt: n(tgt),
          score: Math.abs(ds) < 2 ? T.scoreSame(sv) : ds > 0 ? T.scoreUp(sv) : T.scoreDown(sv),
          sec: Math.abs(dsec) < 2 ? T.secSame(tv) : dsec < 0 ? T.secUp(tv) : T.secDown(tv) });
      }
      html += `</ul><p class="note">${T.trendNote}</p>`;
    }

    // by subject
    html += `<h3>${T.hSubj}</h3><ul>`;
    for (const s of subjects) {
      html += T.subjLi({ paper: esc(paper(s.subj)), score: f(s.score), sec: f(s.sec), w: f(s.wrongRate),
        speed: s.sec > tgt ? T.slowS({ d: f(s.sec - tgt) }) : T.fastS });
    }
    html += "</ul>";

    // focus list
    html += `<h3>${T.hFocus}</h3><ol>`;
    for (const c of chapters) {
      const r = [];
      if (c.score < 60) r.push(T.rLow({ s: f(c.score) })); else if (c.score < 75) r.push(T.rMid({ s: f(c.score) })); else r.push(T.rGood({ s: f(c.score) }));
      if (c.sec > tgt) r.push(T.rSlow({ sec: f(c.sec), tgt: n(tgt) }));
      if (c.wrongRate > 25) r.push(T.rWrong({ w: n(c.wrong), a: n(c.answered), r: f(c.wrongRate) }));
      if (c.skipRate > 10) r.push(T.rSkip({ k: n(c.skipped) }));
      html += T.focusLi({ subj: esc(c.subj), no: n(c.no), name: esc(name(c.subj, c.no)), k: n(c.tests), kn: c.tests,
        reasons: r.join(T.sep), topics: c.score < 75 ? esc(topics(c.subj, c.no)) : "" });
    }
    html += "</ol>";

    // shared topic: Vector in P1 Ch 2 and HM1 Ch 2
    const pv = chapters.find((c) => c.subj === "P1" && c.no === "2"), hv = chapters.find((c) => c.subj === "HM1" && c.no === "2");
    if (pv && hv) html += `<p class="note">${T.vector({ p: f(pv.score), h: f(hv.score), phyWeaker: pv.score < hv.score })}</p>`;

    // written exam
    const W = data.written || [];
    if (W.length) {
      const got = W.reduce((a, w) => a + w.obtained, 0), full = W.reduce((a, w) => a + w.full_marks, 0), q = W.reduce((a, w) => a + w.questions, 0);
      const sitT = [...new Map(W.map((w) => [w.date + "|" + w.session_time_min, w.session_time_min])).values()].reduce((a, b) => a + b, 0);
      const wt = data.written_target || {}, du = wt.du_marks ? (wt.du_minutes / wt.du_marks) * W[0].marks_per_q : null;
      html += `<h3 class="h-written">${T.hWritten}</h3><p>${T.wLead({ q: n(q), got: n(got), full: n(full), p: f(100 * got / full), s40: f(40 * got / full), pace: f(sitT / q), t: n(wt.min_per_q), du: f(du) })}</p><ul>`;
      for (const w of W.slice().sort((a, b) => a.percentage - b.percentage)) {
        const mc = chapters.find((c) => c.subj === w.subject && c.no === chNo(w.chapter));
        html += T.wLi({ ch: `${esc(w.subject)} ${bn ? "অধ্যায়" : "Ch"} ${n(chNo(w.chapter))}: ${esc(name(w.subject, chNo(w.chapter)))}`, got: n(w.obtained), full: n(w.full_marks), p: f(w.percentage), mcq: mc ? f(mc.score) : null });
      }
      html += `</ul><p class="note">${T.wNote}</p>`;
    }

    // not tested yet
    const tested = new Set(chapters.map((c) => c.subj + "|" + c.no));
    html += `<h3>${T.hLeft}</h3><ul>`;
    for (const subj of ["P1", "P2", "HM1", "HM2"].filter((s) => Object.keys(syllabus[s]?.chapters || {}).length)) {
      const left = Object.keys(syllabus[subj].chapters).filter((no) => !tested.has(subj + "|" + no));
      if (left.length) html += T.leftLi({ paper: esc(paper(subj)), list: left.map((no) => T.leftCh({ no: n(no), name: esc(name(subj, no)) })).join(", ") });
    }
    if (!S.some((r) => r.subject === "P2" || r.subject === "HM2")) html += T.noSecond;
    html += `</ul><p class="how">${T.how}</p>`;
    return html;
  };
})();
