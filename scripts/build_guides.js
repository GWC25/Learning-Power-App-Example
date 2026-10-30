// Turns library/how-to/*.md into accessible Word documents in library/guides/.
// Run: node scripts/build_guides.js
const fs = require('fs'), path = require('path');
const { Document, Packer, Paragraph, TextRun, HeadingLevel, ExternalHyperlink, LevelFormat, AlignmentType } = require('docx');
const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'library/how-to'), OUT = path.join(ROOT, 'library/guides');

function inline(text) {
  // **bold**, *italic*, `code`, [label](url)
  const runs = []; const re = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;
  let last = 0, m;
  while ((m = re.exec(text))) {
    if (m.index > last) runs.push(new TextRun(text.slice(last, m.index)));
    const t = m[0];
    if (t.startsWith('**')) runs.push(new TextRun({ text: t.slice(2, -2), bold: true }));
    else if (t.startsWith('`')) runs.push(new TextRun({ text: t.slice(1, -1) }));
    else if (t.startsWith('[')) {
      const [, label, url] = t.match(/\[([^\]]+)\]\(([^)]+)\)/);
      if (/^https?:/.test(url)) runs.push(new ExternalHyperlink({ link: url, children: [new TextRun({ text: label, style: 'Hyperlink' })] }));
      else runs.push(new TextRun(label));
    } else runs.push(new TextRun({ text: t.slice(1, -1), italics: true }));
    last = m.index + t.length;
  }
  if (last < text.length) runs.push(new TextRun(text.slice(last)));
  return runs;
}

function convert(md, name) {
  md = md.split('\n---\n')[0];              // drop the repository footer
  const kids = []; let title = name, numRef = 0;
  for (const raw of md.split('\n')) {
    const line = raw.trimEnd();
    if (!line.trim()) continue;
    if (line.startsWith('# ')) { title = line.slice(2); kids.push(new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(title)] })); continue; }
    if (/^\*How-to guide/.test(line)) { kids.push(new Paragraph({ children: [new TextRun({ text: 'How-to guide · Learning Studio', italics: true })] })); continue; }
    if (line.startsWith('### ')) { kids.push(new Paragraph({ heading: HeadingLevel.HEADING_3, children: inline(line.slice(4)) })); continue; }
    if (line.startsWith('## ')) { numRef++; kids.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: inline(line.slice(3)) })); continue; }
    let m;
    if ((m = line.match(/^\d+\.\s+(.*)/))) { kids.push(new Paragraph({ numbering: { reference: 'steps', level: 0, instance: numRef }, children: inline(m[1]) })); continue; }
    if ((m = line.match(/^[-*]\s+(.*)/))) { kids.push(new Paragraph({ numbering: { reference: 'bullets', level: 0 }, children: inline(m[1]) })); continue; }
    if (line.startsWith('This guide is also the text alternative')) {
      kids.push(new Paragraph({ children: [new TextRun('This guide is also the text alternative for the short video that goes with it, which has no sound.')] })); continue; }
    kids.push(new Paragraph({ children: inline(line) }));
  }
  return new Document({
    title, creator: 'Learning Studio', description: `How-to guide: ${title}`,
    styles: {
      default: { document: { run: { font: 'Arial', size: 24, language: { value: 'en-GB' } }, paragraph: { spacing: { after: 160, line: 300 } } } },
      paragraphStyles: [
        { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 40, bold: true, color: '1F3864' }, paragraph: { spacing: { after: 120 }, outlineLevel: 0 } },
        { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 30, bold: true, color: '1F3864' }, paragraph: { spacing: { before: 320, after: 120 }, outlineLevel: 1 } },
        { id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 26, bold: true, color: '1F3864' }, paragraph: { spacing: { before: 240, after: 100 }, outlineLevel: 2 } },
      ],
    },
    numbering: { config: [
      { reference: 'steps', levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: 'bullets', levels: [{ level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
    ] },
    sections: [{ properties: { page: { margin: { top: 1134, bottom: 1134, left: 1134, right: 1134 } } }, children: kids }],
  });
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  for (const f of fs.readdirSync(SRC).filter(f => f.endsWith('.md'))) {
    const name = f.replace(/\.md$/, '');
    const buf = await Packer.toBuffer(convert(fs.readFileSync(path.join(SRC, f), 'utf8'), name));
    fs.writeFileSync(path.join(OUT, name + '.docx'), buf);
  }
  console.log('guides written:', fs.readdirSync(OUT).length);
})();
