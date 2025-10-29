---
---
(function() {
  const PENDING_COMMENTS_KEY = 'pending_comments';

  // Dibuja un comentario pendiente en la lista
  function renderComment(list, comment) {
    // Evita duplicados si ya existe
    if (document.getElementById('comment-' + comment.id)) {
      return;
    }

    const noComments = list.querySelector('.no-comments');
    if (noComments) {
      noComments.remove();
    }

    const div = document.createElement('div');
    div.className = 'comment';
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
  }

  // Limpia los comentarios pendientes que ya han sido publicados
  function cleanupPublishedComments(slug, pending) {
    const stillPending = pending.filter(comment => {
      const el = document.getElementById('comment-' + comment.id);
      // Si el elemento existe y no tiene la clase 'pending', es que ya se ha publicado
      return !el || el.classList.contains('pending');
    });

    if (stillPending.length < pending.length) {
      const allPending = JSON.parse(localStorage.getItem(PENDING_COMMENTS_KEY) || '{}');
      if (stillPending.length === 0) {
        delete allPending[slug];
      } else {
        allPending[slug] = stillPending;
      }
      localStorage.setItem(PENDING_COMMENTS_KEY, JSON.stringify(allPending));
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

    if (pendingForSlug.length > 0) {
      pendingForSlug.forEach(comment => renderComment(list, comment));
      cleanupPublishedComments(slug, pendingForSlug);
    }
  });
})();
