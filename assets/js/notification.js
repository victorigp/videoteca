(function () {
  var toastEl = document.getElementById('notification');
  if (!toastEl) return;

  var silentFlag = false;

  // Check if notification has already been shown in this session
  var notificationShown = sessionStorage.getItem('notificationShown');

  function fetchLastCommitMessage() {
    var url = '/api/version';
    url += (url.indexOf('?') === -1 ? '?' : '&') + '_=' + Date.now();
    return fetch(url, { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : {}; })
      .then(function (j) { return (j && j.message) ? String(j.message) : ''; })
      .catch(function () { return ''; });
  }

  function shouldSilentUpdate(message) {
    try { return /\bNew comment by\b/i.test(message || ''); } catch (e) { return false; }
  }

  function askSkipWaiting(sw) {
    try {
      sw.postMessage({ type: 'SKIP_WAITING' });
      sw.postMessage({ action: 'skipWaiting' });
    } catch (e) {}
  }

  function hideToastIfNeeded() {
    if (!silentFlag && notificationShown) {
      // Hide if not silent and already shown
      try {
        if (window.bootstrap && window.bootstrap.Toast) {
          var inst = window.bootstrap.Toast.getOrCreateInstance(toastEl, { autohide: false });
          inst.hide();
        }
        toastEl.classList.add('d-none');
      } catch (e) { }
    } else if (silentFlag) {
      // Hide if silent
      try {
        if (window.bootstrap && window.bootstrap.Toast) {
          var inst = window.bootstrap.Toast.getOrCreateInstance(toastEl, { autohide: false });
          inst.hide();
        }
        toastEl.classList.add('d-none');
      } catch (e) { }
    }
  }

  document.addEventListener('show.bs.toast', function (ev) {
    if (ev.target === toastEl) hideToastIfNeeded();
  });
  document.addEventListener('shown.bs.toast', function (ev) {
    if (ev.target === toastEl && !silentFlag) {
      // Mark as shown for non-silent updates
      sessionStorage.setItem('notificationShown', 'true');
    }
  });

  if ('serviceWorker' in navigator) {
    fetchLastCommitMessage().then(function (msg) {
      silentFlag = shouldSilentUpdate(msg);
      if (silentFlag) {
        hideToastIfNeeded();
        navigator.serviceWorker.getRegistration().then(function (reg) {
          if (reg && reg.waiting) askSkipWaiting(reg.waiting);
        }).catch(function () {});
      }
    });
  }
})();
