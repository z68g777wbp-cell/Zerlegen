const BLOCK_SIZE = 20;
const LEVEL_6_BLOCK_SIZE = 10;
let seenTasks = new Set();

function getBlockSize() {
  return currentLevel === 6 ? LEVEL_6_BLOCK_SIZE : BLOCK_SIZE;
}

const HELP_TIMES = {
  slow: 4000,
  medium: 2500,
  fast: 1500
};


/* ==================================================
   AKTUELLER ARBEITSBLOCK
================================================== */

let currentTask = null;
let currentLevel = 6;
let currentSpeed = "slow";

let gameStarted = false;
let blockFinished = false;
let dayFinished = false;

let blockTasks = 0;
let blockRight = 0;
let blockWrong = 0;

let blockStartTime = 0;
let blockElapsedSeconds = 0;
let blockTimerInterval = null;


/* ==================================================
   GESAMTERFOLG
================================================== */

const successData = loadSuccessData();


function loadSuccessData() {

  try {

    const saved =
      localStorage.getItem(
        "zerlegenSuccessData"
      );

    if (!saved) {

      return {
        blocks: [],
        totalRight: 0,
        totalWrong: 0,
        stars: 0
      };

    }

    const data =
      JSON.parse(saved);

    return {

      blocks:
        Array.isArray(data.blocks)
          ? data.blocks
          : [],

      totalRight:
        Number.isFinite(data.totalRight)
          ? data.totalRight
          : 0,

      totalWrong:
        Number.isFinite(data.totalWrong)
          ? data.totalWrong
          : 0,

      stars:
        Number.isFinite(data.stars)
          ? Math.min(3, Math.max(0, data.stars))
          : 0

    };

  } catch (error) {

    return {
      blocks: [],
      totalRight: 0,
      totalWrong: 0,
      stars: 0
    };

  }

}


function saveSuccessData() {

  try {

    localStorage.setItem(
      "zerlegenSuccessData",
      JSON.stringify(successData)
    );

  } catch (error) {

    // Die App funktioniert auch ohne localStorage.
  }

}


/* ==================================================
   STERNE AUS DEM GESAMTERFOLG LADEN
================================================== */

let earnedStars =
  successData.stars;


/* ==================================================
   SONSTIGE VARIABLEN
================================================== */

let repeatingTask = false;

let checkTimeout = null;

let helpTimeout = null;
let helpRestoreTimeout = null;

let hadInputThisTask = false;


/* ==================================================
   DOM
================================================== */

const startButton =
  document.getElementById("start-btn");

const keypad =
  document.getElementById("keypad");

const answerInput =
  document.getElementById("answer");

const blockResult =
  document.getElementById("block-result");

const nextBlockButton =
  document.getElementById("next-block-btn");

const timerDisplay =
  document.getElementById("timer");

const rightDisplay =
  document.getElementById("cRight");

const wrongDisplay =
  document.getElementById("cWrong");

const btn6 =
  document.getElementById("btn6");

const btn10 =
  document.getElementById("btn10");

const starsContainer =
  document.getElementById("stars");


/* ==================================================
   ZAHLENTASTATUR
================================================== */

function enableKeypad() {

  keypad.style.pointerEvents =
    "auto";

  keypad.style.opacity =
    "1";

  keypad.classList.remove(
    "disabled"
  );

}


function disableKeypad() {

  keypad.style.pointerEvents =
    "none";

  keypad.style.opacity =
    "0.45";

  keypad.classList.add(
    "disabled"
  );

}


/* ==================================================
   EINGABEFELD
================================================== */

function activateInput() {

  answerInput.disabled =
    false;

  answerInput.readOnly =
    false;

  answerInput.value =
    "";

  answerInput.className =
    "";

}


function deactivateInput() {

  answerInput.disabled =
    true;

  answerInput.readOnly =
    true;

}


/* ==================================================
   TIMER – PRO ARBEITSBLOCK
================================================== */

