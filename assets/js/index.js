const { ipcRenderer } = require('electron')

const storeBtn = document.querySelector('.store-cred-btn');
const updateBtn = document.querySelector('.update-cred-btn');
const cancelBtn = document.querySelector('.cancel-cred-btn');
const nameElement = document.getElementById('name');
const identifierElement = document.getElementById('identifier');
const passwordElement = document.getElementById('password');
const tableBody = document.querySelector('.table-body');
const emptyTableText = document.querySelector('.empty-table-message');
var liveValidate = false;
var credentials = [];
var editingCred = false;

storeBtn.addEventListener('click', storeCred);
nameElement.addEventListener('keydown', liveValidateTrigger);
identifierElement.addEventListener('keydown', liveValidateTrigger);
passwordElement.addEventListener('keydown', liveValidateTrigger);
cancelBtn.addEventListener('click', () => triggerEditing(false));
updateBtn.addEventListener('click', updateCred);
ipcRenderer.on('store-response', (event, data) => handleResponse(event, data));
ipcRenderer.on('delete-response', (event, data) => handleResponse(event, data));
ipcRenderer.on('update-response', (event, data) => handleResponse(event, data));
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
        credentials = data.credentials;
        data.credentials.sort((a, b) => new Date(b.created) - new Date(a.created))
        for (let cred of data.credentials) {
            const trTag = getTrTag(cred);
            tableBody.appendChild(trTag);
        }
    }
    postDataEvents();
}

function storeCred() {

    const name = nameElement.value;
    const identifier = identifierElement.value;
    const password = passwordElement.value;
    const created = new Date();
    const updated = new Date();
    
    const validated = validateForm(name, identifier, password);

    if (!validated) return false;
    const data = {
        id: makeid(8),
        name,
        identifier,
        password: window.btoa(password),
        created,
        updated,
    };
    ipcRenderer.send('store-credentials', data);
    clearInputs();
    getCredentials();
    nameElement.focus();
}

function updateCred() {
    editingCred = false;
    const id = updateBtn.getAttribute('data-id');
    const name = nameElement.value;
    const identifier = identifierElement.value;
    const password = passwordElement.value;

    const validated = validateForm(name, identifier, password);
    if (!validated) return false;
    if (id) {
        ipcRenderer.send('update-credential', {
            name,
            identifier,
            password: window.btoa(password),
            id,
            updated: new Date(),
        })
        clearInputs();
        getCredentials();
        nameElement.focus();
    } else {
        alert('Failed to update');
    }
    updateBtn.removeAttribute('data-id');
}

function deleteCred(event) {
    if (confirm('Delete credential?')) {
        const id = event.target.getAttribute('data-id');
        ipcRenderer.send('delete-credential', id);
        getCredentials();
    }
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

function liveValidateTrigger(event) {
    if (event.key === 'Enter') {
        if (editingCred) {
            updateCred();
        } else {
            storeCred();
        }
    }
    if (liveValidate) {
        const name = document.getElementById('name').value;
        const identifier = document.getElementById('identifier').value;
        const password = document.getElementById('password').value;
        validateForm(name, identifier, password);
    }
}

function handleResponse(event, data) {
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
    const showPasswordBtn = document.createElement('button');

    nameTd.innerText = obj.name;
    idTd.innerText = obj.identifier;
    showPasswordBtn.innerText = 'Show';
    showPasswordBtn.setAttribute('data-hash', obj.password);
    showPasswordBtn.setAttribute('data-id', obj.id);
    showPasswordBtn.classList.add('show-pw-btn');
    pwTd.appendChild(showPasswordBtn);

    editButton.innerText = 'Edit';
    deleteButton.innerText = 'Delete';

    editButton.setAttribute('data-id', obj.id);
    deleteButton.setAttribute('data-id', obj.id);

    controlsDiv.classList.add('table-controls');
    editButton.classList.add('edit-btn');
    deleteButton.classList.add('delete-btn');

    controlsDiv.appendChild(editButton);
    controlsDiv.appendChild(deleteButton);

    actiontTd.appendChild(controlsDiv);

    tr.appendChild(nameTd);
    tr.appendChild(idTd);
    tr.appendChild(pwTd);
    tr.appendChild(actiontTd);
    return tr;
}


function makeid(length) {
    var result           = '';
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
   }
   return result;
}

function showPassword(event) {
    const hash = event.target.getAttribute('data-hash');
    if (hash) {
        return alert(window.atob(hash));
    }
    alert('Failed to decode');
}

function populateEditInputs(event) {
    const id = event.target.getAttribute('data-id');
    if (id) {
        const editCred = credentials.filter(c => c.id === id)[0];
        if (editCred) {
            triggerEditing(true, editCred);
        }
    }
}

function triggerEditing(editing, editCred = null) {

    enableDisableBtn(storeBtn, editing);
    enableDisableBtn(updateBtn, !editing);
    enableDisableBtn(cancelBtn, !editing);

    nameElement.value = editing ? editCred.name : '';
    identifierElement.value = editing ? editCred.identifier : '';
    passwordElement.value = editing ? window.atob(editCred.password) : '';

    updateBtn.setAttribute('data-id', editing ? editCred.id : '');
    editingCred = editing;
}


function enableDisableBtn(element, disable) {
    if (disable) {
        element.setAttribute('disabled', true);
    } else {
        element.removeAttribute('disabled');
    }
    element.style.opacity = disable ? '0.3' : '1';
    element.style.cursor = disable ? 'not-allowed' : 'pointer';
}

function postDataEvents() {
    const delBtns = document.querySelectorAll('.delete-btn');
    const showPwBtns = document.querySelectorAll('.show-pw-btn');
    const editBtns = document.querySelectorAll('.edit-btn');
    
    delBtns.forEach(el => {
        el.addEventListener('click', deleteCred);
    });
    showPwBtns.forEach(el => {
        el.addEventListener('click', showPassword);
    });
    editBtns.forEach(el => {
        el.addEventListener('click', populateEditInputs);
    });
}