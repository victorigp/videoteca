(function(){
  try {
    var list = document.querySelectorAll('script');
    for (var i=0;i<list.length;i++){
      var s = list[i];
      if (s.src) continue;
      var code = s.textContent || '';
      try { new Function(code); }
      catch(e){
        console.error('[SCRIPT-SYNTAX]', { index:i, error:e && (e.message||e), snippet: code.slice(0,300) });
      }
    }
  } catch(e) {}
})();