function startBlockTimer() {

  clearInterval(
    blockTimerInterval
  );

  blockStartTime =
    Date.now();

  blockElapsedSeconds =
    0;

  updateTimer();


  blockTimerInterval =
    setInterval(() => {

      if (
        !gameStarted ||
        blockFinished ||
        dayFinished
      ) {
        return;
      }


      blockElapsedSeconds =
        Math.floor(
          (Date.now() - blockStartTime) / 1000
        );


      updateTimer();

    }, 200);

}


function stopBlockTimer() {

  clearInterval(
    blockTimerInterval
  );

  blockTimerInterval =
    null;


  if (blockStartTime) {

    blockElapsedSeconds =
      Math.floor(
        (Date.now() - blockStartTime) / 1000
      );

  }


  updateTimer();

}


function updateTimer() {

  const minutes =
    Math.floor(
      blockElapsedSeconds / 60
    );

  const seconds =
    blockElapsedSeconds % 60;


  timerDisplay.textContent =
    `${minutes}:${String(seconds).padStart(2, "0")}`;

}


function formatTime(seconds) {

  const minutes =
    Math.floor(
      seconds / 60
    );

  const rest =
    seconds % 60;


  return `${minutes}:${String(rest).padStart(2, "0")}`;

}


/* ==================================================
   SICHTBARE BLOCKSTATISTIK
================================================== */

function resetVisibleBlockStats() {

  seenTasks = new Set();

  blockTasks =
    0;

  blockRight =
    0;

  blockWrong =
    0;

  blockElapsedSeconds =
    0;


  rightDisplay.textContent =
    "0";

  wrongDisplay.textContent =
    "0";

  timerDisplay.textContent =
    "0:00";

}


function updateVisibleCounters() {

  rightDisplay.textContent =
    String(blockRight);

  wrongDisplay.textContent =
    String(blockWrong);

}


/* ==================================================
   HILFS-TIMER
================================================== */

function clearHelpTimers() {

  clearTimeout(
    helpTimeout
  );

  clearTimeout(
    helpRestoreTimeout
  );

  helpTimeout =
    null;

  helpRestoreTimeout =
    null;

}


function startHelpTimer() {

  clearHelpTimers();


  if (
    !gameStarted ||
    blockFinished ||
    dayFinished
  ) {
    return;
  }


  hadInputThisTask =
    false;


  helpTimeout =
    setTimeout(() => {

      if (
        hadInputThisTask ||
        !gameStarted ||
        blockFinished ||
        dayFinished
      ) {
        return;
      }


      const cover =
        document.getElementById(
          "cover"
        );


      if (!cover) {
        return;
      }


      cover.style.opacity =
        "0";


      helpRestoreTimeout =
        setTimeout(() => {

          if (
            hadInputThisTask ||
            !gameStarted ||
            blockFinished ||
            dayFinished
          ) {
            return;
          }


          const currentCover =
            document.getElementById(
              "cover"
            );


          if (currentCover) {

            currentCover.style.opacity =
              "1";

          }

        }, 1000);


    }, HELP_TIMES[currentSpeed]);

}


function registerInteraction() {

  if (
    !gameStarted ||
    blockFinished ||
    dayFinished
  ) {
    return;
  }


  hadInputThisTask =
    true;


  clearHelpTimers();


  const cover =
    document.getElementById(
      "cover"
    );


  if (cover) {

    cover.style.opacity =
      "1";

  }

}


/* ==================================================
   AUFGABE ERZEUGEN
================================================== */

