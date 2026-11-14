"""Export one student's MCQ log from the Excel file into <student>/data.json.

Usage: python3 tools/export_student.py <path-to-xlsx> <student-folder>
Example: python3 tools/export_student.py ../Prince/DU_Prince_Timing.xlsx prince

Reads the 'Log' sheet (targets in B3/B4, table header on row 8) using the
values Excel saved (Python standard library only, no install needed), and writes only the session numbers. Profile details
live separately in <student>/profile.json and are never touched here.
"""
import datetime as dt
import json
import sys
from pathlib import Path

import re
import zipfile
import xml.etree.ElementTree as ET

NS = {"m": "http://schemas.openxmlformats.org/spreadsheetml/2006/main",
      "r": "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
      "pr": "http://schemas.openxmlformats.org/package/2006/relationships"}


def read_sheet(path, name):
    """Return {(row, col): value} for one sheet, using Excel's saved values (stdlib only)."""
    z = zipfile.ZipFile(path)
    shared = []
    if "xl/sharedStrings.xml" in z.namelist():
        for si in ET.fromstring(z.read("xl/sharedStrings.xml")).findall("m:si", NS):
            shared.append("".join(t.text or "" for t in si.iter(f"{{{NS['m']}}}t")))
    wb = ET.fromstring(z.read("xl/workbook.xml"))
    rid = next(s.get(f"{{{NS['r']}}}id") for s in wb.find("m:sheets", NS) if s.get("name") == name)
    rels = ET.fromstring(z.read("xl/_rels/workbook.xml.rels"))
    target = next(r.get("Target") for r in rels.findall("pr:Relationship", NS) if r.get("Id") == rid)
    target = target.lstrip("/")
    target = target if target.startswith("xl/") else "xl/" + target
    cells = {}
    for c in ET.fromstring(z.read(target)).iter(f"{{{NS['m']}}}c"):
        letters, row = re.match(r"([A-Z]+)(\d+)", c.get("r")).groups()
        colno = 0
        for ch in letters:
            colno = colno * 26 + ord(ch) - 64
        v, t = c.find("m:v", NS), c.get("t")
        if t == "inlineStr":
            val = "".join(x.text or "" for x in c.iter(f"{{{NS['m']}}}t"))
        elif v is None:
            continue
        elif t == "s":
            val = shared[int(v.text)]
        elif t in ("str", "e"):
            val = v.text
        elif t == "b":
            val = v.text == "1"
        else:
            val = float(v.text)
            val = int(val) if val.is_integer() else val
        cells[(int(row), colno)] = val
    return cells


xlsx, folder = Path(sys.argv[1]), Path(sys.argv[2])
cells = read_sheet(xlsx, "Log")
target_mcq, target_min = cells[(3, 2)], cells[(4, 2)]
min_per = target_min / target_mcq

ncols = max(c for _, c in cells)
head = [cells.get((8, c)) for c in range(1, ncols + 1)]
col = {h: i for i, h in enumerate(head) if h}
need = ["Date", "Subject", "Chapter", "Book", "Total MCQ", "Session Time (min)", "Correct", "Wrong", "Skipped",
        "Chapter Time (min)", "Skip Penalty (min)", "Total Time (min)", "Target Time (min)", "Slow by (min)",
        "Net Score", "Net %", "Raw %", "Sec per MCQ"]
missing = [h for h in need if h not in col]
if missing:
    sys.exit(f"Missing columns in Log sheet: {missing}")
num = lambda v: float(v) if isinstance(v, (int, float)) else None   # Excel-computed values; "" -> None

