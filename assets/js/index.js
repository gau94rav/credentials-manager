const { ipcRenderer } = require('electron')

const storeBtn = document.querySelector('.store-cred-btn');

storeBtn.addEventListener('click', storeCred);

function storeCred() {
    const name = document.getElementById('name').value;
    const identifier = document.getElementById('identifier').value;
    const password = document.getElementById('password').value;

    const data = { name, identifier, password };
    ipcRenderer.send('store-credentials', data);
}