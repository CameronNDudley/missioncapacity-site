# Mission Capacity website

Static site (HTML + CSS), deployed on Netlify at https://missioncapacity.netlify.app

## Add a blog post

1. In the Content Engine, click **Copy Markdown** on the blog post. Save it as `post.md` (first line is `# Title`).
2. From this folder, run:

   node new-post.js your-post-slug "Meta description under 155 characters" post.md

3. Commit and push. Netlify deploys automatically.

The script creates `blog/your-post-slug.html`, adds a card to `blog.html`, and rebuilds `sitemap.xml`.
Re-running it with the same slug replaces that post.
