(function() {

  /* Modal Toggling */
  let modal = document.querySelector('#instructions-modal'),
      modalBtn = document.querySelector('#instructions-btn'),
      closeBtn = document.querySelector('.close-instructions-btn');

  modalBtn.addEventListener('click', function() {
    modal.style.display = "block";
  });

  closeBtn.addEventListener('click', function() {
    modal.style.display = "none";
  });

  window.addEventListener('click', function(event) {
    if (event.target == modal) {
      modal.style.display = "none";
    }
  });
  /* End of Modal Toggling*/

})();