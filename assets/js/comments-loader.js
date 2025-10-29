---
---
(function() {
  const PENDING_COMMENTS_KEY = 'pending_comments';

  // Dibuja un comentario pendiente en la lista
  function renderComment(list, comment) {
    console.log('[Loader] Rendering pending comment:', comment);
    // Evita duplicados si ya existe
    if (document.getElementById('comment-' + comment.id)) {
      console.log('[Loader] Comment already in DOM, skipping render.');
      return;
    }

    const noComments = list.querySelector('.no-comments');
    if (noComments) {
      noComments.remove();
    }

    const div = document.createElement('div');
    // Add 'pending' class to distinguish from server-rendered comments
    div.className = 'comment pending';
    div.id = 'comment-' + comment.id;

    const avatar = comment.emailHash
      ? `https://www.gravatar.com/avatar/${comment.emailHash}?s=80&d=identicon`
      : 'https://www.gravatar.com/avatar/?s=80&d=identicon';

    const safeName = comment.name.replace(/[&<>]/g, (s) => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[s]));
    const safeMsg = comment.message
      .replace(/\r\n/g, "\n").replace(/\r/g, "\n")
      .replace(/[&<>]/g, (s) => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[s]))
      .replace(/\n/g, '<br>');

    div.innerHTML = `
      <div class="comment-avatar">
        <img src="${avatar}" alt="${safeName} avatar">
      </div>
      <div class="comment-content">
        <div class="comment-header">
          <span class="comment-author font-weight-bold">${safeName}</span>
          <span class="comment-date text-muted">pendiente...</span>
        </div>
        <div class="comment-body">${safeMsg}</div>
      </div>`;
    list.appendChild(div);
    console.log('[Loader] Appended pending comment to list.');
  }

  // Limpia los comentarios pendientes que ya han sido publicados
  function cleanupPublishedComments(slug, pending) {
    console.log('[Loader] Starting cleanup for slug:', slug);
    const stillPending = pending.filter(comment => {
      const el = document.getElementById('comment-' + comment.id);
      // A comment is still pending if:
      // 1. It's not in the DOM at all (!el)
      // 2. It IS in the DOM but has the 'pending' class (put there by renderComment)
      const isPending = !el || el.classList.contains('pending');
      console.log(`[Loader] Cleanup check for comment ${comment.id}: element found: ${!!el}, has 'pending' class: ${el ? el.classList.contains('pending') : 'N/A'}. Is still pending: ${isPending}`);
      return isPending;
    });

    if (stillPending.length < pending.length) {
      console.log(`[Loader] Cleanup needed. Before: ${pending.length}, After: ${stillPending.length}`);
      const allPending = JSON.parse(localStorage.getItem(PENDING_COMMENTS_KEY) || '{}');
      if (stillPending.length === 0) {
        delete allPending[slug];
      } else {
        allPending[slug] = stillPending;
      }
      localStorage.setItem(PENDING_COMMENTS_KEY, JSON.stringify(allPending));
      console.log('[Loader] localStorage updated.');
    } else {
      console.log('[Loader] No cleanup needed, all pending comments are still pending.');
    }
  }

  document.addEventListener('DOMContentLoaded', function() {
    const list = document.querySelector('.comment-list');
    const slug = document.querySelector('input[name="slug"]')?.value;

    if (!list || !slug) {
      return;
    }

    const allPending = JSON.parse(localStorage.getItem(PENDING_COMMENTS_KEY) || '{}');
    const pendingForSlug = allPending[slug] || [];
    console.log(`[Loader] Found ${pendingForSlug.length} pending comments for slug '${slug}' in localStorage.`);

    if (pendingForSlug.length > 0) {
      pendingForSlug.forEach(comment => renderComment(list, comment));
      // Run cleanup after a short delay to ensure the DOM is fully updated
      setTimeout(() => cleanupPublishedComments(slug, pendingForSlug), 100);
    }
  });
})();
