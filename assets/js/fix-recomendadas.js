(function(){
  var desired = '{{ "/recomendadas/" | relative_url }}';
  var wrongA = '{{ "/recomendada/" | relative_url }}';
  var wrongB = '{{ "/recomendadas-tab/" | relative_url }}';
  function fixLinks(root) {
    try {
      var scope = root || document;
      var anchors = scope.querySelectorAll('nav.flex-column a, ul.nav a, a.nav-link');
      anchors.forEach(function(a){
        var txt = (a.textContent || '').replace(/\s+/g,' ').trim().toLowerCase();
        var href = a.getAttribute('href') || '';
        if (txt.indexOf('recomendadas') !== -1 || href === wrongA || href === wrongB) {
          a.setAttribute('href', desired);
        }
      });
    } catch(e) {}
  }
  function setupObserver() {
    try {
      var nav = document.querySelector('nav.flex-column, ul.nav');
      if (!nav) return;
      var obs = new MutationObserver(function(muts){
        muts.forEach(function(m){ if (m.type === 'childList') fixLinks(nav); });
      });
      obs.observe(nav, { childList: true, subtree: true });
    } catch(e) {}
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function(){ fixLinks(); setupObserver(); });
  } else {
    fixLinks(); setupObserver();
  }
  document.addEventListener('pjax:success', function(){ fixLinks(); setupObserver(); });
  document.addEventListener('pjax:complete', function(){ fixLinks(); setupObserver(); });
})();
