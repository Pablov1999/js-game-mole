const settings = {
    'SHOW_MOLE_MIN_TIME': 1000, //ms
    'SHOW_MOLE_MAX_TIME': 1800, //ms
    'ROUND_DURATION': 10, // in seconds
    'ROUND_LOADER_DURATION': 3, // in seconds
    'DELAY_AFTER_ROUND_DURATION': 2, // in seconds
    'COMPLEXITY_RATIO': 250,
    'ATTEMPTS_PER_ROUND': 15,
    'ROUNDS': 3,
}

const messages = {
    'ROUND_SUCCESS': '👏 Good job! 👏',
    'ROUND_FAIL': 'You can do better!<br>😀😀😀',
    'GAME_SUCCESS': '🎉 Well Done 🎉',
    'GAME_FAIL': 'Better luck next time!<br>😛😛😛',
    'NO_ATTEMPTS': 'you\'ve used all attempts! 😛'
}

const cssClasses = {
    'SHOW_MOLE': 'active',
    'HIT_MOLE': 'hit',
    'GAME_IS_STARTED': 'is-started',
    'GAME_IS_FINISHED': 'is-finished',
    'GAME_IS_IN_PROGRESS': 'is-in-progress',
    'ROUND_IS_FINISHED': 'round-is-finished'
}

let previousActiveHole;
let roundStopped;
let gameFinished;
let totalScore;
let roundScore;
let round;
let attemptsLeft;

const game = document.getElementById('game');
const loader = game.querySelector('.loader');
const dashboard = game.querySelector('.dashboard');
const roundStoppedMessage = game.querySelector('.round-done .message');
const gameFinishedMessage = game.querySelector('.well-done');
const holes = game.querySelectorAll('.holes > div');
const moles = game.querySelectorAll('.mole');
const scoreContainer = game.querySelector('.score b');
const statsContainer = game.querySelector('.stats');
const timeContainer = game.querySelector('.time b');
const attemptsLeftContainer = game.querySelector('.attempts b');
const roundContainer = game.querySelector('.round b');
const nextRoundButton = document.getElementById('next-round-button');

const getShowMoleTime = (min, max) => Math.round(Math.random() * (max - min + 1) + min);

const getHole = (holes) => {
    const index = Math.floor(Math.random() * holes.length);
    if (index === previousActiveHole) {
        return getHole(holes);
    }
    previousActiveHole = index;
    return holes[index];
}

const hit = (event) => {
    const hole = event.target.parentElement;

    if (attemptsLeft > 0) {
        attemptsLeft--;
        if (attemptsLeft > 0) {
            attemptsLeftContainer.textContent = attemptsLeft;
        } else {
            attemptsLeftContainer.textContent = messages.NO_ATTEMPTS;
        }
    } else {
        return false;
    }

    if (attemptsLeft <= 0 || !event.isTrusted || !hole.classList.contains(cssClasses.SHOW_MOLE) || hole.classList.contains(cssClasses.HIT_MOLE)) {
        return false;
    }

    totalScore++;
    roundScore++;
    scoreContainer.textContent = totalScore;

    hole.classList.add(cssClasses.HIT_MOLE);
    document.querySelector('audio.hit').play();
    setTimeout(() => {
        hole.classList.remove(cssClasses.SHOW_MOLE);
    }, 1000);
}

const showMole = () => {
    const time = getShowMoleTime(settings.SHOW_MOLE_MIN_TIME - round * settings.COMPLEXITY_RATIO, settings.SHOW_MOLE_MAX_TIME - round * settings.COMPLEXITY_RATIO);
    const hole = getHole(holes);
    hole.classList.remove(cssClasses.HIT_MOLE);
    hole.classList.add(cssClasses.SHOW_MOLE);
    setTimeout(() => {
        hole.classList.remove(cssClasses.SHOW_MOLE);
        if (!roundStopped) {
            showMole();
        }
    }, time)
}


const startGame = () => {
    game.classList.add(cssClasses.GAME_IS_STARTED);
    roundScore = 0;
    showLoader()
        .then(
            () => {
                return new Promise(resolve => {
                    roundStopped = false;
                    attemptsLeft = settings.ATTEMPTS_PER_ROUND;
                    attemptsLeftContainer.textContent = attemptsLeft;
                    game.classList.add(cssClasses.GAME_IS_IN_PROGRESS);
                    runTimer(settings.ROUND_DURATION);
                    showMole();
                    setTimeout(() => {
                        stopGame();
                        game.classList.remove(cssClasses.GAME_IS_IN_PROGRESS);
                        resolve();
                    }, settings.ROUND_DURATION * 1000);
                })
            })
        .then(
            () => {
                if (!gameFinished) {
                    game.classList.add(cssClasses.ROUND_IS_FINISHED);
                    updateRoundStoppedMessage();
                    setTimeout(
                        () => game.classList.remove(cssClasses.ROUND_IS_FINISHED), settings.DELAY_AFTER_ROUND_DURATION * 1000
                    )
                }
            }
        );
}

