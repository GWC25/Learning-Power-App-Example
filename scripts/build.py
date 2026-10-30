"""Build the generated files from scripts/content.py.

    python3 scripts/build.py

Writes lists/*.csv (SharePoint list imports) and app/index.html
(Power App mockup with the list data embedded).
"""
import csv, json, pathlib, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "scripts"))
import content as C  # noqa: E402

LISTS = ROOT / "lists"
LISTS.mkdir(exist_ok=True)


def write_csv(name, header, rows):
    with open(LISTS / name, "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(header)
        w.writerows(rows)


# --- Situations
write_csv("Situations.csv", ["SituationID", "Title", "Keywords", "SortOrder"],
          [[s[0], s[1], s[2], i + 1] for i, s in enumerate(C.SITUATIONS)])

# --- Building Blocks
order = {lvl: 0 for lvl in C.LEVELS}
rows = []
for b in C.BLOCKS:
    order[b[1]] += 1
    rows.append([b[0], b[1], b[2], b[3], order[b[1]]])
write_csv("BuildingBlocks.csv", ["BlockID", "Level", "Title", "Description", "SortOrder"], rows)

# --- Resource Cards, Card Steps, Card Links
card_rows, step_rows, link_rows = [], [], []
ids = {c["id"] for c in C.CARDS}
block_ids = {b[0] for b in C.BLOCKS}
sit_ids = {s[0] for s in C.SITUATIONS}
for c in C.CARDS:
    assert c["block"] in block_ids, c["id"]
    assert all(s in sit_ids for s in c["situations"]), c["id"]
    for k in ("up", "down"):
        assert not c[k] or c[k] in ids, (c["id"], k)
    for s in c.get("supports", []):
        assert s in ids, (c["id"], s)
    assert c["level"] in C.LEVELS and c["context"] in C.CONTEXTS, c["id"]
    v = c["video"] or {}
    keywords = " ".join(sorted({w for s in C.SITUATIONS if s[0] in c["situations"] for w in s[2].split()}))
    card_rows.append([
        c["id"], c["title"], c["level"], C.LEVELS.index(c["level"]) + 1, c["context"], c["block"], ",".join(c["situations"]),
        c["summary"], c["why"], c["frameworks"],
        v.get("title", ""), v.get("source", ""), v.get("url", ""), v.get("channel", ""),
        v.get("captions", ""), v.get("transcript", ""),
        "\n".join(c["watch"]), c["scenario"], c["answer"], c.get("prompt", ""),
        c["down"], c["up"], ",".join(c.get("supports", [])), keywords,
    ])
    for i, s in enumerate(c["steps"], 1):
        step_rows.append([c["id"], i, *s])
    for i, (kind, title, url) in enumerate(c["links"], 1):
        link_rows.append([c["id"], i, kind, title, url])

write_csv("ResourceCards.csv",
          ["CardID", "Title", "Level", "LevelOrder", "Context", "BlockID", "SituationIDs", "Summary", "WhyItWorks", "Frameworks",
           "VideoTitle", "VideoSource", "VideoLink", "VideoChannel", "CaptionsLink", "TranscriptLink",
           "WatchOutFor", "PracticeScenario", "PracticeAnswer", "PromptText",
           "StepDownID", "StepUpID", "SupportCardIDs", "Keywords"], card_rows)
write_csv("CardSteps.csv", ["CardID", "StepNo", "Action", "Traditional", "Digital", "Accessibility", "InclusivePractice"], step_rows)
write_csv("CardLinks.csv", ["CardID", "SortOrder", "LinkType", "Title", "URL"], link_rows)

# --- App data (same shape as the lists, so the mockup reads what Power Apps would read)
data = {
    "levels": C.LEVELS, "contexts": C.CONTEXTS, "levelIntro": C.LEVEL_INTRO, "pyramidNote": C.PYRAMID_NOTE,
    "situations": [{"id": s[0], "title": s[1], "kw": s[2]} for s in C.SITUATIONS],
    "blocks": [{"id": b[0], "level": b[1], "title": b[2], "desc": b[3]} for b in C.BLOCKS],
    "cards": [{
        "id": c["id"], "title": c["title"], "level": c["level"], "context": c["context"], "block": c["block"],
        "situations": c["situations"], "summary": c["summary"], "why": c["why"], "frameworks": c["frameworks"],
        "video": c["video"], "watch": c["watch"], "scenario": c["scenario"], "answer": c["answer"],
        "prompt": c.get("prompt", ""), "down": c["down"], "up": c["up"], "supports": c.get("supports", []),
        "steps": [{"action": s[0], "trad": s[1], "dig": s[2], "acc": s[3], "inc": s[4]} for s in c["steps"]],
        "links": [{"type": l[0], "title": l[1], "url": l[2]} for l in c["links"]],
        "kw": card_rows[i][-1],
    } for i, c in enumerate(C.CARDS)],
}
tpl = (ROOT / "app" / "template.html").read_text(encoding="utf-8")
assert "/*__DATA__*/" in tpl
out = tpl.replace("/*__DATA__*/", "const DATA = " + json.dumps(data, ensure_ascii=False) + ";")
(ROOT / "app" / "index.html").write_text(out, encoding="utf-8")
print(f"{len(C.CARDS)} cards, {len(step_rows)} steps, {len(link_rows)} links, {len(C.BLOCKS)} blocks, {len(C.SITUATIONS)} situations")
