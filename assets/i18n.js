// Language support: Bangla (default, Prince is Bangla medium) and English.
(function () {
  const BN_DIGITS = "০১২৩৪৫৬৭৮৯";
  const urlLang = new URLSearchParams(location.search).get("lang");   // e.g. ?lang=en to share a link in English
  const guardianMode = /^(guardian|g|1)$/i.test(new URLSearchParams(location.search).get("for") || "");
  const saved = urlLang || (guardianMode ? "bn" : null) || (() => { try { return localStorage.getItem("lang"); } catch (e) { return null; } })();
  const I = {
    lang: saved === "en" ? "en" : "bn",
    guardian: guardianMode,   // ?for=guardian : simple view for guardians (no popup, details folded)
    // Convert digits to Bangla digits in Bangla mode (text only; chart axes stay as numbers).
    num(v) { const s = String(v); return I.lang === "bn" ? s.replace(/[0-9]/g, (d) => BN_DIGITS[d]) : s; },
    f1(v) { return I.num((Math.round(v * 10) / 10).toFixed(1)); },
    date(iso, long = true) {
      const d = new Date(iso + "T00:00:00");
      if (I.lang === "bn") return d.toLocaleDateString("bn-BD", long ? { day: "numeric", month: "long", year: "numeric" } : { day: "numeric", month: "short" });
      return d.toLocaleDateString("en-GB", long ? { day: "numeric", month: "short", year: "numeric" } : { day: "numeric", month: "short" });
    },
    t(key, vars = {}) {
      const s = (STR[I.lang][key] ?? STR.en[key] ?? key);
      return typeof s === "function" ? s(vars) : s;
    },
    set(lang) { I.lang = lang; try { localStorage.setItem("lang", lang); } catch (e) {} },
  };

  const STR = {
    bn: {
      title: "এমসিকিউ ও লিখিত অগ্রগতি", partMcq: "এমসিকিউ (ঢাবি: ৬০ নম্বর, ৪৫ মিনিট)", wBadge: "লিখিত",
      wChart: "অধ্যায়ভিত্তিক লিখিত স্কোর", wChartHow: "পাওয়া নম্বর ÷ পূর্ণ নম্বর। বারের উপরে লেখা আছে কত পেয়েছে।", wAll: "সব লিখিত টেস্ট",
      sub: (v) => `টার্গেট গতি: ${v.mcq}টি এমসিকিউ ${v.min} মিনিটে (প্রতি এমসিকিউতে ${v.sec} সেকেন্ড)। স্কোর = নেট স্কোর: ঢাবির নিয়মে প্রতি ভুলে ${v.neg} কাটা। প্রতিটি স্কিপে ${v.pen} মিনিট পেনাল্টি সময়ে যোগ হয়। একসাথে একাধিক অধ্যায় দিলে সিটিংয়ের সময় উত্তর দেওয়া এমসিকিউর অনুপাতে ভাগ করে পূর্ণ মিনিটে ধরা হয়। সর্বশেষ আপডেট: ${v.date}।`,
      openReport: "শিক্ষার্থীর রিপোর্ট কার্ড",
      student: "শিক্ষার্থী", name: "নাম", target: "লক্ষ্য", subjects: "বিষয়", version: "মাধ্যম",
      ssc: "এসএসসি", hsc: "এইচএসসি", batch: "ব্যাচ", school: "স্কুল", college: "কলেজ", result: "ফলাফল",
      tTests: "এমসিকিউ টেস্ট", hTests: "প্রতি অধ্যায়ে একটি",
      tLatest: "সর্বশেষ নেট স্কোর", tAvg: "গড় নেট স্কোর", hAvg: "দেখানো সব অধ্যায়", tBest: "সর্বোচ্চ নেট স্কোর", hBest: "এখন পর্যন্ত সর্বোচ্চ",
      tSpeed: "সর্বশেষ গতি", hSpeed: (v) => `প্রতি এমসিকিউতে, টার্গেট ${v.sec} সেকেন্ড`,
      show: "দেখুন:", all: "সব বিষয়",
      cScore: "অধ্যায়ভিত্তিক নেট স্কোর", cScoreHow: "(সঠিক − ভুল × ০.২৫) ÷ মোট এমসিকিউ। বেশি হলে ভালো।",
      cSlow: "টার্গেটের চেয়ে কত মিনিট বেশি", cSlowHow: "স্কিপ পেনাল্টি সহ। ০ = টার্গেটে। কম হলে ভালো।",
      cCws: "সঠিক, ভুল ও স্কিপ", cCwsHow: "লক্ষ্য: সবুজ বেশি, লাল কম।",
      cSpeed: "প্রতি এমসিকিউতে সেকেন্ড", cSpeedHow: "শুধু উত্তর দেওয়ার গতি (পেনাল্টি ছাড়া)। রেখাটিকে ড্যাশ দেওয়া টার্গেট রেখায় নামিয়ে আনতে হবে।",
      ySc: "স্কোর (%)", yMin: "মিনিট", yN: "এমসিকিউ সংখ্যা", ySec: "সেকেন্ড",
      correct: "সঠিক", wrong: "ভুল", skipped: "স্কিপ",
      hScore: "নেট স্কোর", hSlow: "টার্গেটের চেয়ে বেশি", hSpd: "গতি", tgtLbl: (v) => `টার্গেট ${v.sec} সে.`,
      minUnit: "মিনিট", secUnit: "সে.",
      chLabel: (v) => `${v.date} ${v.subj} অ. ${v.no}`,
      chFull: (v) => `অধ্যায় ${v.no}${v.name ? ": " + v.name : ""}`,
      reportTitle: "সার্বিক রিপোর্ট (এমসিকিউ + লিখিত)", allTests: "সব এমসিকিউ টেস্ট",
      thDate: "তারিখ", thSubj: "বিষয়", thCh: "অধ্যায়", thTotal: "মোট", thTime: "সময়", thScore: "নেট স্কোর",
      thVs: "টার্গেটের তুলনায়", thPer: "প্রতি এমসিকিউ", thBook: "বই / নোট",
      ofSitting: (v) => `${v.s} মিনিটের সিটিং থেকে`, plusPen: (v) => `+ ${v.p} মিনিট পেনাল্টি`, rawLbl: (v) => `কাটা ছাড়া ${v.r}%`,
      exam: "পরীক্ষা", examVal: (v) => `${v.date} (আর ${v.d} দিন)`,
      slowBy: (v) => `${v.x} মিনিট বেশি`, fastBy: (v) => `${v.x} মিনিট কম`, onTarget: "টার্গেটে",
      footer: "P1 = পদার্থবিজ্ঞান ১ম পত্র, P2 = পদার্থবিজ্ঞান ২য় পত্র, HM1 = উচ্চতর গণিত ১ম পত্র, HM2 = উচ্চতর গণিত ২য় পত্র।",
      wTitle: "লিখিত পরীক্ষা (ঢাবি: ৪০ নম্বর, ৪৫ মিনিট)",
      wSub: (v) => `প্রতি প্রশ্নে ${v.m} নম্বর। টার্গেট: প্রতি প্রশ্নে ${v.t} মিনিট। যে প্রশ্নে শূন্য পেয়েছে সেটা "করা" ধরা হয় না, কিন্তু তার সময় গোনা হয় (পেনাল্টি)। আসল পরীক্ষায় ${v.dm} নম্বর ${v.dmin} মিনিটে, মানে প্রতি প্রশ্নে প্রায় ${v.du} মিনিট।`,
      wQ: "প্রশ্ন", wMarks: "নম্বর", thScore2: "স্কোর", wTime: "সময়",
      wTot: "মোট নম্বর", wTotH: (v) => `${v.f} এর মধ্যে, ${v.p}%`, wDu: "৪০ এ রূপান্তর", wDuH: "একই হারে ঢাবির ৪০ নম্বরে",
      wPace: "সর্বশেষ গতি", wPaceH: (v) => `মিনিট প্রতি প্রশ্নে (শূন্য পাওয়া প্রশ্ন বাদ দিয়ে), টার্গেট ${v.t}`, wSit: (v) => `${v.s} মিনিটে ${v.q}টি প্রশ্ন, এর মধ্যে ${v.z}টিতে শূন্য`,
      wSlowH: "সর্বশেষ সিটিং: যে প্রশ্নে শূন্য, তার সময় পেনাল্টি", wZero: (v) => `${v.z}টিতে শূন্য`,
      yPct: "স্কোর (%)",
      close: "বন্ধ করুন", seePage: "পুরো পেজ দেখুন", loadErr: "ডেটা লোড করা যায়নি",
    },
    en: {
      title: "MCQ and Written Progress", partMcq: "MCQ (DU: 60 marks, 45 min)", wBadge: "Written",
      wChart: "Written score per chapter", wChartHow: "Marks obtained ÷ full marks. The label on each bar shows the marks.", wAll: "All written tests",
      sub: (v) => `Target speed: ${v.mcq} MCQ in ${v.min} min (${v.sec} s per MCQ). Score = net score: DU rule, ${v.neg} cut per wrong answer. Each skipped MCQ adds a ${v.pen} min penalty to the time. When chapters are done together, the sitting time is split by MCQs answered and rounded up to a full minute. Last updated ${v.date}.`,
      openReport: "Student's report card",
      student: "Student", name: "Name", target: "Target", subjects: "Subjects", version: "Medium",
      ssc: "SSC", hsc: "HSC", batch: "Batch", school: "School", college: "College", result: "Result",
      tTests: "MCQ tests", hTests: "one per chapter",
      tLatest: "Latest net score", tAvg: "Average net score", hAvg: "all chapters shown", tBest: "Best net score", hBest: "highest so far",
      tSpeed: "Latest speed", hSpeed: (v) => `per MCQ, target ${v.sec} s`,
      show: "Show:", all: "All subjects",
      cScore: "Net score per chapter", cScoreHow: "(Correct − Wrong × 0.25) / Total MCQ. Higher is better.",
      cSlow: "Minutes slower than target", cSlowHow: "Includes the skip penalty. 0 = on target. Lower is better.",
      cCws: "Correct, wrong and skipped", cCwsHow: "Aim: more green, less red.",
      cSpeed: "Seconds per MCQ", cSpeedHow: "Answering speed only (no penalty). The line should come down to the dashed target.",
      ySc: "score (%)", yMin: "minutes", yN: "number of MCQs", ySec: "seconds",
      correct: "Correct", wrong: "Wrong", skipped: "Skipped",
      hScore: "Net score", hSlow: "Slow by", hSpd: "Speed", tgtLbl: (v) => `Target ${v.sec} s`,
      minUnit: "min", secUnit: "s",
      chLabel: (v) => `${v.date} ${v.subj} Ch ${v.no}`,
      chFull: (v) => `Ch ${v.no}${v.name ? ": " + v.name : ""}`,
      reportTitle: "Overall report (MCQ + written)", allTests: "All MCQ tests",
      thDate: "Date", thSubj: "Subject", thCh: "Chapter", thTotal: "Total", thTime: "Time", thScore: "Net score",
      thVs: "Speed vs target", thPer: "Per MCQ", thBook: "Book / Notes",
      ofSitting: (v) => `of ${v.s} min sitting`, plusPen: (v) => `+ ${v.p} min penalty`, rawLbl: (v) => `${v.r}% without cut`,
      exam: "Exam", examVal: (v) => `${v.date} (${v.d} days left)`,
      slowBy: (v) => `${v.x} min slow`, fastBy: (v) => `${v.x} min faster`, onTarget: "On target",
      footer: "P1 = Physics 1st Paper, P2 = Physics 2nd Paper, HM1 = Higher Math 1st Paper, HM2 = Higher Math 2nd Paper.",
      wTitle: "Written exam (DU: 40 marks, 45 min)",
      wSub: (v) => `${v.m} marks per question. Target: ${v.t} min per question. A question that got zero is not counted as done, but its time still counts (penalty). The real exam is ${v.dm} marks in ${v.dmin} min, about ${v.du} min per question.`,
      wQ: "Questions", wMarks: "Marks", thScore2: "Score", wTime: "Time",
      wTot: "Total marks", wTotH: (v) => `out of ${v.f}, ${v.p}%`, wDu: "Scaled to 40", wDuH: "same rate on DU's 40 marks",
      wPace: "Latest pace", wPaceH: (v) => `min per question (zero-mark questions not counted), target ${v.t}`, wSit: (v) => `${v.q} questions in ${v.s} min, ${v.z} got zero`,
      wSlowH: "latest sitting: time on zero-mark questions is a penalty", wZero: (v) => `${v.z} got zero`,
      yPct: "score (%)",
      close: "Close report", seePage: "See the full page", loadErr: "Could not load data",
    },
  };
  window.I18N = I;
})();
