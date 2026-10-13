import { useEffect, useRef, useState } from "react";
import Select from "react-select";

import "./App.css";
import Card from "./Card";
import Header from "./Header";
import {
  DEFAULT_SESSION_LENGTH,
  getBucket,
  getNextWord,
  getScore,
  isDue,
  isSnoozed,
  loadScores,
  markCorrect,
  markIncorrect,
  SESSION_ALGORITHMS,
  SESSION_LENGTHS,
} from "./scores";
import TitleCard, {
  CompleteTitleCard,
  MissTitleCard,
  SuccessTitleCard,
} from "./TitleCard";
import {
  fetchTranslation,
  getCachedTranslation,
  getCachedWordBank,
  setCachedTranslation,
} from "./translations";
import { useEventListener } from "./useEventListener";
import { shuffle } from "./utilities";

const STATUS_TIMEOUT_MS = 250;
const RESULT_SUCCESS = "success";
const RESULT_MISS = "miss";

function App() {
  const [cardIndex, setCardIndex] = useState(-1);
  // { word, translation }, where translation is null while it's being fetched
  const [card, setCard] = useState(null);
  const [swapCardOrder, setSwapCardOrder] = useState(
    localStorage.getItem("swap_card_order") === "true"
  );
  const [totalWords, setTotalWords] = useState(null);
  const [dueWords, setDueWords] = useState(0);

  const [sessionWords, setSessionWords] = useState([]);
  const [sessionBuckets, setSessionBuckets] = useState(null);
  // Word -> RESULT_SUCCESS / RESULT_MISS. Keyed by word so going back and
  // re-marking a card replaces its result instead of counting it twice.
  const [sessionResults, setSessionResults] = useState({});
  const [sessionLength, setSessionLength] = useState(
    localStorage.getItem("session_length") === "null"
      ? null
      : Number(localStorage.getItem("session_length") || DEFAULT_SESSION_LENGTH)
  );
  const [sessionAlgorithm, setSessionAlgorithm] = useState(
    localStorage.getItem("session_algorithm") === "null"
      ? null
      : localStorage.getItem("session_algorithm")
  );
  const [cardResult, setCardResult] = useState(null);
  const cardResultTimeout = useRef(null);

  const currentWord = cardIndex >= 0 ? sessionWords[cardIndex] : undefined;
  const isSessionComplete = cardIndex >= 0 && cardIndex >= sessionWords.length;

  const resultCounts = Object.values(sessionResults).reduce(
    (counts, result) => ({ ...counts, [result]: counts[result] + 1 }),
    { [RESULT_SUCCESS]: 0, [RESULT_MISS]: 0 }
  );
  const sessionStats = {
    correct: resultCounts[RESULT_SUCCESS],
    incorrect: resultCounts[RESULT_MISS],
    skipped:
      sessionWords.length -
      resultCounts[RESULT_SUCCESS] -
      resultCounts[RESULT_MISS],
  };

  const initializeSession = () => {
    const wordBank = getCachedWordBank();
    const sessionWordBank = shuffle(
      wordBank.filter((word) => !isSnoozed(word))
    );

    const scores = loadScores();
    const newSessionBuckets = {};
    let dueCount = 0;

    sessionWordBank.forEach((word) => {
      const wordBucket = getBucket(word, scores);
      newSessionBuckets[wordBucket] ||= new Set();
      newSessionBuckets[wordBucket].add(word);

      if (isDue(word, scores)) {
        dueCount++;
      }
    });

    setTotalWords(wordBank.length);
    setDueWords(dueCount);
    setSessionBuckets(newSessionBuckets);
    setSessionWords([]);
    setSessionResults({});
    setCard(null);
    setCardIndex(-1);
  };

  // Words added mid-session are picked up by the next session
  const onWordBankChanged = () => {
    if (cardIndex === -1 || isSessionComplete) {
      initializeSession();
    } else {
      setTotalWords(getCachedWordBank().length);
    }
  };

  const previousWord = () => {
    if (cardIndex > 0) {
      setCardIndex(cardIndex - 1);
    }
  };

  const nextWord = () => {
    if (sessionLength && cardIndex >= sessionLength - 1) {
      // End of session with set session length
      setCardIndex(sessionWords.length);
    } else if (cardIndex < sessionWords.length - 1) {
      setCardIndex(cardIndex + 1);
    } else {
      const newWord = getNextWord({
        sessionBuckets,
        setSessionBuckets,
        sessionAlgorithm,
      });

      if (newWord) {
        setSessionWords([...sessionWords, newWord]);
        setCardIndex(cardIndex + 1);
      } else {
        // End of session without set session length
        setCardIndex(sessionWords.length);
      }
    }
  };

  const recordResult = (result) => {
    if (!currentWord) {
      nextWord();
      return;
    }

    // Marking a word always schedules it in the future
    if (isDue(currentWord)) {
      setDueWords((count) => count - 1);
    }

    if (result === RESULT_SUCCESS) {
      markCorrect(currentWord);
    } else {
      markIncorrect(currentWord);
    }

    setSessionResults((prev) => ({ ...prev, [currentWord]: result }));

    setCardResult(result);
    clearTimeout(cardResultTimeout.current);
    cardResultTimeout.current = setTimeout(
      () => setCardResult(null),
      STATUS_TIMEOUT_MS
    );

    nextWord();
  };

  const gotWord = () => recordResult(RESULT_SUCCESS);
  const missedWord = () => recordResult(RESULT_MISS);

  useEventListener("keydown", ({ key }) => {
    // On start screen, only allow right arrow to begin
    if (cardIndex === -1) {
      if (key === "ArrowRight") {
        nextWord();
      }
      return;
    }

    // On completion screen, allow 'N' to start new session
    if (isSessionComplete) {
      if (key === "n" || key === "N") {
        initializeSession();
      }
      return;
    }

    switch (key) {
      case "ArrowLeft":
        previousWord();
        break;
      case "ArrowRight":
        nextWord();
        break;
      case "d":
        gotWord();
        break;
      case "a":
        missedWord();
        break;
      default:
    }
  });

  // Load words from dictionary
  useEffect(() => initializeSession(), []);

  // Clear any pending result animation on unmount
  useEffect(() => () => clearTimeout(cardResultTimeout.current), []);

  // Load translation for the current word
  useEffect(() => {
    if (!currentWord) {
      return;
    }

    const cachedTranslation = getCachedTranslation(currentWord);

    if (cachedTranslation !== undefined && cachedTranslation !== null) {
      setCard({ word: currentWord, translation: cachedTranslation });
      return;
    }

    // Ignore the response if we've moved on to another card by the time it
    // arrives, so it doesn't overwrite the card being shown
    let isCurrent = true;

    setCard({ word: currentWord, translation: null });

    fetchTranslation(currentWord)
      .then(({ translation, gender }) => {
        // Don't cache empty results, so they're retried next time
        const storedTranslation = translation
          ? translation + (gender ? ` (${gender})` : "")
          : "";

        if (storedTranslation) {
          setCachedTranslation(currentWord, storedTranslation);
        }

        if (isCurrent) {
          setCard({ word: currentWord, translation: storedTranslation });
        }
      })
      .catch((error) => {
        console.error(`Failed to fetch translation for ${currentWord}`, error);

        if (isCurrent) {
          setCard({ word: currentWord, translation: "" });
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [currentWord]);

  return (
    <div className="app">
      <header className="app-header">
        <Header
          totalWords={totalWords}
          dueWords={dueWords}
          onWordBankChanged={onWordBankChanged}
        />
      </header>
      <main className="app-body">
        {cardResult === RESULT_SUCCESS && <SuccessTitleCard />}

        {cardResult === RESULT_MISS && <MissTitleCard />}

        {!cardResult && (
          <>
            {cardIndex === -1 && <TitleCard text={"Start your session"} />}

            {isSessionComplete && <CompleteTitleCard stats={sessionStats} />}

            {currentWord && card?.word !== currentWord && (
              <TitleCard text="" />
            )}

            {currentWord && card?.word === currentWord && (
              <Card
                word={card.word}
                translation={card.translation}
                cardIndex={cardIndex}
                nextWord={nextWord}
                score={getScore(card.word)}
                isOrderSwapped={swapCardOrder}
              />
            )}
          </>
        )}

        <div style={{ marginTop: "40px" }}>
          <div className="button-row" style={{ gap: "30px" }}>
            <label className="checkbox-container" htmlFor="swapCardOrder">
              <input
                type="checkbox"
                id="swapCardOrder"
                checked={swapCardOrder}
                onChange={(e) => {
                  localStorage.setItem("swap_card_order", e.target.checked);
                  setSwapCardOrder(e.target.checked);
                }}
              />
              <span className="checkmark"></span>
              Show translation first
            </label>

            <Select
              className="select-dropdown"
              placeholder="Session length"
              value={SESSION_LENGTHS.find((o) => o.value === sessionLength)}
              options={SESSION_LENGTHS}
              onChange={(e) => {
                localStorage.setItem("session_length", e.value);
                setSessionLength(e.value);
              }}
            />

            <Select
              className="select-dropdown"
              placeholder="Session algorithm"
              value={SESSION_ALGORITHMS.find(
                (o) => o.value === sessionAlgorithm
              )}
              options={SESSION_ALGORITHMS}
              onChange={(e) => {
                localStorage.setItem("session_algorithm", e.value);
                setSessionAlgorithm(e.value);
              }}
            />
          </div>
        </div>

        <div className="button-row" style={{ marginTop: "40px" }}>
          {isSessionComplete && (
            <button className="failure" onClick={initializeSession}>
              New session
            </button>
          )}

          {!isSessionComplete && (
            <>
              <button
                className="failure"
                onClick={missedWord}
                onKeyDown={(e) => e.preventDefault()}
              >
                Miss
              </button>

              <button onClick={nextWord} onKeyDown={(e) => e.preventDefault()}>
                Next word
              </button>

              <button
                className="success"
                onClick={gotWord}
                onKeyDown={(e) => e.preventDefault()}
              >
                Correct
              </button>
            </>
          )}
        </div>
      </main>

      <footer className="app-footer"></footer>
    </div>
  );
}

export default App;
