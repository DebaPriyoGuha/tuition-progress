// Guardian summary: very short, plain-language status card at the top of the page.
// Every line comes from data.json. Colour is never the only signal: each light also has a word.
(function () {
  const chNo = (ch) => (String(ch).match(/\d+/) || [""])[0];
  const sum = (rows, k) => rows.reduce((a, r) => a + (Number(r[k]) || 0), 0);
  const G = {
    bn: {
      title: "অভিভাবকের জন্য: এক নজরে",
      exam: (v) => `ঢাবি বিজ্ঞান ইউনিট পরীক্ষা: <b>${v.date}</b>। হাতে আছে <b>আর ${v.d} দিন</b>।`,
      overall: "সার্বিক অবস্থা",
      good: "ভালো", mid: "মোটামুটি", weak: "দুর্বল",
      onTime: "সময়মতো", bitSlow: "একটু ধীর", slow: "অনেক ধীর",
      mcq: "এমসিকিউ (৬০ নম্বরের অংশ)", written: "লিখিত (৪০ নম্বরের অংশ)",
      mcqSpeed: "এমসিকিউর গতি", writtenSpeed: "লিখিতের গতি",
      of100: (v) => `১০০ তে <b>${v.s}</b>`,
      mcqSpeedV: (v) => `প্রতিটায় ${v.s} সেকেন্ড (দরকার ${v.t})`,
      wSpeedV: (v) => `প্রতিটায় ${v.s} মিনিট (দরকার ${v.t})`,
      sumGood: "ভালো চলছে। এভাবে ধরে রাখতে হবে।",
      sumMid: (v) => `মোটামুটি চলছে। সবচেয়ে বেশি কাজ দরকার: ${v.list}।`,
      sumWeak: (v) => `এখনো অনেক কাজ বাকি। সবচেয়ে বেশি কাজ দরকার: ${v.list}।`,
      join: " আর ",
      weakCh: "যে অধ্যায়গুলো সবচেয়ে দুর্বল",
      chLine: (v) => `${v.paper}: ${v.name}`,
      effort: (v) => `এ পর্যন্ত <b>${v.days} দিনে</b> ${v.mcq}টি এমসিকিউ টেস্ট আর ${v.wr}টি লিখিত পরীক্ষা দিয়েছে।`,
      daily: "প্রতিদিন যা করা দরকার",
      dailyV: (v) => `${v.mcq}টি এমসিকিউ ${v.min} মিনিটে, আর অন্তত ৩টি লিখিত প্রশ্ন সময় ধরে (প্রতিটা ${v.w} মিনিটে)।`,
      legend: "রঙের মানে: সবুজ = ভালো (৭৫ বা বেশি), হলুদ = মোটামুটি (৬০ থেকে ৭৫), লাল = দুর্বল (৬০ এর নিচে)।",
      more: "সব বিস্তারিত দেখুন ↓", less: "বিস্তারিত লুকান ↑",
      updated: (v) => `সর্বশেষ আপডেট: ${v.d}`,
    },
    en: {
      title: "For guardians: at a glance",
      exam: (v) => `DU Science Unit exam: <b>${v.date}</b>. <b>${v.d} days</b> left.`,
      overall: "Overall",
      good: "Good", mid: "Fair", weak: "Weak",
      onTime: "On time", bitSlow: "A bit slow", slow: "Too slow",
      mcq: "MCQ (60-mark part)", written: "Written (40-mark part)",
      mcqSpeed: "MCQ speed", writtenSpeed: "Written speed",
      of100: (v) => `<b>${v.s}</b> out of 100`,
      mcqSpeedV: (v) => `${v.s} s each (needs ${v.t})`,
      wSpeedV: (v) => `${v.s} min each (needs ${v.t})`,
      sumGood: "Going well. Keep it up.",
      sumMid: (v) => `Fair. Needs the most work: ${v.list}.`,
      sumWeak: (v) => `A lot of work is still needed. Needs the most work: ${v.list}.`,
      join: " and ",
      weakCh: "Weakest chapters",
      chLine: (v) => `${v.paper}: ${v.name}`,
      effort: (v) => `So far: <b>${v.days} days</b>, ${v.mcq} MCQ tests and ${v.wr} written tests.`,
      daily: "What to do every day",
      dailyV: (v) => `${v.mcq} MCQs in ${v.min} minutes, and at least 3 timed written questions (${v.w} minutes each).`,
      legend: "Colours: green = good (75 or more), yellow = fair (60 to 75), red = weak (below 60).",
      more: "See all details ↓", less: "Hide details ↑",
      updated: (v) => `Last updated: ${v.d}`,
    },
  };

  window.buildGuardian = function (data, syllabus, profile) {
    const I = window.I18N, T = G[I.lang], n = I.num, bn = I.lang === "bn";
    const S = data.sessions || [], W = data.written || [];
    const lvl = (p) => (p >= 75 ? "good" : p >= 60 ? "mid" : "weak");
    const light = (k, word) => `<span class="gl gl-${k}" aria-hidden="true"></span><span class="gw gw-${k}">${word}</span>`;
    const rows = [];
    const need = [];

    // MCQ score and speed (real sitting time, same rule as the report)
    if (S.length) {
      const score = 100 * sum(S, "net_score") / sum(S, "total");
      const sit = new Map(S.map((r) => [r.date + "|" + r.subject + "|" + r.session_time_min, Number(r.session_time_min) || 0]));
      const sec = [...sit.values()].reduce((a, b) => a + b, 0) * 60 / (sum(S, "correct") + sum(S, "wrong"));
      const tgt = data.target.sec_per_mcq;
      const sp = sec <= tgt ? "good" : sec <= tgt * 1.25 ? "mid" : "weak";
      rows.push([T.mcq, lvl(score), T[lvl(score)], T.of100({ s: n(Math.round(score)) })]);
      rows.push([T.mcqSpeed, sp, sp === "good" ? T.onTime : sp === "mid" ? T.bitSlow : T.slow, T.mcqSpeedV({ s: n(Math.round(sec)), t: n(tgt) })]);
      if (lvl(score) !== "good") need.push(bn ? "এমসিকিউর নম্বর" : "MCQ marks");
      if (sp !== "good") need.push(bn ? "এমসিকিউর গতি" : "MCQ speed");
    }
    // Written score and pace (zero-mark questions are not counted as done)
    if (W.length) {
      const score = 100 * sum(W, "obtained") / sum(W, "full_marks");
      const sit = new Map(W.map((w) => [w.date + "|" + w.session_time_min, Number(w.session_time_min) || 0]));
      const cq = W.reduce((a, w) => a + (w.counted_questions ?? w.questions), 0);
      const pace = [...sit.values()].reduce((a, b) => a + b, 0) / Math.max(cq, 1);
      const tgt = data.written_target?.min_per_q || 2.5;
      const sp = pace <= tgt ? "good" : pace <= tgt * 1.4 ? "mid" : "weak";
      rows.push([T.written, lvl(score), T[lvl(score)], T.of100({ s: n(Math.round(score)) })]);
      rows.push([T.writtenSpeed, sp, sp === "good" ? T.onTime : sp === "mid" ? T.bitSlow : T.slow, T.wSpeedV({ s: I.f1(pace), t: n(tgt) })]);
      if (lvl(score) !== "good") need.push(bn ? "লিখিতের নম্বর" : "written marks");
      if (sp !== "good") need.push(bn ? "লিখিতের গতি" : "written speed");
    }
    const levels = rows.map((r) => r[1]);
    const overall = levels.includes("weak") ? "weak" : levels.includes("mid") ? "mid" : "good";
    const list = need.length > 1 ? need.slice(0, -1).join(", ") + T.join + need[need.length - 1] : need.join("");
    const summary = overall === "good" ? T.sumGood : (overall === "mid" ? T.sumMid : T.sumWeak)({ list });

    // weakest chapters: lowest of MCQ net % and written % per chapter
    const by = new Map();
    const add = (subj, ch, p) => { const k = subj + "|" + chNo(ch); by.set(k, Math.min(by.get(k) ?? 101, p)); };
    const mcqCh = new Map();
    for (const r of S) { const k = r.subject + "|" + chNo(r.chapter); const a = mcqCh.get(k) || { n: 0, t: 0 }; a.n += r.net_score; a.t += r.total; mcqCh.set(k, a); }
    for (const [k, a] of mcqCh) { const [s, c] = k.split("|"); add(s, c, 100 * a.n / a.t); }
    const wCh = new Map();
    for (const w of W) { const k = w.subject + "|" + chNo(w.chapter); const a = wCh.get(k) || { g: 0, f: 0 }; a.g += w.obtained; a.f += w.full_marks; wCh.set(k, a); }
    for (const [k, a] of wCh) { const [s, c] = k.split("|"); add(s, c, 100 * a.g / a.f); }
    const weak = [...by.entries()].sort((a, b) => a[1] - b[1]).slice(0, 3).map(([k]) => {
      const [s, c] = k.split("|"), ch = syllabus[s]?.chapters?.[c];
      return T.chLine({ paper: (bn ? syllabus[s]?.paper_bn : syllabus[s]?.paper) || s, name: ch ? (bn ? ch.name_bn || ch.name : ch.name) : c });
    });

    const days = new Set([...S.map((r) => r.date), ...W.map((w) => w.date)]).size;
    const wSits = new Set(W.map((w) => w.date + "|" + w.session_time_min)).size;
    let examLine = "";
    if (profile.exam?.date) {
      const d = Math.ceil((new Date(profile.exam.date + "T11:00:00") - new Date()) / 86400000);
      if (d >= 0) examLine = `<p class="g-exam">${T.exam({ date: I.date(profile.exam.date), d: n(d) })}</p>`;
    }
    const tr = rows.map(([label, k, word, value]) => `<tr><th scope="row">${label}</th><td class="g-light">${light(k, word)}</td><td>${value}</td></tr>`).join("");
    return `
      <h2>${T.title}</h2>
      ${examLine}
      <div class="g-overall g-${overall}"><span class="g-ov-label">${T.overall}:</span> ${light(overall, T[overall])}<p>${summary}</p></div>
      <table class="g-table">${tr}</table>
      <h3>${T.weakCh}</h3>
      <ol class="g-weak">${weak.map((w) => `<li>${w}</li>`).join("")}</ol>
      <h3>${T.daily}</h3>
      <p class="g-daily">${T.dailyV({ mcq: n(data.target.mcq), min: n(data.target.minutes), w: n(data.written_target?.min_per_q || 2.5) })}</p>
      <p class="g-effort">${T.effort({ days: n(days), mcq: n(S.length), wr: n(wSits) })}</p>
      <p class="g-small">${T.legend} ${T.updated({ d: I.date(data.updated) })}</p>`;
  };
  window.GUARDIAN_TX = G;
})();
