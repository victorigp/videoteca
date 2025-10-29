const { Octokit } = require("@octokit/rest");
const { AkismetClient } = require("akismet-api");
const md5 = require("md5");
const yaml = require("js-yaml");
const { Resend } = require("resend");

// Inicializar el cliente de Resend con la API Key
const resend = new Resend(process.env.RESEND_API_KEY);

// Helper function to format the date
const toIso8601 = (date) => {
  return date.toISOString().split(".")[0] + "Z";
};

// Normalize an origin/string to plain origin without trailing slash and in lower-case
function normalizeOriginStr(s) {
  if (!s || typeof s !== "string") return "";
  try {
    const u = new URL(s);
    return u.origin.toLowerCase();
  } catch {
    return s.replace(/\/$/, "").toLowerCase();
  }
}

// Normaliza y valida entradas de usuario: elimina espacios, rechaza caracteres de control no imprimibles.
// Devuelve string normalizado o null si contiene caracteres inválidos.
function normalizeInput(input) {
  if (input === undefined || input === null) return "";
  let s = typeof input === "string" ? input : String(input);
  s = s.trim();

  // Rechazar caracteres de control ASCII (excepto tabulación, salto de línea y retorno de carro)
  // 0x00-0x08, 0x0B, 0x0C, 0x0E-0x1F y 0x7F son no imprimibles
  if (["string"].includes(typeof s) && /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/.test(s)) {
    return null;
  }

  return s;
}

function setCors(res, origin, allowedOrigins) {
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function parseAllowedOrigins() {
  const raw = process.env.ALLOWED_ORIGINS || "";
  return raw
    .split(",")
    .map((s) => normalizeOriginStr(s.trim()))
    .filter((s) => s.length > 0);
}

function getOrigin(req) {
  const originHdr = req.headers["origin"]; // already an origin
  if (originHdr) return normalizeOriginStr(originHdr);
  const referer = req.headers["referer"]; // full URL
  if (!referer) return "";
  try { return new URL(referer).origin.toLowerCase(); } catch { return ""; }
}

// Main serverless function handler
module.exports = async (req, res) => {
  const allowedOrigins = parseAllowedOrigins();
  const origin = getOrigin(req);
  setCors(res, origin, allowedOrigins);

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, code: "method_not_allowed", message: "Método no permitido" });
  }

  try {
    // Extract and validate form data
    let { name, email, message, url, honeypot, website, repo, slug, ts } = req.body || {};

    // Basic origin/referrer protection
    if (allowedOrigins.length && (!origin || !allowedOrigins.includes(origin))) {
      return res.status(403).json({ ok: false, code: "forbidden_origin", message: "Origen proohibido" });
    }

    // Honeypots and antibot time-trap
    if (honeypot || (website && website.trim().length > 0)) {
      return res.status(400).json({ ok: false, code: "bot_detected", message: "Spam detectado" });
    }
    const minDelayMs = 3000;
    const submittedAt = Number(ts);
    if (!Number.isNaN(submittedAt)) {
      if (Date.now() - submittedAt < minDelayMs) {
        return res.status(400).json({ ok: false, code: "too_fast", message: "Formulario enviado demasiado rápido" });
      }
    }

    // Normalize inputs
    name = normalizeInput(name);
    message = normalizeInput(message);
    slug = normalizeInput(slug);
    url = typeof url === "string" ? url.trim() : "";
    email = typeof email === "string" ? email.trim() : "";

    if (name === null || message === null || slug === null) {
      return res.status(400).json({ ok: false, code: "invalid_chars", message: "Caracteres inválidos" });
    }

    // Length checks
    if (!name || !message || !slug || !repo) {
      return res.status(400).json({ ok: false, code: "missing_fields", message: "Campos requeridos faltantes" });
    }
    if (name.length > 40) {
      return res.status(400).json({ ok: false, code: "name_too_long", message: "Nombre demasiado largo" });
    }
    if (message.length > 4000) {
      return res.status(400).json({ ok: false, code: "message_too_long", message: "Mensaje demasiado largo" });
    }
    if (email && email.length > 100) {
      return res.status(400).json({ ok: false, code: "email_too_long", message: "Email demasiado largo" });
    }

    // Akismet Spam Verification (enhanced)
    const akismetKey = process.env.AKISMET_KEY;
    const akismetBlog = process.env.AKISMET_BLOG;
    const blogLang = process.env.BLOG_LANG || "es";

    if (akismetKey && akismetBlog) {
      const akismetClient = new AkismetClient({ key: akismetKey, blog: akismetBlog });

      try {
        const valid = await akismetClient.verifyKey();
        if (valid) {
          const isSpam = await akismetClient.checkSpam({
            user_ip: req.headers["x-forwarded-for"] || req.socket.remoteAddress,
            user_agent: req.headers["user-agent"],
            referrer: req.headers["referer"],
            permalink: url,
            comment_type: "comment",
            comment_author: name,
            comment_author_email: email,
            comment_content: message,
            blog_lang: blogLang,
            blog_charset: "UTF-8",
          });
          if (isSpam) {
            return res.status(400).json({ ok: false, code: "akismet_spam", message: "Spam detectado por Akismet" });
          }
        }
      } catch (e) {
        // Do not fail the request solely because Akismet failed
      }
    }

    // Prepare comment data for GitHub
    const githubToken = process.env.GITHUB_TOKEN;
    const [owner, repoName] = String(repo).split("/");
    if (!githubToken || !owner || !repoName) {
      return res.status(500).json({ ok: false, code: "server_config", message: "Error en la configuración del servidor" });
    }

    const DEFAULT_BRANCH = process.env.DEFAULT_BRANCH || "main";
    const COMMENTS_BASE_PATH = process.env.COMMENTS_BASE_PATH || "_data/comments";

    const octokit = new Octokit({ auth: githubToken });

    const date = new Date();
    const id = date.getTime();
    const emailHash = email ? md5(email.toLowerCase()) : "";

    // Build YAML using js-yaml to ensure correct escaping and multiline handling
    const yamlObject = {
      _id: id,
      date: toIso8601(date),
      name: name,
      ...(emailHash ? { email: emailHash } : {}),
      message: String(message).replace(/\r\n/g, "\n").replace(/\r/g, "\n"),
    };

    const commentContent = yaml.dump(yamlObject, { lineWidth: -1 });

    const filePath = `${COMMENTS_BASE_PATH}/${slug}/${id}.yml`;
    const commitMessage = `New comment by ${name}`;

    await octokit.repos.createOrUpdateFileContents({
      owner,
      repo: repoName,
      path: filePath,
      message: commitMessage,
      content: Buffer.from(commentContent).toString("base64"),
      branch: DEFAULT_BRANCH,
    });

    // Enviar correo con Resend
    try {
      await resend.emails.send({
        from: "Resend <onboarding@resend.dev>", 
        to: "victorigp@gmail.com",
        subject: `Videoteca: Comentario de ${name}`,
        html: `<p><strong>Nombre:</strong> ${name}</p>
               <p><strong>Email:</strong> ${email || ""}</p>
               <p><strong>Mensaje:</strong></p>
               <p>${message.replace(/\n/g, '<br>')}</p>`,
      });
      // Email enviado (silencioso)
    } catch (emailError) {
      // No fallar la respuesta si el email falla; registrar internamente
    }

    return res.status(201).json({ ok: true, message: "Comment submitted successfully", id, date: toIso8601(date), emailHash, name, slug });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ ok: false, code: "internal_error", message: "An internal error occurred" });
  }
};
