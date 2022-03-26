/** @format */

const ENUM_MODAL_TYPE = {
  win: 1,
  lose: 2,
  cancel: 3,
}

function openModal(modalType = ENUM_MODAL_TYPE.win) {
  console.log("TVT modalType = " + modalType)
  // Get the modal
  var modal = document.getElementById('myModal');
  var modalHeader = document.getElementById('modal-header');
  var modalContent = document.getElementById('modal-content');
  modalHeader.innerHTML = 'Thông báo'
  modalContent.innerHTML = 'Haaaa';

  modal.style.display = "flex";
}
