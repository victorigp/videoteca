function openModal(src) {
  var modal = document.createElement('div');
  modal.classList.add('modal');

  var modalContent = document.createElement('img');
  modalContent.classList.add('modal-content');
  modalContent.src = src;

  var closeSpan = document.createElement('span');
  closeSpan.classList.add('close');
  closeSpan.innerHTML = '&times;';
  closeSpan.onclick = function () {
    modal.style.display = "none";
    modal.remove();
  }

  window.onclick = function (event) {
    if (event.target == modal) {
      modal.style.display = "none";
      modal.remove();
    }
  }

  modal.appendChild(modalContent);
  modal.appendChild(closeSpan);
  document.body.appendChild(modal);

  modal.style.display = "block";
}

// Gestión de colores del carousel según el modo (dark/light)
(function() {
  function getCurrentMode() {
    try {
      // Leer desde el atributo data-mode en <html>
      var mode = document.documentElement.getAttribute('data-mode');
      if (mode === 'dark' || mode === 'light') {
        return mode;
      }
      // Fallback: detectar preferencia del sistema
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } catch (e) {
      return 'dark';
    }
  }

  function updateCarouselColors(mode) {
    var isDark = (mode === 'dark');
    var controlColor = isDark ? '#fafafa' : '#000';
    var bgControlColor = isDark ? 'rgba(0, 0, 0, 0.4)' : 'rgba(255, 255, 255, 0.7)';
    var indicatorBgColor = isDark ? 'rgba(0, 0, 0, 0.4)' : 'rgba(255, 255, 255, 0.7)';

    var carouselControls = document.querySelectorAll('.carousel__control');
    var carouselIndicators = document.querySelectorAll('.carousel__indicator');
    var carouselIndicatorContainers = document.querySelectorAll('.carousel__indicators');
    var controlBackgrounds = document.querySelectorAll('.control-background');

    carouselControls.forEach(function (control) {
      control.style.setProperty('border-color', controlColor, 'important');
    });

    controlBackgrounds.forEach(function (bg) {
      bg.style.setProperty('background-color', bgControlColor, 'important');
    });

    carouselIndicators.forEach(function (indicator) {
      indicator.style.setProperty('background-color', controlColor, 'important');
    });

    carouselIndicatorContainers.forEach(function (container) {
      container.style.setProperty('background-color', indicatorBgColor, 'important');
    });
  }

  // Aplicar colores al cargar la página
  function initCarouselColors() {
    var currentMode = getCurrentMode();
    updateCarouselColors(currentMode);
  }

  // Observar cambios en el atributo data-mode del <html>
  function observeModeChanges() {
    try {
      var observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
          if (mutation.type === 'attributes' && mutation.attributeName === 'data-mode') {
            var newMode = getCurrentMode();
            updateCarouselColors(newMode);
          }
        });
      });

      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['data-mode']
      });
    } catch (e) {
      console.error('Error observando cambios de modo:', e);
    }
  }

  // Inicializar cuando el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      initCarouselColors();
      observeModeChanges();
    });
  } else {
    initCarouselColors();
    observeModeChanges();
  }

  // Reinicializar después de navegación PJAX (si aplica)
  document.addEventListener('pjax:success', initCarouselColors);
  document.addEventListener('pjax:complete', initCarouselColors);
})();
