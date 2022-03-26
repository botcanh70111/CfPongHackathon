/** @format */

const ENUM_MODAL_TYPE = {
  win: 1,
  lose: 2,
  cancel: 3,
}

function openModal(modalType = ENUM_MODAL_TYPE.win) {
  console.log("TVT modalType = " + modalType)
  // Get the modal
  var modalOverlay = document.getElementById('modal-overlay');
  var modal = document.getElementById('myModal');
  var modalHeaderTitle = document.getElementById('header-title');
  var modalContent = document.getElementById('modal-content');
  modalHeaderTitle.innerHTML = 'Thông báo';
  modalContent.innerHTML = 'Haaaa';

  modalOverlay.style.display = 'block';
  modal.style.display = "flex";
}

function closeModal() {
  console.log("TVT go to closeModal");
  var modalOverlay = document.getElementById('modal-overlay');
  var modal = document.getElementById('myModal');
  modalOverlay.style.display = 'none';
  modal.style.display = "none";
}