function generateTask() {

  if (
    !gameStarted ||
    blockFinished ||
    dayFinished
  ) {
    return;
  }

  clearHelpTimers();

  const min = currentLevel === 6 ? 3 : 7;
  const max = currentLevel === 6 ? 6 : 10;
  const availableTasks = [];

  // Alle möglichen Zerlegeaufgaben des Levels sammeln.
  for (let y = min; y <= max; y++) {
    for (let x = 1; x < y; x++) {
      const key = `${x}-${y}`;
      if (!seenTasks.has(key)) {
        availableTasks.push({ x, y, key });
      }
    }
  }

  // Sicherheitsnetz, falls ein Level vollständig ausgeschöpft ist.
  if (availableTasks.length === 0) {
    evaluateBlock();
    return;
  }

  const selected = availableTasks[
    Math.floor(Math.random() * availableTasks.length)
  ];
  seenTasks.add(selected.key);

  currentTask = {
    x: selected.x,
    y: selected.y
  };

  repeatingTask = false;
  renderTask();
  startHelpTimer();
}

/* ==================================================
   AUFGABE DARSTELLEN
================================================== */

function renderTask() {

  if (!currentTask) {
    return;
  }


  const x =
    currentTask.x;

  const y =
    currentTask.y;


  const container =
    document.getElementById(
      "dots-container"
    );


  container.innerHTML =
    "";


  const dots = [];


  /* -----------------------------------------------
     PUNKTE
  ------------------------------------------------ */

  for (
    let i = 0;
    i < y;
    i++
  ) {

    const dot =
      document.createElement(
        "div"
      );


    dot.className =
      "dot";


    if (i < 5) {

      dot.classList.add(
        "blue"
      );

    } else {

      dot.classList.add(
        "red"
      );

    }


    if (i === 4) {

      dot.classList.add(
        "break"
      );

    }


    container.appendChild(
      dot
    );


    dots.push(dot);

  }


  /* -----------------------------------------------
     FEHLENDER TEIL
  ------------------------------------------------ */

  const missing =
    y - x;


  let hiddenDots;


  if (
    missing <= y / 2
  ) {

    hiddenDots =
      dots.slice(
        y - missing
      );

  } else {

    hiddenDots =
      dots.slice(
        0,
        missing
      );

  }


  /* -----------------------------------------------
     GOLDENE ABDECKUNG
  ------------------------------------------------ */

  const cover =
    document.createElement(
      "div"
    );


  cover.id =
    "cover";


  container.appendChild(
    cover
  );


  requestAnimationFrame(() => {

    if (
      !hiddenDots ||
      hiddenDots.length === 0
    ) {
      return;
    }


    const first =
      hiddenDots[0]
        .getBoundingClientRect();


    const last =
      hiddenDots[
        hiddenDots.length - 1
      ]
      .getBoundingClientRect();


    const rect =
      container.getBoundingClientRect();


    cover.style.left =
      `${first.left - rect.left}px`;


    cover.style.width =
      `${last.right - first.left}px`;


    cover.style.top =
      `${first.top - rect.top - 6}px`;


    cover.style.height =
      "40px";


    cover.style.opacity =
      "1";

  });


  /* -----------------------------------------------
     RECHENAUFGABE
  ------------------------------------------------ */

  document.getElementById(
    "x"
  ).textContent =
    String(x);


  document.getElementById(
    "y"
  ).textContent =
    String(y);


  answerInput.value =
    "";

  answerInput.className =
    "";


  activateInput();


  setTimeout(() => {

    if (
      gameStarted &&
      !blockFinished &&
      !dayFinished
    ) {

      answerInput.focus();

    }

  }, 50);

}


/* ==================================================
   ANTWORT PRÜFEN
================================================== */

