"""Download the team's Google Sheet tabs into data/*.csv, then rebuild the site data.

Run from the repo root:  python3 tools/sync_sheet.py          (download + build)
                         python3 tools/sync_sheet.py --check  (download, report differences, write nothing)
Only reads the sheet; it never changes it. The sheet must be shared as "Anyone with the link can view".
A GitHub Action (.github/workflows/venue-data.yml) runs this when someone clicks "Run workflow" and commits any changes.
"""
import csv, io, re, subprocess, sys, urllib.request, zipfile
import xml.etree.ElementTree as ET

SHEET_ID = "1QW8jezDjK2IZ13M2dSx2Gkv6WDSE3NCMrmlkE8jl2Jg"  # "Wedding Reception Project"
TABS = {  # sheet tab -> file
    "Venues": "data/venues.csv",
    "Venue sections": "data/venue-sections.csv",
}
REQUIRED = {"Venues": "Venue ID"}  # a column that only the new layout has; protects local data from an old-layout sheet
NS = {"m": "http://schemas.openxmlformats.org/spreadsheetml/2006/main",
      "r": "http://schemas.openxmlformats.org/officeDocument/2006/relationships"}


def col_index(ref):
    n = 0
    for ch in re.match(r"[A-Z]+", ref).group(0):
        n = n * 26 + ord(ch) - 64
    return n - 1


def read_workbook():
    url = f"https://docs.google.com/spreadsheets/d/{SHEET_ID}/export?format=xlsx"
    data = urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": "venue-sync"}), timeout=60).read()
    z = zipfile.ZipFile(io.BytesIO(data))
    shared = []
    if "xl/sharedStrings.xml" in z.namelist():
        for si in ET.fromstring(z.read("xl/sharedStrings.xml")).findall("m:si", NS):
            shared.append("".join(t.text or "" for t in si.iter(f"{{{NS['m']}}}t")))
    rels = {r.get("Id"): r.get("Target") for r in ET.fromstring(z.read("xl/_rels/workbook.xml.rels"))}
    tabs = {}
    for s in ET.fromstring(z.read("xl/workbook.xml")).find("m:sheets", NS):
        path = "xl/" + rels[s.get(f"{{{NS['r']}}}id")].lstrip("/").replace("xl/", "")
        rows = []
        for row in ET.fromstring(z.read(path)).iter(f"{{{NS['m']}}}row"):
            cells = {}
            for c in row.findall("m:c", NS):
                v = c.find("m:v", NS)
                t = c.get("t")
                if t == "s" and v is not None:
                    val = shared[int(v.text)]
                elif t == "inlineStr":
                    val = "".join(x.text or "" for x in c.iter(f"{{{NS['m']}}}t"))
                elif t == "b" and v is not None:
                    val = "TRUE" if v.text == "1" else "FALSE"
                else:
                    val = v.text if v is not None else ""
                    if re.fullmatch(r"-?\d+\.0", val or ""):
                        val = val[:-2]
                cells[col_index(c.get("r"))] = val
            if cells:
                rows.append([cells.get(i, "") for i in range(max(cells) + 1)])
        width = len(rows[0]) if rows else 0
        tabs[s.get("name")] = [r + [""] * (width - len(r)) for r in rows]
    return tabs


def main():
    check = "--check" in sys.argv
    tabs = read_workbook()
    changed = []
    for tab, path in TABS.items():
        if tab not in tabs:
            print(f"skip: the sheet has no '{tab}' tab yet")
            continue
        rows = tabs[tab]
        need = REQUIRED.get(tab)
        if need and (not rows or need not in rows[0]):
            sys.exit(f"stop: the sheet's '{tab}' tab has no '{need}' column (old layout). Import the new tab first; nothing was written.")
        rows = [r for r in rows if any(x.strip() for x in r)]
        buf = io.StringIO()
        csv.writer(buf, lineterminator="\n").writerows(rows)
        new = buf.getvalue()
        try:
            old = open(path, encoding="utf-8", newline="").read().replace("\r\n", "\n")
        except FileNotFoundError:
            old = ""
        if new != old:
            changed.append(path)
            if not check:
                open(path, "w", encoding="utf-8", newline="").write(new)
    print(("would change: " if check else "updated: ") + (", ".join(changed) or "nothing"))
    if changed and not check:
        subprocess.run([sys.executable, "tools/build_data.py"], check=True)


main()
