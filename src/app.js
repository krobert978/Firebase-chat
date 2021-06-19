import './index.html';
import './scss/style.scss';
import firebase from 'firebase/app';
import 'firebase/firestore';
import config from './db_config.js';
import scrolIntoView from 'scroll-into-view-if-needed';


const firedb = firebase.initializeApp(config);
const db = firedb.firestore();

async function sendMessage(data) {
  const res = await db.collection('messages').add(data);
  document.querySelector('#message').value = '';
  console.log(res);
}

function displayMessage(ID, message) {
  console.log(ID, message)
  const messageDOM = `
      <div class="message" data-id="${ID}">
        <i class="fas fa-user"></i>
        <div>
          <span class="username">${message.username}
            <time>${message.date.toDate().toLocaleString()}</time>
          </span>
          <br>
          <span class="message-text">
            ${message.message}
          </span>
        </div>
        <div class="message-edit-buttons">
          <i class="fas fa-trash-alt"></i>
          <i class="fas fa-pen"></i>
        </div>
      </div>
  `;
  document.querySelector('#messages').insertAdjacentHTML('beforeend', messageDOM);
  scrolIntoView(document.querySelector('#messages'), {
    scrollMode: 'if-needed',
    block: 'end'
  });



  document.querySelector(`[data-id="${ID}"] .fa-trash-alt`).addEventListener('click', () => {
    removeMessage(ID);
    deleteMessage(ID)
  });
  document.querySelector(`[data-id="${ID}"] .fa-pen`).addEventListener('click', () => {
    displayEditMessage(ID, message);

  });
}

function createMessage() {
  const message = document.querySelector('#message').value;
  const username = document.querySelector('#nickname').value;
  const date = firebase.firestore.Timestamp.fromDate(new Date());

  // ha a változó neve ugyanaz mint a key amit létre akarunk hozni
  // az objectben akkor nem kell kétszer kiírni...
  return { message, username, date };
}


async function displayAllMessages() {
  const query = await db.collection('messages').orderBy('date', 'asc').get()
  query.forEach((doc) => {
    displayMessage(doc.id, doc.data());
  });

}

function handleMessage() {
  const message = createMessage();
  if (message.username && message.message) {
    sendMessage(message);
    // displayMessage(message);
  }
}

// amikor a html teljesen betölt: 
window.addEventListener('DOMContentLoaded', () => {
  // displayAllMessages(); 
  document.querySelector('#send').addEventListener('click', () => {
    handleMessage();
  });
});

document.addEventListener('keyup', (event) => {
  if (event.key === 'Enter') {
    handleMessage();
  }
});


// listen for changes in the database
db.collection('messages').orderBy('date', 'asc')
  .onSnapshot((snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === 'added') {
        displayMessage(change.doc.id, change.doc.data());
      }
      if (change.type === 'modified') {
        console.log('Modified message: ', change.doc.data());
      }
      if (change.type === 'removed') {
        console.log('Removed message: ', change.doc.id, change.doc.data());
        deleteMessage(change.doc.id)
      }
    });
  });

function removeMessage(ID) {
  document.querySelector(`[data-id="${ID}"]`).remove()

}

function deleteMessage(ID) {
  db.collection('messages').doc(ID).delete()

}
// bejegyzés szerkesztése
function displayEditMessage(ID, message) {
  console.log(ID, message)
  const markup = /*html*/`
  <div class="popup-container" id="popup">
    <div class="edit-message" id="edit-message" data-id="${ID}">
      <div id="close-popup" class="button">
        Close <i class="fa fa-window-close" aria-hidden="true"></i>
      </div>
      <textarea id="edit" name="" cols="30" rows="10">${document.querySelector(`.message[data-id="${ID}"] .message-text`).textContent.trim()
    }</textarea>
      <div id="save-message" class="button">
        Save message<i class="fas fa-save"></i>
      </div>
    </div>
  </div>
`;
  document.querySelector('#app').insertAdjacentHTML('beforeend', markup);
  // popup ablak bezárása
  document.querySelector(`.fa-window-close`).addEventListener('click', () => {
    document.querySelector(`.popup-container`).remove();
  });
  // új üzenet mentése
  document.querySelector(`.fa-save`).addEventListener('click', () => {
    const newMessage = document.querySelector(`#edit-message > textarea`).value
    document.querySelector(`.message[data-id="${ID}"] .message-text`).textContent = newMessage;
    document.querySelector(`.popup-container`).remove();
    modifyMessage(ID, newMessage);
  });
}
// új üzenet mentése a firebase-ben
async function modifyMessage(id, newMessage) {
  await db.collection('messages').doc(id).update({
    message: newMessage
  })
}