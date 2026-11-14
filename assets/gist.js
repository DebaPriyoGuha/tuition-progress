// Short, teasing "gist" shown in the popup (the full report stays on the page).
// Every line comes from the data; the tone is friendly tutor banter.
(function () {
  const chNo = (ch) => (String(ch).match(/\d+/) || [""])[0];
  const sum = (rows, k) => rows.reduce((a, r) => a + (Number(r[k]) || 0), 0);
  const G = {
    bn: {
      hello: (v) => `${v.name}, তোমার রিপোর্ট কার্ড রেডি! 📋`,
      weakLow: (v) => `${v.ch} এ ${v.s}%? এই স্কোরে ঢাবির সিট? স্বপ্নেও না! 😬`,
      weakMid: (v) => `${v.ch} এ মাত্র ${v.s}%। আরেকটু হলে তো ভালো ছাত্র বলা যেত! 😏`,
      weakGood: (v) => `সবচেয়ে খারাপ অধ্যায়েও ${v.s}% (${v.ch})। বাহ, ভাব নিও না কিন্তু! 😎`,
      vector: (v) => `ভেক্টর দুই বইতেই আছে, আর দুই জায়গাতেই ${v.max}% এর নিচে। তুমি তো দেখি ভেক্টর পারো না!! হা হা 😂`,
      slow: (v) => `${v.paper} এ প্রতি এমসিকিউতে ${v.sec} সেকেন্ড! টার্গেট ${v.tgt} সেকেন্ড। এত ধীরে দিলে পরীক্ষা শেষে অর্ধেক খাতা ফাঁকা থাকবে 🐢`,
      best: (v) => `${v.top} এ ${v.a}%, সাবাশ! তাহলে ${v.low} এ (${v.b}%) কি ঘুমাচ্ছিলে? 😴`,
      fast: (v) => `${v.paper} এ কিন্তু ${v.sec} সেকেন্ডে, টার্গেটের আগেই! এইটা ধরে রাখো 👏`,
      wrong: (v) => `উত্তর দেওয়া প্রতি ${v.k}টার মধ্যে ১টা ভুল! ঢাবিতে প্রতি ভুলে ${v.neg} কাটে, মানে এখন পর্যন্ত ${v.lost} নম্বর গায়েব। আন্দাজে ঢিল মারা বন্ধ করো 🎯`,
      skip: (v) => `${v.k}টা স্কিপ করে ${v.k} মিনিট পেনাল্টি খেয়েছ! না পারলে স্কিপ ঠিক আছে, কিন্তু পড়া বাদ দিও না 😤`,
      exam: (v) => `ঢাবি বিজ্ঞান ইউনিট পরীক্ষা ${v.date}। আর মাত্র ${v.d} দিন বাকি! ⏰`,
      task: (v) => `আজকের কাজ: ${v.ch} এর ২০টা এমসিকিউ, ১২ মিনিটে। পারবে তো? 💪`,
      more: "বিস্তারিত হিসাব পেজের নিচে \"সার্বিক রিপোর্ট\" এ আছে।",
      wSlow: (v) => `লিখিতে প্রতি প্রশ্নে ${v.p} মিনিট! টার্গেট ${v.t} মিনিট। এই গতিতে আসল পরীক্ষায় শেষের প্রশ্নগুলো ছুঁয়েও দেখা হবে না ⏳`,
      written: (v) => `লিখিত পরীক্ষায় ${v.full} এ মাত্র ${v.got}! ${v.ch} এ তো ${v.wf} এ ${v.wg} 🫠 MCQ তে টিক দেওয়া আর খাতায় অংক করা এক জিনিস না!`,
      full: "পুরো রিপোর্ট দেখুন", gistTitle: "এক নজরে",
      ch: (v) => `${v.subj} অধ্যায় ${v.no}${v.name ? " (" + v.name + ")" : ""}`,
    },
    en: {
      hello: (v) => `${v.name}, your report card is ready! 📋`,
      weakLow: (v) => `${v.s}% in ${v.ch}? A DU seat with this score? Only in your dreams! 😬`,
      weakMid: (v) => `Only ${v.s}% in ${v.ch}. A little more and we could call you a good student! 😏`,
      weakGood: (v) => `Even your worst chapter is ${v.s}% (${v.ch}). Nice, but don't show off! 😎`,
      vector: (v) => `Vector is in both books, and you are below ${v.max}% in both. Looks like you can't do Vector!! Haha 😂`,
      slow: (v) => `${v.sec} s per MCQ in ${v.paper}! Target is ${v.tgt} s. At this speed half the answer sheet stays empty 🐢`,
      best: (v) => `${v.a}% in ${v.top}, well done! So were you sleeping in ${v.low} (${v.b}%)? 😴`,
      fast: (v) => `But in ${v.paper} you did ${v.sec} s, faster than target! Keep it up 👏`,
      wrong: (v) => `1 in every ${v.k} answered MCQs is wrong! DU cuts ${v.neg} per wrong, so ${v.lost} marks gone so far. Stop guessing 🎯`,
      skip: (v) => `${v.k} skips = ${v.k} minutes of penalty! Skipping is fine, skipping study is not 😤`,
      exam: (v) => `DU Science Unit exam is on ${v.date}. Only ${v.d} days left! ⏰`,
      task: (v) => `Today's task: 20 MCQs from ${v.ch} in 12 minutes. Can you do it? 💪`,
      more: "The full numbers are in the \"Overall report\" at the bottom of the page.",
      wSlow: (v) => `${v.p} min per written question! Target is ${v.t} min. At this pace the last questions in the real exam won't even get touched ⏳`,
      written: (v) => `Only ${v.got} out of ${v.full} in the written test! ${v.ch}: ${v.wg} out of ${v.wf} 🫠 Ticking an MCQ and solving on paper are not the same thing!`,
      full: "See full report", gistTitle: "At a glance",
      ch: (v) => `${v.subj} Ch ${v.no}${v.name ? " (" + v.name + ")" : ""}`,
    },
  };

  window.buildGist = function (data, syllabus, profile) {
    const I = window.I18N, T = G[I.lang], n = I.num, f0 = (v) => n(Math.round(v));
    const S = data.sessions, tgt = data.target.sec_per_mcq, bn = I.lang === "bn";
    if (!S.length) return { title: T.gistTitle, html: "", full: T.full };
    const chName = (subj, no) => { const c = syllabus[subj]?.chapters?.[no]; return c ? (bn ? c.name_bn || c.name : c.name) : ""; };
    const paper = (subj) => (bn ? syllabus[subj]?.paper_bn : syllabus[subj]?.paper) || subj;
    const chText = (subj, no) => T.ch({ subj, no: n(no), name: chName(subj, no) });

    // per chapter
    const by = new Map();
    for (const r of S) { const k = r.subject + "|" + chNo(r.chapter); if (!by.has(k)) by.set(k, []); by.get(k).push(r); }
    const chs = [...by.entries()].map(([k, rows]) => {
      const [subj, no] = k.split("|"), c = sum(rows, "correct"), w = sum(rows, "wrong"), tot = sum(rows, "total");
      const score = tot ? 100 * sum(rows, "net_score") / tot : 0, sec = c + w ? sum(rows, "timing_min") * 60 / (c + w) : tgt;
      return { subj, no, score, sec, need: (100 - score) + 2 * Math.max(0, sec - tgt) };
    }).sort((a, b) => b.need - a.need);
    // per subject speed with the real sitting time
    const subjSpeed = [...new Set(S.map((r) => r.subject))].map((subj) => {
      const rows = S.filter((r) => r.subject === subj), seen = new Set(); let time = 0;
      for (const r of rows) { const k = (r.sitting != null ? r.date + "|#" + r.sitting : r.date + "|" + r.subject + "|" + r.session_time_min); if (!seen.has(k)) { seen.add(k); time += Number(r.session_time_min) || 0; } }
      const ans = sum(rows, "correct") + sum(rows, "wrong");
      const tot = sum(rows, "total");
      return { subj, sec: ans ? time * 60 / ans : null, score: tot ? 100 * sum(rows, "net_score") / tot : 0 };
    });

    const L = [];
    const w = chs[0];
    L.push(w.score < 60 ? T.weakLow({ ch: chText(w.subj, w.no), s: f0(w.score) })
      : w.score < 75 ? T.weakMid({ ch: chText(w.subj, w.no), s: f0(w.score) })
      : T.weakGood({ ch: chText(w.subj, w.no), s: f0(w.score) }));
    const pv = chs.find((c) => c.subj === "P1" && c.no === "2"), hv = chs.find((c) => c.subj === "HM1" && c.no === "2");
    if (pv && hv && pv.score < 75 && hv.score < 75) L.push(T.vector({ max: n(Math.ceil(Math.max(pv.score, hv.score) / 5) * 5) }));
    const bySc = [...subjSpeed].sort((a, b) => b.score - a.score), top = bySc[0], low = bySc[bySc.length - 1];
    if (bySc.length > 1 && top.score - low.score >= 10) L.push(T.best({ top: paper(top.subj), a: f0(top.score), low: paper(low.subj), b: f0(low.score) }));
    const slow = subjSpeed.filter((s) => s.sec > tgt).sort((a, b) => b.sec - a.sec)[0];
    if (slow) L.push(T.slow({ paper: paper(slow.subj), sec: f0(slow.sec), tgt: n(tgt) }));
    const fast = subjSpeed.filter((s) => s.sec !== null && s.sec <= tgt)[0];
    if (fast) L.push(T.fast({ paper: paper(fast.subj), sec: f0(fast.sec) }));
    const c = sum(S, "correct"), wr = sum(S, "wrong");
    const neg = data.target.negative_mark ?? 0.25;
    if (c + wr && wr / (c + wr) > 0.2) L.push(T.wrong({ k: n(Math.round((c + wr) / wr)), neg: n(neg), lost: n(wr * neg) }));
    const sk = sum(S, "skipped");
    if (sk > 0) L.push(T.skip({ k: n(sk) }));
    const WR = data.written || [];
    if (WR.length) {
      const got = sum(WR, "obtained"), full = sum(WR, "full_marks");
      if (got / full < 0.6) {
        const ww = WR.slice().sort((a, b) => a.percentage - b.percentage || b.full_marks - a.full_marks)[0];
        L.push(T.written({ got: n(got), full: n(full), ch: chText(ww.subject, chNo(ww.chapter)), wg: n(ww.obtained), wf: n(ww.full_marks) }));
      }
    }
    if (WR.length) {
      const lk = WR[WR.length - 1].date + "|" + WR[WR.length - 1].session_time_min, ls = WR.filter((r) => r.date + "|" + r.session_time_min === lk);
      const cq = ls.reduce((a, r) => a + (r.counted_questions ?? r.questions), 0);
      const pace = cq ? ls[0].session_time_min / cq : ls[0].session_time_min, wt = data.written_target?.min_per_q;
      if (wt && pace > wt + 0.2) L.push(T.wSlow({ p: I.f1(pace), t: n(wt) }));
    }
    L.push(T.task({ ch: chText(w.subj, w.no) }));
    if (profile.exam?.date) {
      const d = Math.ceil((new Date(profile.exam.date + "T11:00:00") - new Date()) / 86400000);
      if (d >= 0) L.unshift(T.exam({ date: I.date(profile.exam.date), d: n(d) }));
    }

    const esc = (s) => String(s).replace(/[&<>"]/g, (x) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[x]));
    const html = `<p class="gist-hello">${esc(T.hello({ name: profile.name.split(" ")[0] }))}</p>
      <ul class="gist">${L.map((l) => `<li>${esc(l)}</li>`).join("")}</ul><p class="how">${esc(T.more)}</p>`;
    return { title: T.gistTitle, html, full: T.full };
  };
})();
