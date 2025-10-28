// Simple version endpoint for SW update logic
// Returns last commit message/sha from Vercel build env. No caching.

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ ok: false, code: 'method_not_allowed' });
  }

  try {
    const message = process.env.VERCEL_GIT_COMMIT_MESSAGE || '';
    const sha = process.env.VERCEL_GIT_COMMIT_SHA || '';

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-store, max-age=0, must-revalidate');

    return res.status(200).json({
      ok: true,
      message,
      sha,
      timestamp: new Date().toISOString()
    });
  } catch (e) {
    return res.status(500).json({ ok: false, code: 'internal_error' });
  }
};
