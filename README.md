# Tuition progress pages

Static site (GitHub Pages). Each student has a folder with `profile.json` (written by hand) and `data.json` (generated from Excel).

Update a student after adding rows in Excel (save the Excel file first):

    python3 tools/export_student.py ../Prince/DU_Prince_Timing.xlsx prince

Preview locally: `python3 -m http.server 8000`, then open http://localhost:8000/prince/