const updateRoundStoppedMessage = () => {
    if (roundScore > 0) {
        roundStoppedMessage.innerHTML = messages.ROUND_SUCCESS;
    } else {
        roundStoppedMessage.innerHTML = messages.ROUND_FAIL;
    }
}

const updateGameFinishedMessage = () => {
    if (totalScore > 0) {
        gameFinishedMessage.innerHTML = messages.GAME_SUCCESS;
    } else {
        gameFinishedMessage.innerHTML = messages.GAME_FAIL;
    }
}

const runTimer = (value) => {
    timeContainer.textContent = value;
    if (value > 0) {
        setTimeout(
            () => runTimer(value - 1),
            1000
        )
    }
}

const stopGame = () => {
    roundStopped = true;
    game.classList.remove(cssClasses.GAME_IS_STARTED)
    round = round + 1;
    if (round > settings.ROUNDS) {
        gameFinished = true;
    }
    localStorage.setItem('totalScore', totalScore);
    localStorage.setItem('round', round);
    updateView();
}

const updateView = () => {
    dashboard.hidden = false;
    scoreContainer.textContent = totalScore;
    roundContainer.textContent = round;

    if (round > 1 && round <= settings.ROUNDS) {
        nextRoundButton.hidden = false;
    }

    if (gameFinished) {
        updateGameFinishedMessage();
        nextRoundButton.hidden = true;
        game.classList.add(cssClasses.GAME_IS_FINISHED);
    }
}

const resetGame = () => {
    game.classList.remove(cssClasses.GAME_IS_FINISHED);
    localStorage.removeItem('totalScore', totalScore);
    localStorage.removeItem('round', round);
    totalScore = 0;
    round = 1;
    gameFinished = false;
    updateView();
}

const showLoader = () => {
    return new Promise(resolve => {
        let counter = settings.ROUND_LOADER_DURATION;

        const runCounter = () => {
            loader.classList.remove("loader-animation");
            loader.offsetWidth; // trigger a reflow
            loader.classList.add("loader-animation");
            if (counter >= 0) {
                loader.textContent = (counter === 0) ? 'Go!' : counter;
                document.querySelector('audio.beep').play();
                counter = counter - 1;
                setTimeout(runCounter, 800);
            } else {
                loader.textContent = '';
                setTimeout(resolve(), 800);
            }
        }

        runCounter();
    });
}

const getStoredData = () => {
    totalScore = +localStorage.getItem('totalScore') || 0;
    round = +localStorage.getItem('round') || 1;
    if (round > settings.ROUNDS) {
        gameFinished = true;
    }
}

const init = () => {
    selfExamination();
    getStoredData();
    updateView();
    moles.forEach(mole => mole.addEventListener('click', hit));
}

const nextRound = () => {
    startGame();
}

const newGame = () => {
    resetGame();
    startGame();
}

const selfExamination = () => {
    console.log(`%cWhack-a-mole`, 'font-weight: bold; font-size: 18px');
    console.log(`https://github.com/rolling-scopes-school/tasks/blob/master/tasks/js30/js30-6.md\n\n`);

    console.log(`%cСамооценка:`, 'font-weight: bold;');
    console.log(`✅[10 баллов] => Разобраться в коде чужого проекта, понять его, воспроизвести исходное приложение`);

    console.log(`✅[10 баллов] => Дополнить исходный проект обязательным дополнительным функционалом, указанным в описании задания:
    + усложняющиеся уровни (3 раунда игры)
    + сохранение текущего уровня и набранного количества баллов в LocalStorage (сохранение происходит после завершения каждого раунда)
    + отображение уровня и баллов на странице игры после перезагрузки`);

    console.log(`✅[10 * 3 = 30 баллов] => Дополнить исходный проект дополнительным функционалом на выбор из тех, которые перечислены в описании задания, или придуманным вами самостоятельно:
    + добавлены звуки
    + ограничение на количество кликов в каждом раунде
    + прелоадер с обратным отсчетом перед началом игры`);

    console.log(`%cИтоговая оценка: 30 баллов`, 'font-weight: bold');
}