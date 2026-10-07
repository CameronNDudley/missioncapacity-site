#!/usr/bin/env node
// Adds a blog post to the Mission Capacity site.
//
// Usage:  node new-post.js <slug> "<meta description>" <post.md>
//
// post.md is the Markdown copied from the Content Engine ("Copy Markdown"):
// the first line is "# Title", the rest is the body (## subheads, lists, links).
// The script writes blog/<slug>.html, adds a card to the top of blog.html,
// and rebuilds sitemap.xml. Run it from the site folder.

const fs = require("fs");
const path = require("path");

const BASE = "https://missioncapacity.netlify.app"; // change if you add a custom domain
const [slug, description, mdFile] = process.argv.slice(2);

if (!slug || !description || !mdFile) {
  console.error('Usage: node new-post.js <slug> "<meta description>" <post.md>');
  process.exit(1);
}
if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
  console.error("Slug must be lowercase letters, numbers and hyphens, e.g. why-intake-forms-fail");
  process.exit(1);
}

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function inline(s) {
  return esc(s)
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2">$1</a>')
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[^*])\*(?!\s)(.+?)\*(?!\*)/g, "$1<em>$2</em>");
}

function mdToHtml(md) {
  const out = [];
  let para = [], list = null;
  const flushPara = () => { if (para.length) { out.push("<p>" + inline(para.join(" ")) + "</p>"); para = []; } };
  const flushList = () => { if (list) { out.push(`<${list.tag}>` + list.items.map((i) => "<li>" + inline(i) + "</li>").join("") + `</${list.tag}>`); list = null; } };
  for (const raw of md.replace(/\r/g, "").split("\n")) {
    const l = raw.trim();
    if (!l) { flushPara(); flushList(); continue; }
    let m;
    if ((m = l.match(/^#{2}\s+(.*)$/))) { flushPara(); flushList(); out.push("<h2>" + inline(m[1]) + "</h2>"); continue; }
    if ((m = l.match(/^#{3,4}\s+(.*)$/))) { flushPara(); flushList(); out.push("<h3>" + inline(m[1]) + "</h3>"); continue; }
    if ((m = l.match(/^[-*]\s+(.*)$/))) { flushPara(); if (!list || list.tag !== "ul") { flushList(); list = { tag: "ul", items: [] }; } list.items.push(m[1]); continue; }
    if ((m = l.match(/^\d+\.\s+(.*)$/))) { flushPara(); if (!list || list.tag !== "ol") { flushList(); list = { tag: "ol", items: [] }; } list.items.push(m[1]); continue; }
    if ((m = l.match(/^>\s?(.*)$/))) { flushPara(); flushList(); out.push("<blockquote><p>" + inline(m[1]) + "</p></blockquote>"); continue; }
    flushList(); para.push(l);
  }
  flushPara(); flushList();
  return out.join("\n");
}

const lines = fs.readFileSync(mdFile, "utf8").replace(/\r/g, "").split("\n");
const h1 = lines.findIndex((l) => /^#\s+\S/.test(l));
if (h1 === -1) { console.error('The first line of the Markdown file must be "# Your Title".'); process.exit(1); }
const title = lines[h1].replace(/^#\s+/, "").trim();
const bodyHtml = mdToHtml(lines.slice(h1 + 1).join("\n"));

const today = new Date();
const iso = today.toLocaleDateString("en-CA", { timeZone: "America/Chicago" }); // YYYY-MM-DD, Omaha time
const pretty = today.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "America/Chicago" });

const nav = (active) => `<header class="site-header">
  <div class="nav-inner">
    <a href="../index.html" class="logo">Mission Capacity</a>
    <nav>
      <a href="../index.html">Home</a>
      <a href="../skills.html">About</a>
      <a href="../case-study-prospectpulse.html">ProspectPulse</a>
      <a href="../case-study-audit-kit.html">Audit Kit</a>
      <a href="../blog.html"${active ? ' class="active"' : ""}>Blog</a>
    </nav>
  </div>
</header>`;

const ld = JSON.stringify({
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  headline: title,
  description,
  datePublished: iso,
  author: { "@type": "Person", name: "Cameron Dudley" },
  publisher: { "@type": "Organization", name: "Mission Capacity" },
  mainEntityOfPage: `${BASE}/blog/${slug}.html`,
});

const page = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(title)} — Mission Capacity</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${BASE}/blog/${slug}.html">
<meta property="og:type" content="article">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${BASE}/blog/${slug}.html">
<link rel="stylesheet" href="../style.css">
<script type="application/ld+json">${ld.replace(/</g, "\\u003c")}</script>
</head>
<body>

${nav(true)}

<section class="case-hero">
  <div class="wrap">
    <div class="eyebrow">Blog · <time datetime="${iso}">${pretty}</time></div>
    <h1>${esc(title)}</h1>
  </div>
</section>

<main>
  <div class="wrap">
    <article class="post-body">
${bodyHtml}
    </article>
    <div class="post-byline">
      By Cameron Dudley, founder of Mission Capacity in Omaha. <a href="../blog.html">&larr; All posts</a> · <a href="mailto:cameronndudley1@gmail.com">Start an operations audit</a>
    </div>
  </div>
</main>

<footer>
  <div class="wrap">
    &copy; 2026 Mission Capacity · Omaha, NE · Founded by Cameron Dudley
  </div>
</footer>

</body>
</html>
`;

fs.mkdirSync("blog", { recursive: true });
const target = path.join("blog", slug + ".html");
const existed = fs.existsSync(target);
fs.writeFileSync(target, page);

// index card
const card = `        <a href="blog/${slug}.html" class="card" data-slug="${slug}">
          <div class="meta">${pretty}</div>
          <h3>${esc(title)}</h3>
          <p>${esc(description)}</p>
          <span class="cta-link">Read the post &rarr;</span>
        </a>
`;
let index = fs.readFileSync("blog.html", "utf8");
if (!index.includes("<!-- POSTS:START -->")) { console.error("blog.html is missing the POSTS markers."); process.exit(1); }
const re = new RegExp(`\\s*<a href="blog/${slug}\\.html" class="card"[\\s\\S]*?</a>\\n`);
index = index.replace(re, "\n");
index = index.replace("<!-- POSTS:START -->\n", "<!-- POSTS:START -->\n" + card);
fs.writeFileSync("blog.html", index);

// sitemap
const pages = [
  ...fs.readdirSync(".").filter((f) => f.endsWith(".html")),
  ...fs.readdirSync("blog").filter((f) => f.endsWith(".html")).map((f) => "blog/" + f),
];
const url = (f) => (f === "index.html" ? BASE + "/" : `${BASE}/${f}`);
fs.writeFileSync(
  "sitemap.xml",
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    pages.map((f) => `  <url><loc>${url(f)}</loc></url>`).join("\n") +
    `\n</urlset>\n`
);

console.log(`${existed ? "Updated" : "Created"} ${target}, updated blog.html and sitemap.xml`);