sessions = []
r = 9
while True:
    row = [cells.get((r, c)) for c in range(1, ncols + 1)]
    r += 1
    d = row[col["Date"]]
    if d is None:
        break
    if isinstance(d, (int, float)):
        d = dt.datetime(1899, 12, 30) + dt.timedelta(days=d)
    c, w, s = (int(row[col[k]] or 0) for k in ("Correct", "Wrong", "Skipped"))
    total = int(row[col["Total MCQ"]])
    if total != c + w + s:
        sys.exit(f"{d:%d %b %Y} {row[col['Subject']]} {row[col['Chapter']]}: Total MCQ {total} != Correct+Wrong+Skipped {c + w + s}. Fix the Excel row first.")
    g = lambda k: num(row[col[k]])
    net_pct, raw_pct, sec = g("Net %"), g("Raw %"), g("Sec per MCQ")
    sessions.append({
        "date": d.strftime("%Y-%m-%d"),
        "subject": row[col["Subject"]],
        "chapter": str(row[col["Chapter"]]),
        "book": row[col["Book"]],
        "total": total, "correct": c, "wrong": w, "skipped": s,
        "session_time_min": g("Session Time (min)"),
        "timing_min": g("Chapter Time (min)"),          # session time split by answered, rounded up
        "penalty_min": g("Skip Penalty (min)"),         # skipped x skip penalty
        "total_time_min": g("Total Time (min)"),        # chapter time + penalty
        "target_time_min": round(g("Target Time (min)"), 2),
        "slow_by_min": round(g("Slow by (min)"), 2),    # total time - target time
        "net_score": g("Net Score"),                    # correct - wrong x negative mark (DU)
        "percentage": round(100 * net_pct, 2) if net_pct is not None else None,     # main score = Net %
        "raw_percentage": round(100 * raw_pct, 2) if raw_pct is not None else None,
        "sec_per_mcq": round(sec, 1) if sec is not None else None,
        "notes": row[col["Notes"]] if "Notes" in col else None,
        "sitting": int(g("Sitting")) if "Sitting" in col and g("Sitting") is not None else None,   # sitting no. inside the day
    })

# Written exam practice (optional 'Written' sheet: targets in B2:B4, table header on row 7)
written, written_target = [], None
try:
    wc = read_sheet(xlsx, "Written")
except StopIteration:
    wc = None
if wc:
    wn = max(c for _, c in wc)
    wcol = {wc.get((7, c)): c for c in range(1, wn + 1) if wc.get((7, c))}
    wneed = ["Date", "Subject", "Chapter", "Book", "Questions", "Marks per Q", "Full Marks", "Marks Obtained", "Score %", "Session Time (min)", "Target Time (min)"]
    wmiss = [h for h in wneed if h not in wcol]
    if wmiss:
        sys.exit(f"Missing columns in Written sheet: {wmiss}")
    r = 8
    while wc.get((r, wcol["Date"])) is not None:
        G = lambda k: wc.get((r, wcol[k])) if k in wcol else None
        d = G("Date")
        if isinstance(d, (int, float)):
            d = dt.datetime(1899, 12, 30) + dt.timedelta(days=d)
        full, got = num(G("Full Marks")), num(G("Marks Obtained"))
        if got is not None and full and got > full:
            sys.exit(f"Written row {r}: marks obtained {got} > full marks {full}. Fix the Excel row first.")
        pct = num(G("Score %"))
        written.append({
            "date": d.strftime("%Y-%m-%d"), "subject": G("Subject"), "chapter": str(G("Chapter")), "book": G("Book"),
            "questions": int(G("Questions")), "marks_per_q": num(G("Marks per Q")), "full_marks": full, "obtained": got,
            "percentage": round(100 * pct, 2) if pct is not None else None,
            "session_time_min": num(G("Session Time (min)")), "target_time_min": num(G("Target Time (min)")),
            "zero_questions": int(num(G("Zero Questions")) or 0),
            "counted_questions": int(num(G("Counted Questions"))) if num(G("Counted Questions")) is not None else int(G("Questions")),
            "slow_by_min": num(G("Slow by (min)")),                      # sitting time - target for counted questions (sitting level)
            "sitting_pace": round(num(G("Sitting Pace (min per counted Q)")), 2) if num(G("Sitting Pace (min per counted Q)")) is not None else None,
            "notes": G("Notes"),
        })
        r += 1
    written_target = {"min_per_q": wc.get((2, 2)), "du_marks": wc.get((3, 2)), "du_minutes": wc.get((4, 2))}

out = {
    "updated": dt.date.today().isoformat(),
    "target": {"mcq": target_mcq, "minutes": target_min,
               "sec_per_mcq": round(min_per * 60, 1),
               "skip_penalty_min": cells.get((6, 2)), "negative_mark": cells.get((7, 2))},
    "sessions": sessions,
    "written_target": written_target,
    "written": written,
}
(folder / "data.json").write_text(json.dumps(out, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
print(f"Wrote {folder / 'data.json'}: {len(sessions)} MCQ session(s), {len(written)} written row(s)")
