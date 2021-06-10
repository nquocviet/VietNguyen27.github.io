import Translator from './translator.js';

let translator = new Translator({
  persist: false,
  languages: ['vi', 'en'],
  defaultLanguage: 'en',
  detectLanguage: true,
  filesLocation: '/i18n',
});

translator.load(localStorage.getItem('hangmanLang') || 'en');

document.querySelector('form').addEventListener('click', function (evt) {
  if (evt.target.tagName === 'INPUT') {
    translator.load(evt.target.value);
  }
});

const words = [
  'programming',
  'developer',
  'function',
  'element',
  'document',
  'application',
  'interface',
];

const chooseLanguage = document.querySelector('.choose-language form');
const hangmanContainer = document.querySelector('.hangman-container');
const languages = document.querySelectorAll('input[name="lang"]');
const levels = document.querySelectorAll('input[name="level"]');
const wordEl = document.getElementById('word');
const wrongLettersEl = document.getElementById('wrong-letters');
const playAgainBtn = document.getElementById('play-again');
const popup = document.getElementById('popup-container');
const notification = document.getElementById('notification-container');
const messageWin = document.getElementById('message-win');
const messageLose = document.getElementById('message-lose');

const figureParts = document.querySelectorAll('.figure-part');

let selectedWord = words[Math.floor(Math.random() * words.length)];
let languageSelected = 'en';
let levelSelected = 'easy';
let isStart = false;

const correctLetters = [];
const wrongLetters = [];

window.addEventListener('load', function () {
  const language = localStorage.getItem('hangmanLang');
  const level = localStorage.getItem('hangmanLevel');

  if (!language && !level) {
    chooseLanguage.parentElement.classList.add('show');
  } else {
    hangmanContainer.classList.add('show');
    isStart = true;
  }
});

languages.forEach((language) => {
  language.addEventListener('change', function () {
    languageSelected = this.value;
  });
});

levels.forEach((level) => {
  level.addEventListener('change', function () {
    levelSelected = this.value;
  });
});

chooseLanguage.addEventListener('submit', function (e) {
  e.preventDefault();

  localStorage.setItem('hangmanLang', languageSelected);
  localStorage.setItem('hangmanLevel', levelSelected);

  isStart = true;
  this.parentElement.classList.remove('show');
  hangmanContainer.classList.add('show');
});

const displayWord = () => {
  wordEl.innerHTML = `
    ${selectedWord
      .split('')
      .map((letter) => {
        if (letter === ' ') {
          return '<span class="letter space"></span>';
        } else {
          return `
        <span class="letter">
          ${correctLetters.includes(letter) ? letter : ''}
        </span>
      `;
        }
      })
      .join('')}
  `;

  const hiddenWord = selectedWord
    .split('')
    .filter((char) => char !== ' ')
    .join('');

  const innerWord = wordEl.innerText.replace(/\n/g, '');

  if (innerWord === hiddenWord) {
    messageWin.style.display = 'block';
    messageLose.style.display = 'none';
    popup.classList.add('show');
  }
};

const displayWrongWord = () => {
  if (wrongLetters.length === figureParts.length) {
    messageLose.style.display = 'block';
    messageWin.style.display = 'none';
    popup.classList.add('show');
  }

  wrongLettersEl.innerHTML = `
          <span>
          ${wrongLetters.map((letter) => ` ${letter}`)}
          </span>
        `;

  figureParts.forEach((part, index) => {
    const errors = wrongLetters.length;

    if (index < errors) {
      part.style.display = 'block';
    } else {
      part.style.display = 'none';
    }
  });
};

const showNotification = () => {
  notification.classList.add('show');

  setTimeout(() => {
    notification.classList.remove('show');
  }, 2000);
};

const playNewGame = () => {
  popup.classList.remove('show');
  selectedWord = words[Math.floor(Math.random() * words.length)];
  correctLetters.splice(0);
  wrongLetters.splice(0);

  displayWord();
  displayWrongWord();
};

window.addEventListener('keydown', (e) => {
  if (e.keyCode === 13) {
    playNewGame();
  }

  if (wrongLetters.length !== figureParts.length && isStart) {
    if (e.keyCode >= 65 && e.keyCode <= 90) {
      const letter = e.key;

      if (selectedWord.includes(letter)) {
        if (!correctLetters.includes(letter)) {
          correctLetters.push(letter);

          displayWord();
        } else {
          showNotification();
        }
      } else {
        if (!wrongLetters.includes(letter)) {
          wrongLetters.push(letter);

          displayWrongWord();
        } else {
          showNotification();
        }
      }
    }
  }
});

playAgainBtn.addEventListener('click', function () {
  playNewGame();
});

displayWord();
displayWrongWord();