function checkAnswer() {

  if (
    !gameStarted ||
    blockFinished ||
    dayFinished ||
    !currentTask
  ) {
    return;
  }


  const entered =
    answerInput.value.trim();


  if (
    entered === ""
  ) {
    return;
  }


  const value =
    Number(entered);


  const correct =
    value ===
    currentTask.y -
    currentTask.x;


  /* =================================================
     RICHTIG
  ================================================= */

  if (correct) {

    clearHelpTimers();


    answerInput.className =
      "correct";


    /*
      Nur der Erstversuch zählt.
    */

    if (
      !repeatingTask
    ) {

      blockTasks++;

      blockRight++;


      /*
        Gesamterfolg.
      */

      successData.totalRight++;


      updateVisibleCounters();

      saveSuccessData();

    }


    repeatingTask =
      false;


    /*
      20 Erstversuche abgeschlossen.
    */

    if (
      blockTasks >= getBlockSize()
    ) {

      stopBlockTimer();

      deactivateInput();

      disableKeypad();


      setTimeout(() => {

        evaluateBlock();

      }, 650);


      return;
    }


    /*
      Nächste Aufgabe.
    */

    setTimeout(() => {

      generateTask();

    }, 650);


    return;

  }


  /* =================================================
     FALSCH
  ================================================= */

  answerInput.className =
    "wrong";


  /*
    Nur der erste Versuch
    zählt als falsch.
  */

  if (
    !repeatingTask
  ) {

    blockTasks++;

    blockWrong++;


    successData.totalWrong++;


    updateVisibleCounters();

    saveSuccessData();


    /*
      Dieselbe Aufgabe wiederholen.
    */

    repeatingTask =
      true;

  }


  clearHelpTimers();


  const cover =
    document.getElementById(
      "cover"
    );


  if (cover) {

    cover.style.opacity =
      "0";

  }


  /*
    Eingabe löschen.
  */

  setTimeout(() => {

    answerInput.value =
      "";

    answerInput.className =
      "";

    answerInput.focus();

  }, 350);


  /*
    Nach 1 Sekunde wieder sichtbar.
  */

  setTimeout(() => {

    if (
      !gameStarted ||
      blockFinished ||
      dayFinished
    ) {
      return;
    }


    const currentCover =
      document.getElementById(
        "cover"
      );


    if (currentCover) {

      currentCover.style.opacity =
        "1";

    }


    startHelpTimer();

    answerInput.focus();

  }, 1000);

}


/* ==================================================
   STERN VERDIENT
================================================== */

function earnStar() {

  /*
    Maximal 3 Sterne.
  */

  if (
    earnedStars >= 3
  ) {
    return;
  }


  earnedStars++;


  successData.stars =
    earnedStars;


  saveSuccessData();


  renderEarnedStars();


  /*
    Beim dritten Stern:
    Arbeitstag beenden.
  */

  if (
    earnedStars >= 3
  ) {

    finishDay();

  }

}


/* ==================================================
   STERNE ANZEIGEN
================================================== */

function renderEarnedStars() {

  /*
    Vorhandene dynamische Sterne entfernen.
  */

  starsContainer
    .querySelectorAll(
      ".earned-star"
    )
    .forEach(
      star => star.remove()
    );


  /*
    Die beiden SVGs im HTML dienen
    nur als Vorlagen.
  */

  const template6 =
    document.getElementById(
      "star6"
    );

  const template10 =
    document.getElementById(
      "star10"
    );


  if (template6) {

    template6.style.display =
      "none";

  }


  if (template10) {

    template10.style.display =
      "none";

  }


  for (
    let i = 0;
    i < earnedStars;
    i++
  ) {

    const template =
      currentLevel === 10
        ? template10
        : template6;


    if (!template) {
      continue;
    }


    const star =
      template.cloneNode(
        true
      );


    star.id =
      `earned-star-${i + 1}`;


    star.classList.add(
      "earned-star"
    );


    star.style.display =
      "block";


    star.style.width =
      "54px";


    star.style.height =
      "54px";


    /*
      Alle verdienten Sterne
      normal groß anzeigen.
    */

    star.classList.remove(
      "star-small",
      "star-medium",
      "star-large"
    );


    starsContainer.appendChild(
      star
    );

  }

}


/* ==================================================
   STERNE VERSTECKEN
   Nur die Vorlage verstecken.
================================================== */

function hideStars() {

  const star6 =
    document.getElementById(
      "star6"
    );

  const star10 =
    document.getElementById(
      "star10"
    );


  if (star6) {

    star6.style.display =
      "none";

  }


  if (star10) {

    star10.style.display =
      "none";

  }

}


