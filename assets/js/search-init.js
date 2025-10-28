(function(){
  function init(){
    try {
      if (typeof SimpleJekyllSearch !== 'function') return;
      var searchInput = document.getElementById('search-input');
      var resultsContainer = document.getElementById('search-results');
      if (!searchInput || !resultsContainer) return;

      var jsonUrl = (typeof SEARCH_JSON !== 'undefined' && SEARCH_JSON) ? SEARCH_JSON : '/assets/js/data/search.json';
      var resultTpl = (typeof SEARCH_RESULT_TEMPLATE !== 'undefined') ? SEARCH_RESULT_TEMPLATE : '<article><header><h2><a href="{url}">{title}</a></h2></header><p>{content}</p></article>';
      var noResults = (typeof SEARCH_NO_RESULTS !== 'undefined') ? SEARCH_NO_RESULTS : '';

      SimpleJekyllSearch({
        searchInput: searchInput,
        resultsContainer: resultsContainer,
        json: jsonUrl,
        searchResultTemplate: resultTpl,
        noResultsText: noResults,
        templateMiddleware: function(prop, value, template) {
          if (prop === 'categories') {
            if (value === '') {
              return '' + value;
            } else {
              return '<div class="me-sm-4"><i class="far fa-folder fa-fw"></i>' + value + '</div>';
            }
          }
          if (prop === 'tags') {
            if (value === '') {
              return '' + value;
            } else {
              return '<div><i class="fa fa-tag fa-fw"></i>' + value + '</div>';
            }
          }
        }
      });
    } catch(e) {
      // Silenciar errores de inicialización
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
