---
---
(function(){
  document.addEventListener("DOMContentLoaded", function () {
    var form = document.getElementById("comment-form");
    if (!form) return;

    var submitBtn = document.getElementById("comment-submit-btn");
    var alertContainer = document.getElementById("comment-form-alert");
    var spinner = submitBtn ? submitBtn.querySelector(".spinner-border") : null;

    // Marca de tiempo anti-bot (time-trap)
    var tsField = form.querySelector('input[name="ts"]');
    if (tsField) tsField.value = Date.now().toString();

    // Contadores y hard limits
    var nameInput = document.getElementById('comment-name');
    var emailInput = document.getElementById('comment-email');
    var msgInput = document.getElementById('comment-message');
    var remaining = document.getElementById('msg-remaining');

    var hardLimit = function(el){
      if (!el) return;
      el.addEventListener('input', function(){
        var max = el.maxLength || 1e9;
        if (el.value.length > max) el.value = el.value.slice(0, max);
        if (el === msgInput && remaining) remaining.textContent = String(max - el.value.length);
      });
      el.addEventListener('paste', function(e){
        var paste = (e.clipboardData || window.clipboardData).getData('text');
        var max = el.maxLength || 1e9;
        var start = el.selectionStart || 0;
        var end = el.selectionEnd || 0;
        var current = el.value || '';
        var next = current.slice(0, start) + paste + current.slice(end);
        if (next.length > max) {
          e.preventDefault();
          var slice = paste.slice(0, max - (current.length - (end - start)));
          document.execCommand('insertText', false, slice);
        }
      });
    };
    [nameInput, emailInput, msgInput].forEach(hardLimit);

    function showAlert(message, type) {
      if (!alertContainer) return;
      alertContainer.textContent = message;
      alertContainer.className = 'alert ' + type + ' mt-3';
      alertContainer.classList.remove('d-none');
      alertContainer.focus && alertContainer.focus();
    }

    function toJSON(form){
      var fd = new FormData(form);
      var data = {};
      fd.forEach(function(value, key){ data[key] = value; });
      return data;
    }

    function stopSubmitting(){
      if (submitBtn) submitBtn.disabled = false;
      if (spinner) spinner.classList.add('d-none');
    }

    var ENDPOINT = '{{ site.comments.custom.endpoint | relative_url }}';

    // Helper: test if value has any non-whitespace character
    function hasNonWhitespace(value){
      if (!value) return false;
      // remove all unicode whitespace characters
      return /\S/.test(value);
    }

    form.addEventListener("submit", function (event) {
      console.log('[comment-form] submit event');
      event.preventDefault();
      event.stopPropagation();

      // Validate trimmed / whitespace-only values
      var nameRaw = nameInput && nameInput.value ? nameInput.value : '';
      var msgRaw = msgInput && msgInput.value ? msgInput.value : '';

      // TRACE: show raw values and length
      console.log('[comment-form] nameRaw:', JSON.stringify(nameRaw), 'len:', nameRaw.length);
      console.log('[comment-form] msgRaw:', JSON.stringify(msgRaw), 'len:', msgRaw.length);

      var nameOk = hasNonWhitespace(nameRaw);
      var msgOk = hasNonWhitespace(msgRaw);

      console.log('[comment-form] nameOk:', nameOk, 'msgOk:', msgOk);

      // Use setCustomValidity so browser :valid/:invalid reflects our whitespace check
      if (nameInput) {
        if (!nameOk) {
          nameInput.setCustomValidity('Por favor ingresa un nombre válido.');
        } else {
          nameInput.setCustomValidity('');
        }
      }
      if (msgInput) {
        if (!msgOk) {
          msgInput.setCustomValidity('Por favor ingresa un mensaje válido.');
        } else {
          msgInput.setCustomValidity('');
        }
      }

      if (!nameOk) {
        if (nameInput) nameInput.classList.add('is-invalid');
        form.classList.add('was-validated');
        if (nameInput) nameInput.focus();
        return;
      } else {
        if (nameInput) nameInput.classList.remove('is-invalid');
      }

      if (!msgOk) {
        if (msgInput) msgInput.classList.add('is-invalid');
        form.classList.add('was-validated');
        if (msgInput) msgInput.focus();
        return;
      } else {
        if (msgInput) msgInput.classList.remove('is-invalid');
      }

      if (form.checkValidity() === false) {
        form.classList.add("was-validated");
        return;
      }

      if (submitBtn) submitBtn.disabled = true;
      if (spinner) spinner.classList.remove("d-none");
      if (alertContainer) alertContainer.classList.add("d-none");

      var data = toJSON(form);

      fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify(data)
      })
      .then(function(response){
        return response.json().catch(function(){ return { message: '' }; }).then(function(body){
          return { status: response.status, body: body };
        });
      })
      .then(function(res){
        var status = res.status, body = res.body || {};
        if (status === 201 && body.ok) {
          try {
            var list = document.querySelector('.comment-list');
            if (list) {
              var div = document.createElement('div');
              div.className = 'comment';
              div.id = 'comment-' + body.id;
              var emailHash = body.emailHash || '';
              var avatar = emailHash
                ? 'https://www.gravatar.com/avatar/' + emailHash + '?s=80&d=identicon'
                : 'https://www.gravatar.com/avatar/?s=80&d=identicon';
              var safeName = String(data.name || '').replace(/[&<>]/g, function(s){ return ({'&':'&amp;','<':'&lt;','>':'&gt;'}[s]); });
              var safeMsg = String(data.message || '')
                .replace(/\r\n/g, "\n").replace(/\r/g, "\n")
                .replace(/[&<>]/g, function(s){ return ({'&':'&amp;','<':'&lt;','>':'&gt;'}[s]); })
                .replace(/\n/g, '<br>');
              div.innerHTML = '<div class="comment-avatar">\n' +
                '  <img src="' + avatar + '" alt="' + safeName + ' avatar">\n' +
                '</div>\n' +
                '<div class="comment-content">\n' +
                '  <div class="comment-header">\n' +
                '    <span class="comment-author font-weight-bold">' + safeName + '</span>\n' +
                '    <span class="comment-date text-muted">justo ahora</span>\n' +
                '  </div>\n' +
                '  <div class="comment-body">' + safeMsg + '</div>\n' +
                '</div>';
              list.appendChild(div);
            }
          } catch(e) {}

          form.reset();
          if (remaining) remaining.textContent = '4000';
          form.classList.remove('was-validated');
          showAlert('¡Gracias por tu comentario! Puede tardar unos segundos en aparecer para todos.', 'alert-success');
        } else {
          showAlert(body && body.message ? body.message : 'No se pudo enviar el comentario.', 'alert-danger');
        }
      })
      .catch(function(err){
        console.error('Error submitting comment:', err);
        showAlert('Ha ocurrido un error al enviar tu comentario. Por favor, inténtalo de nuevo.', 'alert-danger');
      })
      .finally(function(){
        stopSubmitting();
      });
    });

    // clear invalid state while typing (consider whitespace)
    var inputs = form.querySelectorAll(".form-control");
    inputs.forEach(function(input){
      input.addEventListener('input', function(){
        if (form.classList.contains('was-validated')){
          var ok = /\S/.test(input.value || '');
          if (ok) {
            input.classList.remove('is-invalid');
            // clear custom validity so browser :valid updates
            try { input.setCustomValidity(''); } catch(e){}
          }
          // TRACE current value
          console.log('[comment-form] input', input.id, 'value:', JSON.stringify(input.value), 'ok:', ok);
        }
      });
    });
  });
})();
