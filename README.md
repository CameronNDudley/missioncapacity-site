# Mission Capacity website

Static site (HTML + CSS), deployed on Netlify at https://missioncapacity.netlify.app

## Add a blog post

1. In the Content Engine, click **Copy Markdown** on the blog post. Save it as `post.md` (first line is `# Title`).
2. From this folder, run:

   node new-post.js your-post-slug "Meta description under 155 characters" post.md

3. Commit and push. Netlify deploys automatically.

The script creates `blog/your-post-slug.html`, adds a card to `blog.html`, and rebuilds `sitemap.xml`.
Re-running it with the same slug replaces that post.

## Add a case study

Case studies live in the **Case Studies** section of the "Blog & Case Studies" page (`blog.html`), not in the top nav.

1. Copy an existing page such as `case-study-jet-award-crm.html` to `case-study-your-slug.html` and edit it. (Keep the "Blog & Case Studies" tab marked `class="active"` in its nav.)
2. In `blog.html`, add a card between `<!-- CASESTUDIES:START -->` and `<!-- CASESTUDIES:END -->` (newest first).
3. Add the page to `sitemap.xml` (running `node new-post.js` also rebuilds it from every `.html` file).
4. Commit and push. Netlify deploys automatically.
