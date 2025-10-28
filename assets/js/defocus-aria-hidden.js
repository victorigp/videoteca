(function(){
  var main = document.getElementById('main-wrapper');
  if (!main || !('MutationObserver' in window)) return;
  function defocusIfHidden() {
    try {
      if (main.getAttribute('aria-hidden') === 'true') {
        var ae = document.activeElement;
        if (ae && main.contains(ae)) {
          ae.blur();
          var mask = document.getElementById('mask') || document.body;
          mask.setAttribute('tabindex', '-1');
          mask.focus({ preventScroll: true });
          mask.removeAttribute('tabindex');
        }
      }
    } catch (e) { }
  }
  defocusIfHidden();
  var obs = new MutationObserver(function (muts) {
    for (var i = 0; i < muts.length; i++) {
      if (muts[i].attributeName === 'aria-hidden') { defocusIfHidden(); break; }
    }
  });
  obs.observe(main, { attributes: true, attributeFilter: ['aria-hidden'] });
})();
