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
