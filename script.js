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
const topic = sessionStorage.getItem('hangmanTopic');
const chooseLanguage = document.querySelector('.choose-language form');
const hangmanContainer = document.querySelector('.hangman-container');
const languages = document.querySelectorAll('input[name="lang"]');
const customSelect = document.querySelector('.custom-select-wrapper');
const topics = document.querySelectorAll('.custom-option');
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
const countdownMinute = document.getElementById('countdown-minute');
const countdownSecond = document.getElementById('countdown-second');
const secondContainer = document.querySelector('.second-container');
const stopwatchSecond = document.querySelector('.stopwatch-second');
let countdown = 120 * 1000;
let secondCount = 2;

const figureParts = document.querySelectorAll('.figure-part');
let isStart = JSON.parse(sessionStorage.getItem('isStart')) || false;
let gameStart = false;

const convertTopic = (topic) => {
  switch (topic) {
    case 'animals':
      return languageSelected === 'en' ? 'Animals' : 'Động vật';
    case 'foods':
      return languageSelected === 'en'
        ? 'Food and Cooking'
        : 'Đồ ăn và dụng cụ bếp';
    case 'nouns':
      return languageSelected === 'en' ? 'Nouns' : 'Danh từ';
    case 'characters':
      return languageSelected === 'en' ? 'Characters' : 'Nhân vật';
    default:
      return;
  }
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

window.addEventListener('DOMContentLoaded', function () {
  if (!isStart) {
    chooseLanguage.parentElement.classList.add('show');
  } else {
    hangmanContainer.classList.add('show');
    isStart = true;
  }
});

window.addEventListener('click', function (e) {
  const select = document.querySelector('.custom-select');
  if (!select.contains(e.target)) {
    select.classList.remove('open');
  }
});

let languageSelected = language || 'en';
let topicSelected = topic || 'animals';

const correctLetters = [];
const wrongLetters = [];

const fetchData = async () => {
  const res = await axios.get('/data/data.geojson');

  const words = res.data[topicSelected];

  return words;
};

const words = await fetchData();

let selectedWord = words[Math.floor(Math.random() * words.length)];

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

customSelect.addEventListener('click', function () {
  this.querySelector('.custom-select').classList.toggle('open');
});

topics.forEach((topic) => {
  if (topic.dataset.value === topicSelected) {
    const optionSelected = topic
      .closest('.custom-select')
      .querySelector('.custom-select__trigger span');

    topic.parentNode
      .querySelector('.custom-option.selected')
      .classList.remove('selected');
    topic.classList.add('selected');
    optionSelected.dataset.i18n = `topic.${topicSelected}`;
    optionSelected.textContent = convertTopic(topic.dataset.value);
  }

  topic.addEventListener('click', function () {
    if (!this.classList.contains('selected')) {
      topicSelected = this.dataset.value;

      this.parentNode
        .querySelector('.custom-option.selected')
        .classList.remove('selected');
      this.classList.add('selected');
      this.closest('.custom-select').querySelector(
        '.custom-select__trigger span'
      ).textContent = this.textContent;
    }
  });
});

chooseLanguage.addEventListener('submit', function (e) {
  e.preventDefault();

  sessionStorage.setItem('hangmanLang', languageSelected);
  sessionStorage.setItem('hangmanTopic', topicSelected);
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
  gameStart = false;
  secondContainer.style.animationName = '';
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
  countdown = 120 * 1000;
  secondCount = 0;
  countdownMinute.textContent = '02';
  countdownSecond.textContent = '00';
  gameStart = false;
  secondContainer.style.animationName = '';

  displayWord();
  displayWrongWord();
  displayHint();
};

const countdownTimer = setInterval(function () {
  if (!gameStart) {
    return;
  }

  secondCount += 1;
  countdown -= 1000;

  const minute = Math.floor((countdown % (1000 * 60 * 60)) / (1000 * 60));
  const second = Math.floor((countdown % (1000 * 60)) / 1000);

  countdownMinute.textContent = minute >= 10 ? minute : `0${minute}`;
  countdownSecond.textContent = second >= 10 ? second : `0${second}`;

  stopwatchSecond.style.transform = `rotateZ(${secondCount * 6}deg)`;

  if (countdown === 0) {
    clearInterval(countdownTimer);
    showPopup(false);
  }
}, 1000);

window.addEventListener('keydown', (e) => {
  if (e.keyCode === 13) {
    playNewGame();
  }

  if (wrongLetters.length !== figureParts.length && isStart) {
    if (e.keyCode >= 65 && e.keyCode <= 90) {
      gameStart = true;
      secondContainer.style.animationName = 'rotate';

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
