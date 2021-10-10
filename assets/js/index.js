const { ipcRenderer } = require('electron')

const storeBtn = document.querySelector('.store-cred-btn');
const nameElement = document.getElementById('name');
const identifierElement = document.getElementById('identifier');
const passwordElement = document.getElementById('password');
const tableBody = document.querySelector('.table-body');
const emptyTableText = document.querySelector('.empty-table-message');
var liveValidate = false;

storeBtn.addEventListener('click', storeCred);
nameElement.addEventListener('input', liveValidateTrigger);
identifierElement.addEventListener('input', liveValidateTrigger);
passwordElement.addEventListener('input', liveValidateTrigger);
ipcRenderer.on('store-response', (event, data) => handleStoreResponse(event, data));
ipcRenderer.on('credentials-response', (event, data) => populateCredentials(event, data));

getCredentials();

function getCredentials() {
    ipcRenderer.send('get-credentials');
}

function populateCredentials(event, data) {
    tableBody.innerHTML = '';

    if (!data.credentials || !data.credentials.length) {
        return emptyTableText.style.display = 'block';
    }
    emptyTableText.style.display = 'none';
    if (data.credentials) {
        for (let cred of data.credentials) {
            if (!Object.keys(cred).length) continue;
            const trTag = getTrTag(cred);
            tableBody.appendChild(trTag);
        }
    }
}

function storeCred(event) {

    event.preventDefault();
    const name = nameElement.value;
    const identifier = identifierElement.value;
    const password = passwordElement.value;
    
    const validated = validateForm(name, identifier, password);

    if (!validated) return false;
    const data = { name, identifier, password: window.btoa(password) };
    ipcRenderer.send('store-credentials', data);
    clearInputs();
    getCredentials();
}

function validateForm(name, identifier, password) {

    nameElement.style.borderColor = '#fff';
    identifierElement.style.borderColor = '#fff';
    passwordElement.style.borderColor = '#fff';

    if (!name) {
        nameElement.style.borderColor = '#F44336';
    }
    if (!identifier) {
        identifierElement.style.borderColor = '#F44336';
    }
    if (!password) {
        passwordElement.style.borderColor = '#F44336';
    }
    liveValidate = true;
    return name && identifier && password;
}

function liveValidateTrigger() {
    if (liveValidate) {
        const name = document.getElementById('name').value;
        const identifier = document.getElementById('identifier').value;
        const password = document.getElementById('password').value;
        validateForm(name, identifier, password);
    }
}

function handleStoreResponse(event, data) {
    const { success, message } = data;

    if (!success) {
        alert(message);
    }
}

function clearInputs() {
    liveValidate = false;
    nameElement.value = '';
    identifierElement.value = '';
    passwordElement.value = '';
}


function getTrTag(obj) {
    const tr = document.createElement('tr');

    const nameTd = document.createElement('td');
    const idTd = document.createElement('td');
    const pwTd = document.createElement('td');
    const actiontTd = document.createElement('td');
    const controlsDiv = document.createElement('div');
    const editButton = document.createElement('button');
    const deleteButton = document.createElement('button');

    nameTd.innerText = obj.name;
    idTd.innerText = obj.identifier;
    pwTd.innerText = obj.password;
    editButton.innerText = 'Edit';
    deleteButton.innerText = 'Delete';
    controlsDiv.classList.add('table-controls');
    controlsDiv.appendChild(editButton);
    controlsDiv.appendChild(deleteButton);
    actiontTd.appendChild(controlsDiv);

    tr.appendChild(nameTd);
    tr.appendChild(idTd);
    tr.appendChild(pwTd);
    tr.appendChild(actiontTd);
    return tr;
}