/* ==================================================
   NEUEN STERNENBLOCK ERZEUGEN
================================================== */

function showBlockStar() {

  /*
    Der Stern selbst wird jetzt
    dauerhaft als zusätzlicher
    Stern gespeichert.
  */

  earnStar();

}


/* ==================================================
   BLOCK AUSWERTEN
================================================== */

function evaluateBlock() {

  blockFinished =
    true;


  stopBlockTimer();

  clearHelpTimers();

  deactivateInput();

  disableKeypad();


  const blockTime =
    blockElapsedSeconds;


  let starType =
    "none";


  /*
    Sterne gibt es nur bei 20/20.
  */

  if (
    blockRight === getBlockSize()
  ) {

    if (
      blockTime < 91
    ) {

      starType =
        "large";

    } else if (
      blockTime < 121
    ) {

      starType =
        "medium";

    } else if (
      blockTime < 150
    ) {

      starType =
        "small";

    }

  }


  /*
    Block speichern.
  */

  successData.blocks.push({

    level:
      currentLevel,

    right:
      blockRight,

    wrong:
      blockWrong,

    time:
      blockTime,

    star:
      starType,

    date:
      new Date().toISOString()

  });


  saveSuccessData();


  /* -----------------------------------------------
     AUSWERTUNGSFELD
  ------------------------------------------------ */

  const title =
    blockResult.querySelector(
      ".result-title"
    );


  const number =
    blockResult.querySelector(
      ".result-number"
    );


  const text =
    blockResult.querySelector(
      ".result-text"
    );


  const time =
    blockResult.querySelector(
      ".result-time"
    );


  title.textContent =
    "";

  number.textContent =
    "";

  text.textContent =
    "";

  time.textContent =
    "";


  blockResult.classList.remove(
    "perfect",
    "failed"
  );


  /* =================================================
     20/20
  ================================================= */

  if (
    blockRight === getBlockSize()
  ) {

    blockResult.classList.add(
      "perfect"
    );


    title.textContent =
      "🎉 Prima!";


    text.textContent =
      "Alle Aufgaben richtig!";


    time.textContent =
      "";


    /*
      Wenn die Zeitbedingung
      erfüllt wurde, kommt ein
      weiterer Stern dazu.
    */

    if (
      starType !== "none"
    ) {

      showBlockStar();

    }


    /*
      Nach dem dritten Stern
      ist der heutige Übungstag
      beendet.
    */

    if (
      earnedStars >= 3
    ) {

      title.textContent =
        "🌟 Genug für heute!";


      text.textContent =
        "Du hast 3 Sterne gesammelt!";


      time.textContent =
        "";


      nextBlockButton.style.display =
        "none";

    }


    /*
      Noch nicht 3 Sterne:
      normal weiter.
    */

    else {

      /*
        Großer Stern bei Stufe 6:
        nächste Stufe 10.
      */

      if (
        currentLevel === 6 &&
        starType === "large"
      ) {

        currentLevel =
          10;


        setActiveLevelButton();


        nextBlockButton.textContent =
          "Weiter mit Stufe 10";

      } else {

        nextBlockButton.textContent =
          "Weiter";

      }


      nextBlockButton.style.display =
        "inline-flex";

    }

  }


  /* =================================================
     NICHT ALLE RICHTIG
  ================================================= */

  else {

    blockResult.classList.add(
      "failed"
    );


    /*
      Nur das Ergebnis.
    */

    title.textContent =
      "";


    number.textContent =
      String(blockRight);


    text.textContent =
      `von ${getBlockSize()} Aufgaben richtig.`;


    time.textContent =
      "";


    /*
      Keine Sternvergabe.
    */

    nextBlockButton.textContent =
      "Weiter";


    nextBlockButton.style.display =
      "inline-flex";

  }


  blockResult.style.display =
    "flex";

  // Rückmeldung richtet sich nach dem Ergebnis.
  const scoreForAnimation = blockRight;
  const starRainThreshold = currentLevel === 6 ? 9 : 19;
  const thumbThreshold = currentLevel === 6 ? 7 : 17;

  if (scoreForAnimation >= starRainThreshold) {
    setTimeout(createStarRain, 250);
  } else if (scoreForAnimation >= thumbThreshold) {
    setTimeout(createThumbUp, 250);
  }

}


