(function(){
  try {
    if (!document.querySelector('meta[name="mobile-web-app-capable"]')) {
      var m = document.createElement('meta');
      m.setAttribute('name', 'mobile-web-app-capable');
      m.setAttribute('content', 'yes');
      document.head.appendChild(m);
    }
  } catch (e) { }
})();
