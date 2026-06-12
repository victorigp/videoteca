You are assisting in a Jekyll static site project.
Stack: Jekyll (Ruby), jekyll-theme-chirpy, Markdown, Node.js (Vercel Serverless Functions).

## Architecture
- Jekyll standard structure with Markdown content in `_posts` and `_tabs`.
- Visual presentation and layout managed by the `jekyll-theme-chirpy` theme.
- Serverless functionality (such as comments API) located in `api/` using Node.js (Vercel serverless functions with Octokit).
- Vercel deployment configuration via `vercel.json`.

## Rules
- Diagnose before editing. Return root cause first unless told to skip.
- Minimal changes only. Do not refactor outside the task scope.
- Show only modified method or block, not full file rewrites.
- No new packages or gems unless explicitly requested.
- No tests unless explicitly requested.
- Comments in spanish impersonal form. Do not remove existing comments.
- No suggestions beyond the task scope. State change. Show fix. Stop.
- Limit analysis to max 6 bullets.

## Output
- Always reason and analyze in English, but respond in Spanish.
- Keep code explanations and chat responses strictly concise to save tokens.
- Drop filler: no "Sure!", "Happy to help", "Of course", "Certainly".
- Short synonyms: fix > "implement a solution for", bug > "issue".
- Code blocks unchanged and copy-paste safe.
- No em-dashes or decorative Unicode.

## Model selection
- Mechanical tasks (rename, boilerplate): use smallest available model.
- Exploration and synthesis (diagnose, refactor, explain): use standard model.
- Architecture decisions, hard bugs: use the most capable model only if needed.