function createThumbUp() {
  const old = document.getElementById("result-thumb");
  if (old) old.remove();

  const rect = answerInput.getBoundingClientRect();
  const thumb = document.createElement("div");
  thumb.id = "result-thumb";
  thumb.textContent = "👍";
  Object.assign(thumb.style, {
    position: "fixed",
    left: `${rect.left + rect.width / 2}px`,
    top: `${rect.top - 12}px`,
    transform: "translate(-50%, -100%) scale(0.4)",
    fontSize: "64px",
    lineHeight: "1",
    pointerEvents: "none",
    zIndex: "10000",
    opacity: "0",
    transition: "transform 450ms ease-out, opacity 450ms ease-out"
  });
  document.body.appendChild(thumb);
  requestAnimationFrame(() => {
    thumb.style.transform = "translate(-50%, -100%) scale(1)";
    thumb.style.opacity = "1";
  });
  setTimeout(() => {
    thumb.style.opacity = "0";
    thumb.style.transform = "translate(-50%, -130%) scale(0.8)";
  }, 1400);
  setTimeout(() => thumb.remove(), 1900);
}


/* ==================================================
   STERNENREGEN
================================================== */

function createStarRain() {

  const rain =
    document.createElement(
      "div"
    );


  rain.id =
    "star-rain";


  /*
    Alles direkt per JavaScript,
    damit kein zusätzliches CSS
    notwendig ist.
  */

  rain.style.position =
    "fixed";

  rain.style.left =
    "0";

  rain.style.top =
    "0";

  rain.style.width =
    "100vw";

  rain.style.height =
    "100vh";

  rain.style.pointerEvents =
    "none";

  rain.style.overflow =
    "hidden";

  rain.style.zIndex =
    "9999";


  document.body.appendChild(
    rain
  );


  const symbols = [
    "⭐",
    "🌟",
    "✨"
  ];


  for (
    let i = 0;
    i < 70;
    i++
  ) {

    const star =
      document.createElement(
        "div"
      );


    star.textContent =
      symbols[
        Math.floor(
          Math.random() *
          symbols.length
        )
      ];


    star.style.position =
      "absolute";


    star.style.left =
      `${Math.random() * 100}%`;


    star.style.top =
      `${-10 - Math.random() * 30}%`;


    star.style.fontSize =
      `${18 + Math.random() * 24}px`;


    star.style.opacity =
      `${0.75 + Math.random() * 0.25}`;


    star.style.transform =
      `rotate(${Math.random() * 360}deg)`;


    const duration =
      2.5 +
      Math.random() * 2.5;


    const delay =
      Math.random() * 1.5;


    star.style.transition =
      `top ${duration}s linear, transform ${duration}s linear`;


    rain.appendChild(
      star
    );


    /*
      Startposition setzen,
      dann fallen lassen.
    */

    setTimeout(() => {

      star.style.top =
        "110%";


      star.style.transform =
        `translateX(${
          -80 + Math.random() * 160
        }px)
         rotate(${
          360 + Math.random() * 720
        }deg)`;

    }, 50 + delay * 1000);

  }


  /*
    Sternenregen nach einigen
    Sekunden entfernen.
  */

  setTimeout(() => {

    rain.remove();

  }, 6500);

}


/* ==================================================
   GENUG FÜR HEUTE
================================================== */

