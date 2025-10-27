const { Octokit } = require("@octokit/rest");
const { AkismetClient } = require("akismet-api");
const md5 = require("md5");

// Helper function to format the date
const toIso8601 = (date) => {
  return date.toISOString().split(".")[0] + "Z";
};

// Main serverless function handler
module.exports = async (req, res) => {
  // 1. Check for POST request
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    // 2. Extract and validate form data
    const { name, email, message, url, honeypot, repo, slug } = req.body;

    // 3. Honeypot spam check
    if (honeypot) {
      return res.status(400).json({ message: "Spam detected" });
    }

    if (!name || !message || !url || !repo || !slug) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // 4. Akismet Spam Verification
    const akismetKey = process.env.AKISMET_KEY;
    const akismetBlog = process.env.AKISMET_BLOG;

    if (akismetKey && akismetBlog) {
      const akismetClient = new AkismetClient({
        key: akismetKey,
        blog: akismetBlog,
      });

      const isSpam = (await akismetClient.verifyKey()) && (await akismetClient.checkSpam({
        user_ip: req.headers["x-forwarded-for"] || req.socket.remoteAddress,
        user_agent: req.headers["user-agent"],
        comment_author: name,
        comment_author_email: email,
        comment_content: message,
      }));

      if (isSpam) {
        return res.status(400).json({ message: "Spam detected by Akismet" });
      }
    }

    // 5. Prepare comment data for GitHub
    const githubToken = process.env.GITHUB_TOKEN;
    const [owner, repoName] = repo.split("/");

    if (!githubToken || !owner || !repoName) {
      return res.status(500).json({ message: "Server configuration error" });
    }

    const octokit = new Octokit({ auth: githubToken });

    const date = new Date();
    const emailHash = email ? md5(email.trim().toLowerCase()) : "";

    // Normalize newlines and indent block for YAML literal style so blank lines are preserved
    const normalizedMessage = String(message).replace(/\r\n/g, "\n").replace(/\r/g, "\n");
    const indentedMessage = normalizedMessage
      .split("\n")
      .map((line) => `  ${line}`)
      .join("\n");

    const commentContent = `_id: ${date.getTime()}
date: "${toIso8601(date)}"
name: "${name}"
${emailHash ? `email: "${emailHash}"\n` : ""}message: |-
${indentedMessage}
`;

    const filePath = `_data/comments/${slug}/${date.getTime()}.yml`;
    const commitMessage = `New comment by ${name}`;

    // 6. Use GitHub API to create the new comment file
    await octokit.repos.createOrUpdateFileContents({
      owner,
      repo: repoName,
      path: filePath,
      message: commitMessage,
      content: Buffer.from(commentContent).toString("base64"),
      branch: "main", // Or your default branch
    });

    return res.status(201).json({ message: "Comment submitted successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "An internal error occurred" });
  }
};
