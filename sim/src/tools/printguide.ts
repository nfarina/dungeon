// Printable floor guidebook.
//   bun run printguide [floor-1]   ->  ../floor-1.print.html
// A standalone page styled like the map editor's Guide view, with page breaks,
// running footers and a forced light palette for paper. The markdown renderer is
// lifted out of mapedit.html so both views always agree on what the guide says.
const ROOT = new URL("../..", import.meta.url).pathname;   // sim/
const name = process.argv[2] ?? "floor-1";
if (!/^[a-z0-9-]+$/i.test(name)) throw new Error(`bad doc name: ${name}`);

const editor = await Bun.file(`${ROOT}src/tools/mapedit.html`).text();
const src = editor.match(/function mdInline\([\s\S]*?\nfunction mdToHtml\([\s\S]*?\n}\n/)?.[0];
if (!src) throw new Error("couldn't find mdInline/mdToHtml in mapedit.html");
const esc = (s: unknown) => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
const mdToHtml = new Function("esc", `${src}; return mdToHtml;`)(esc) as (md: string) => string;

const md = await Bun.file(`${ROOT}../${name}.md`).text();
const title = md.match(/^#\s+(.*)$/m)?.[1].replace(/[*`"]/g, "") ?? name;

// Every "---" in the guide sits right before a new section, and each section starts a page in print.
const body = mdToHtml(md).replace(/<hr>\n(?=<h2>)/g, "");

const page = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap">
<style>
:root{
  --paper:#eceee7; --surface:#fbfbf8; --sunk:#e3e6dc; --ink:#171a16; --ink-2:#3d443a;
  --muted:#6c7268; --line:#d3d7ca; --line-2:#bcc1b1; --amber:#a8710d; --amber-soft:#f0e2c2;
}
@media screen and (prefers-color-scheme:dark){:root{
  --paper:#14160f; --surface:#1c1f18; --sunk:#232720; --ink:#e9ebe1; --ink-2:#c3c8b9;
  --muted:#949a8b; --line:#333829; --line-2:#454b3a; --amber:#dda63f; --amber-soft:#3a3117;
}}
*{box-sizing:border-box}
body{margin:0; background:var(--paper); color:var(--ink); font:14px/1.45 "IBM Plex Mono",ui-monospace,Menlo,monospace}
h1,h2,h3,h4{font-family:"Barlow Condensed","Arial Narrow",sans-serif}

.doc{padding:20px 28px 80px}
.doc .inner{max-width:860px; margin:0 auto; font-family:Georgia,"Times New Roman",serif; font-size:17px; line-height:1.55}
.doc h1{font-size:34px; margin:8px 0 14px}
.doc h2{font-size:24px; margin:30px 0 10px; padding-bottom:4px; border-bottom:1px solid var(--line-2)}
.doc h3{font-size:19px; margin:22px 0 8px}
.doc p{margin:0 0 12px}
.doc table{border-collapse:collapse; width:100%; margin:8px 0 18px; font:12.5px/1.4 "IBM Plex Mono",ui-monospace,Menlo,monospace}
.doc th,.doc td{border:1px solid var(--line-2); padding:5px 7px; vertical-align:top; text-align:left}
.doc th{background:var(--sunk)}
.doc blockquote{border-left:3px solid var(--amber); margin:0 0 12px; padding:2px 12px; color:var(--muted)}
.doc blockquote p:last-child{margin-bottom:0}
.doc code{font-family:ui-monospace,Menlo,monospace; font-size:.85em; background:var(--sunk); padding:1px 4px; border-radius:3px}
.doc hr{border:0; border-top:1px solid var(--line-2); margin:24px 0}
.doc ul,.doc ol{margin:0 0 12px 24px; padding:0} .doc li{margin-bottom:4px}

@page{
  size:letter; margin:0.6in 0.65in 0.7in;
  @bottom-left{content:"${esc(title)}"; font:9pt "Barlow Condensed","Arial Narrow",sans-serif; letter-spacing:.06em; text-transform:uppercase; color:#6c7268}
  @bottom-right{content:counter(page) " / " counter(pages); font:8pt "IBM Plex Mono",ui-monospace,monospace; color:#6c7268}
}
@page:first{@bottom-left{content:none}}
@media print{
  body{background:#fff; -webkit-print-color-adjust:exact; print-color-adjust:exact}
  .doc{padding:0}
  .doc .inner{max-width:none; font-size:10.5pt; line-height:1.45}
  .doc h1{font-size:30pt; margin:0 0 10pt}
  .doc h2{font-size:19pt; margin:0 0 8pt; break-before:page}
  .doc h2:first-of-type{margin-top:18pt; break-before:auto}
  .doc h3{font-size:13.5pt; margin:14pt 0 5pt}
  .doc h1,.doc h2,.doc h3{break-after:avoid}
  .doc p{margin:0 0 7pt; orphans:3; widows:3}
  .doc table{font-size:8pt; margin:5pt 0 11pt}
  .doc th,.doc td{padding:3pt 5pt}
  .doc thead{display:table-header-group}
  .doc tr,.doc blockquote,.doc li{break-inside:avoid}
  .doc blockquote{padding:1pt 10pt; color:var(--ink-2)}
  .doc a{color:inherit; text-decoration:none}
}
</style>
</head>
<body>
<section class="doc"><div class="inner">
${body}
</div></section>
</body>
</html>
`;

const out = `${ROOT}../${name}.print.html`;
await Bun.write(out, page);
console.log(`wrote ${name}.print.html  (open it in a browser and print, or Save as PDF)`);