function finishDay() {

  dayFinished =
    true;

  gameStarted =
    false;

  blockFinished =
    true;


  clearHelpTimers();

  stopBlockTimer();

  deactivateInput();

  disableKeypad();


  /*
    Keine weiteren Aufgaben.
  */

  currentTask =
    null;


  /*
    Aufgabe entfernen.
  */

  const dotsContainer =
    document.getElementById(
      "dots-container"
    );


  if (dotsContainer) {

    dotsContainer.innerHTML =
      "";

  }


  document.getElementById(
    "x"
  ).textContent =
    "";


  document.getElementById(
    "y"
  ).textContent =
    "";


  answerInput.value =
    "";


  /*
    Sternenregen.
  */

  setTimeout(() => {

    createStarRain();

  }, 250);


  /*
    Auswertungsfenster
    entsprechend gestalten.
  */

  const title =
    blockResult.querySelector(
      ".result-title"
    );


  const number =
    blockResult.querySelector(
      ".result-number"
    );


  const text =
    blockResult.querySelector(
      ".result-text"
    );


  const time =
    blockResult.querySelector(
      ".result-time"
    );


  title.textContent =
    "🌟 Genug für heute!";


  number.textContent =
    "3";


  text.textContent =
    "Du hast 3 Sterne gesammelt!";


  time.textContent =
    "";


  blockResult.classList.remove(
    "failed"
  );


  blockResult.classList.add(
    "perfect"
  );


  nextBlockButton.style.display =
    "none";


  blockResult.style.display =
    "flex";

}


/* ==================================================
   STUFE
================================================== */

function setActiveLevelButton() {

  btn6.classList.toggle(
    "active",
    currentLevel === 6
  );


  btn10.classList.toggle(
    "active",
    currentLevel === 10
  );

}


/* ==================================================
   START
================================================== */

function startGame() {

  /*
    Wenn bereits 3 Sterne
    gesammelt wurden, keine
    weiteren Aufgaben.
  */

  if (
    earnedStars >= 3
  ) {

    finishDay();

    return;

  }


  gameStarted =
    true;

  blockFinished =
    false;

  dayFinished =
    false;


  blockResult.style.display =
    "none";


  resetVisibleBlockStats();


  repeatingTask =
    false;


  startButton.style.display =
    "none";


  enableKeypad();

  activateInput();

  setActiveLevelButton();


  /*
    Neue Blockzeit.
  */

  startBlockTimer();


  /*
    Erste Aufgabe.
  */

  generateTask();

}


/* ==================================================
   NÄCHSTER BLOCK
================================================== */

function startNewBlock() {

  /*
    Nach 3 Sternen ist Schluss.
  */

  if (
    earnedStars >= 3 ||
    dayFinished
  ) {

    finishDay();

    return;

  }


  blockResult.style.display =
    "none";


  gameStarted =
    true;

  blockFinished =
    false;


  resetVisibleBlockStats();


  repeatingTask =
    false;


  enableKeypad();

  activateInput();

  setActiveLevelButton();


  /*
    Neue Blockzeit.
  */

  startBlockTimer();


  /*
    Neue Aufgabe.
  */

  generateTask();

}


/* ==================================================
   STUFE WECHSELN
================================================== */

function setLevel(level) {

  /*
    Nach 3 Sternen keine Aufgaben
    mehr.
  */

  if (
    earnedStars >= 3 ||
    dayFinished
  ) {

    return;

  }


  currentLevel =
    level;


  setActiveLevelButton();


  /*
    Manueller Stufenwechsel während
    eines laufenden Blocks beginnt
    einen neuen Block.
  */

  if (
    gameStarted &&
    !blockFinished
  ) {

    clearHelpTimers();


    resetVisibleBlockStats();


    repeatingTask =
      false;


    startBlockTimer();


    generateTask();

  }

}


/* ==================================================
   GESCHWINDIGKEIT
================================================== */

function setSpeed(speed) {

  currentSpeed =
    speed;


  document
    .querySelectorAll(
      ".speed-btn"
    )
    .forEach(
      button => {

        button.classList.remove(
          "active"
        );

      }
    );


  let id;


  if (
    speed === "slow"
  ) {

    id =
      "speedSlow";

  } else if (
    speed === "medium"
  ) {

    id =
      "speedMedium";

  } else {

    id =
      "speedFast";

  }


  document
    .getElementById(id)
    .classList.add(
      "active"
    );


  if (
    gameStarted &&
    !blockFinished &&
    !dayFinished
  ) {

    startHelpTimer();

  }

}


