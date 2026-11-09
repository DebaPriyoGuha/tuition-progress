// Language support: Bangla (default, Prince is Bangla medium) and English.
(function () {
  const BN_DIGITS = "০১২৩৪৫৬৭৮৯";
  const urlLang = new URLSearchParams(location.search).get("lang");   // e.g. ?lang=en to share a link in English
  const saved = urlLang || (() => { try { return localStorage.getItem("lang"); } catch (e) { return null; } })();
  const I = {
    lang: saved === "en" ? "en" : "bn",
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
      title: "এমসিকিউ অগ্রগতি",
      sub: (v) => `টার্গেট গতি: ${v.mcq}টি এমসিকিউ ${v.min} মিনিটে (প্রতি এমসিকিউতে ${v.sec} সেকেন্ড)। স্কিপ করা এমসিকিউ সময়ের হিসাবে ধরা হয় না। একসাথে একাধিক অধ্যায় দিলে মোট সময় উত্তর দেওয়া এমসিকিউর অনুপাতে ভাগ করে পূর্ণ মিনিটে ধরা হয়। সর্বশেষ আপডেট: ${v.date}।`,
      openReport: "সার্বিক রিপোর্ট দেখুন",
      student: "শিক্ষার্থী", name: "নাম", target: "লক্ষ্য", subjects: "বিষয়", version: "ভার্সন",
      ssc: "এসএসসি", hsc: "এইচএসসি", batch: "ব্যাচ", school: "স্কুল", college: "কলেজ", result: "ফলাফল",
      tTests: "অধ্যায়ভিত্তিক টেস্ট", hTests: "প্রতি অধ্যায়ে একটি",
      tLatest: "সর্বশেষ স্কোর", tAvg: "গড় স্কোর", hAvg: "দেখানো সব অধ্যায়", tBest: "সর্বোচ্চ স্কোর", hBest: "এখন পর্যন্ত সর্বোচ্চ",
      tSpeed: "সর্বশেষ গতি", hSpeed: (v) => `প্রতি এমসিকিউতে, টার্গেট ${v.sec} সেকেন্ড`,
      show: "দেখুন:", all: "সব বিষয়",
      cScore: "অধ্যায়ভিত্তিক স্কোর", cScoreHow: "সঠিক ÷ মোট এমসিকিউ। বেশি হলে ভালো।",
      cSlow: "টার্গেটের চেয়ে কত মিনিট বেশি", cSlowHow: "০ = টার্গেটে। কম হলে ভালো।",
      cCws: "সঠিক, ভুল ও স্কিপ", cCwsHow: "লক্ষ্য: সবুজ বেশি, লাল কম।",
      cSpeed: "প্রতি এমসিকিউতে সেকেন্ড", cSpeedHow: "রেখাটিকে ড্যাশ দেওয়া টার্গেট রেখায় নামিয়ে আনতে হবে।",
      ySc: "স্কোর (%)", yMin: "মিনিট", yN: "এমসিকিউ সংখ্যা", ySec: "সেকেন্ড",
      correct: "সঠিক", wrong: "ভুল", skipped: "স্কিপ",
      hScore: "স্কোর", hSlow: "টার্গেটের চেয়ে বেশি", hSpd: "গতি", tgtLbl: (v) => `টার্গেট ${v.sec} সে.`,
      minUnit: "মিনিট", secUnit: "সে.",
      chLabel: (v) => `${v.date} ${v.subj} অ. ${v.no}`,
      chFull: (v) => `অধ্যায় ${v.no}${v.name ? ": " + v.name : ""}`,
      reportTitle: "সার্বিক রিপোর্ট", allTests: "সব অধ্যায়ভিত্তিক টেস্ট",
      thDate: "তারিখ", thSubj: "বিষয়", thCh: "অধ্যায়", thTotal: "মোট", thTime: "সময়", thScore: "স্কোর",
      thVs: "টার্গেটের তুলনায়", thPer: "প্রতি এমসিকিউ", thBook: "বই / নোট",
      ofSitting: (v) => `${v.s} মিনিটের সিটিং থেকে`,
      slowBy: (v) => `${v.x} মিনিট বেশি`, fastBy: (v) => `${v.x} মিনিট কম`, onTarget: "টার্গেটে",
      footer: "P1 = পদার্থবিজ্ঞান ১ম পত্র, P2 = পদার্থবিজ্ঞান ২য় পত্র, HM1 = উচ্চতর গণিত ১ম পত্র, HM2 = উচ্চতর গণিত ২য় পত্র।",
      close: "বন্ধ করুন", seePage: "পুরো পেজ দেখুন", loadErr: "ডেটা লোড করা যায়নি",
    },
    en: {
      title: "MCQ Progress",
      sub: (v) => `Target speed: ${v.mcq} MCQ in ${v.min} min (${v.sec} s per MCQ). Skipped MCQs do not count for time. When chapters are done together, the time is split by MCQs answered and rounded up to a full minute. Last updated ${v.date}.`,
      openReport: "Open overall report",
      student: "Student", name: "Name", target: "Target", subjects: "Subjects", version: "Version",
      ssc: "SSC", hsc: "HSC", batch: "Batch", school: "School", college: "College", result: "Result",
      tTests: "Chapter tests", hTests: "one per chapter",
      tLatest: "Latest score", tAvg: "Average score", hAvg: "all chapters shown", tBest: "Best score", hBest: "highest so far",
      tSpeed: "Latest speed", hSpeed: (v) => `per MCQ, target ${v.sec} s`,
      show: "Show:", all: "All subjects",
      cScore: "Score per chapter", cScoreHow: "Correct / Total MCQ. Higher is better.",
      cSlow: "Minutes slower than target", cSlowHow: "0 = on target. Lower is better.",
      cCws: "Correct, wrong and skipped", cCwsHow: "Aim: more green, less red.",
      cSpeed: "Seconds per MCQ", cSpeedHow: "The line should come down to the dashed target.",
      ySc: "score (%)", yMin: "minutes", yN: "number of MCQs", ySec: "seconds",
      correct: "Correct", wrong: "Wrong", skipped: "Skipped",
      hScore: "Score", hSlow: "Slow by", hSpd: "Speed", tgtLbl: (v) => `Target ${v.sec} s`,
      minUnit: "min", secUnit: "s",
      chLabel: (v) => `${v.date} ${v.subj} Ch ${v.no}`,
      chFull: (v) => `Ch ${v.no}${v.name ? ": " + v.name : ""}`,
      reportTitle: "Overall report", allTests: "All chapter tests",
      thDate: "Date", thSubj: "Subject", thCh: "Chapter", thTotal: "Total", thTime: "Time", thScore: "Score",
      thVs: "Speed vs target", thPer: "Per MCQ", thBook: "Book / Notes",
      ofSitting: (v) => `of ${v.s} min sitting`,
      slowBy: (v) => `${v.x} min slow`, fastBy: (v) => `${v.x} min faster`, onTarget: "On target",
      footer: "P1 = Physics 1st Paper, P2 = Physics 2nd Paper, HM1 = Higher Math 1st Paper, HM2 = Higher Math 2nd Paper.",
      close: "Close report", seePage: "See the full page", loadErr: "Could not load data",
    },
  };
  window.I18N = I;
})();
