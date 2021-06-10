import Translator from './translator.js';

let translator = new Translator({
  persist: false,
  languages: ['vi', 'en'],
  defaultLanguage: 'en',
  detectLanguage: true,
  filesLocation: '/i18n',
});

translator.load(sessionStorage.getItem('hangmanLang') || 'en');

document.querySelector('form').addEventListener('click', function (evt) {
  if (evt.target.tagName === 'INPUT') {
    translator.load(evt.target.value);
  }
});

const language = sessionStorage.getItem('hangmanLang');
const level = sessionStorage.getItem('hangmanLevel');
const chooseLanguage = document.querySelector('.choose-language form');
const hangmanContainer = document.querySelector('.hangman-container');
const languages = document.querySelectorAll('input[name="lang"]');
const levels = document.querySelectorAll('input[name="level"]');
const wordEl = document.getElementById('word');
const hintEl = document.getElementById('hint');
const wrongLettersEl = document.getElementById('wrong-letters');
const playAgainBtn = document.getElementById('play-again');
const popup = document.getElementById('popup-container');
const notification = document.getElementById('notification-container');
const messageWin = document.getElementById('message-win');
const messageLose = document.getElementById('message-lose');
const correctWordEl = document.getElementById('correct-word');
const wordMeaningEl = document.getElementById('word-meaning');
const changeOptionsBtn = document.getElementById('change-options');

const figureParts = document.querySelectorAll('.figure-part');
let isStart = JSON.parse(sessionStorage.getItem('isStart')) || false;

window.addEventListener('DOMContentLoaded', function () {
  if (!isStart) {
    chooseLanguage.parentElement.classList.add('show');
  } else {
    hangmanContainer.classList.add('show');
    isStart = true;
  }
});

const fetchData = async () => {
  const res = await axios.get('/data/data.geojson');

  console.log(res.data);
  const words = res.data['animals'].filter((word) => word.level === level);

  return words;
};

const words = await fetchData();

let selectedWord = words[Math.floor(Math.random() * words.length)];
let languageSelected = language || 'en';
let levelSelected = level || 'easy';

const correctLetters = [];
const wrongLetters = [];

languages.forEach((languageInput) => {
  if (language && languageInput.value === language) {
    languageInput.checked = true;
  } else if (languageInput.value === languageSelected) {
    languageInput.checked = true;
  }

  languageInput.addEventListener('change', function () {
    languageSelected = this.value;
  });
});

levels.forEach((levelInput) => {
  if (level && levelInput.value === level) {
    levelInput.checked = true;
  } else if (levelInput.value === levelSelected) {
    levelInput.checked = true;
  }

  levelInput.addEventListener('change', function () {
    levelSelected = this.value;
  });
});

chooseLanguage.addEventListener('submit', function (e) {
  e.preventDefault();

  sessionStorage.setItem('hangmanLang', languageSelected);
  sessionStorage.setItem('hangmanLevel', levelSelected);
  sessionStorage.setItem('isStart', true);

  isStart = true;
  this.parentElement.classList.remove('show');
  hangmanContainer.classList.add('show');
  location.reload();
});

const displayWord = () => {
  const wordDisplay = selectedWord[language];

  wordEl.innerHTML = `
    ${convertWord(wordDisplay)
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

  const hiddenWord = convertWord(wordDisplay)
    .split('')
    .filter((char) => char !== ' ')
    .join('');

  const innerWord = wordEl.innerText.replace(/\n/g, '');

  if (innerWord === hiddenWord) {
    showPopup(true);
  }
};

const displayWrongWord = () => {
  if (wrongLetters.length === figureParts.length) {
    showPopup(false);
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

const displayHint = () => {
const hintDisplay = selectedWord[language === 'en' ? 'hintEn' : 'hintVi'];
hintEl.textContent = hintDisplay;
};

const showPopup = (winning) => {
  const correctWord = selectedWord[language];
  const wordMeaning = selectedWord[language === 'en' ? 'vi' : 'en'];
  correctWordEl.textContent = correctWord;
  wordMeaningEl.textContent = wordMeaning;

  messageLose.style.display = winning ? 'none' : 'block';
  messageWin.style.display = winning ? 'block' : 'none';
  popup.classList.add('show');
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
displayHint();
};

const convertWord = (title) => {
  const newStr = title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .replace(/%/g, '')
    .replace(/-/g, '')
    .replace(/[^a-zA-Z 0-9]+/g, '')
    .replace(/\s+/g, ' ');
  return newStr;
};

window.addEventListener('keydown', (e) => {
  if (e.keyCode === 13) {
    playNewGame();
  }

  if (wrongLetters.length !== figureParts.length && isStart) {
    if (e.keyCode >= 65 && e.keyCode <= 90) {
      const letter = e.key;
      const wordDisplay = selectedWord[language];

      if (convertWord(wordDisplay).includes(letter)) {
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

changeOptionsBtn.addEventListener('click', function () {
  chooseLanguage.parentElement.classList.add('show');
  sessionStorage.removeItem('isStart');
});

if (isStart) {
  displayWord();
  displayWrongWord();
displayHint();
}