/* ==================================================
   ZAHLENTASTATUR
================================================== */

function createKeypad() {

  keypad.innerHTML =
    "";


  /*
    Kein Haken mehr.
  */

  const keys = [

    "1", "2", "3",

    "4", "5", "6",

    "7", "8", "9",

    "⌫", "0"

  ];


  keys.forEach(
    key => {

      const button =
        document.createElement(
          "button"
        );


      button.type =
        "button";


      button.className =
        "key";


      button.textContent =
        key;


      if (
        key === "⌫"
      ) {

        button.classList.add(
          "delete"
        );

      }


      button.addEventListener(
        "click",
        () => {

          if (
            !gameStarted ||
            blockFinished ||
            dayFinished
          ) {
            return;
          }


          registerInteraction();


          /*
            Löschen.
          */

          if (
            key === "⌫"
          ) {

            clearTimeout(
              checkTimeout
            );


            answerInput.value =
              answerInput.value.slice(
                0,
                -1
              );


            answerInput.className =
              "";


            answerInput.focus();


            return;

          }


          /*
            Zahl eingeben.
          */

          if (
            answerInput.value.length < 2
          ) {

            answerInput.value +=
              key;


            answerInput.className =
              "";


            /*
              Automatische Prüfung
              nach 0,25 Sekunden.
            */

            clearTimeout(
              checkTimeout
            );


            checkTimeout =
              setTimeout(
                checkAnswer,
                250
              );

          }


          answerInput.focus();

        }
      );


      keypad.appendChild(
        button
      );

    }
  );

}


/* ==================================================
   DIREKTE TASTATUREINGABE
================================================== */

answerInput.addEventListener(
  "input",
  () => {

    if (
      !gameStarted ||
      blockFinished ||
      dayFinished
    ) {
      return;
    }


    registerInteraction();


    /*
      Nur Ziffern.
    */

    answerInput.value =
      answerInput.value
        .replace(/\D/g, "")
        .slice(0, 2);


    answerInput.className =
      "";


    /*
      Automatische Prüfung
      nach 0,25 Sekunden.
    */

    clearTimeout(
      checkTimeout
    );


    if (
      answerInput.value !== ""
    ) {

      checkTimeout =
        setTimeout(
          checkAnswer,
          250
        );

    }

  }
);


/* ==================================================
   BUTTONS
================================================== */

btn6.addEventListener(
  "click",
  () => {

    setLevel(6);

  }
);


btn10.addEventListener(
  "click",
  () => {

    setLevel(10);

  }
);


document
  .getElementById("speedSlow")
  .addEventListener(
    "click",
    () => {

      setSpeed("slow");

    }
  );


document
  .getElementById("speedMedium")
  .addEventListener(
    "click",
    () => {

      setSpeed("medium");

    }
  );


document
  .getElementById("speedFast")
  .addEventListener(
    "click",
    () => {

      setSpeed("fast");

    }
  );


startButton.addEventListener(
  "click",
  startGame
);


nextBlockButton.addEventListener(
  "click",
  startNewBlock
);


/* ==================================================
   INITIALISIERUNG
================================================== */

createKeypad();

disableKeypad();

deactivateInput();

hideStars();

renderEarnedStars();


blockResult.style.display =
  "none";


setActiveLevelButton();


timerDisplay.textContent =
  "0:00";


rightDisplay.textContent =
  "0";


wrongDisplay.textContent =
  "0";


/*
  Falls bereits 3 Sterne gespeichert sind,
  ist die heutige Einheit bereits beendet.
*/

if (
  earnedStars >= 3
) {

  dayFinished =
    true;

  startButton.style.display =
    "none";

  finishDay();

}