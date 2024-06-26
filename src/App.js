import { useEffect, useState } from "react";
import Select from "react-select";

import "./App.css";
import Card from "./Card";
import Header from "./Header";
import {
  DEFAULT_SESSION_LENGTH,
  getBucket,
  getNextWord,
  getScore,
  isSnoozed,
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
  const [card, setCard] = useState(null);
  const [swapCardOrder, setSwapCardOrder] = useState(
    localStorage.getItem("swap_card_order") === "true"
  );
  const [totalWords, setTotalWords] = useState(null);

  const [sessionWords, setSessionWords] = useState([]);
  const [sessionBuckets, setSessionBuckets] = useState(null);
  const [sessionLength, setSessionLength] = useState(
    localStorage.getItem("session_length") === "null"
      ? null
      : Number(localStorage.getItem("session_length") || DEFAULT_SESSION_LENGTH)
  );
  const [sessionAlgorithm, setSessionAlgorithm] = useState(
    localStorage.getItem("session_algorithm")
  );
  const [cardResult, setCardResult] = useState(null);

  const initializeSession = () => {
    const wordBank = getCachedWordBank();
    const sessionWordBank = shuffle(
      wordBank.filter((word) => !isSnoozed(word))
    );

    const newSessionBuckets = {};

    sessionWordBank.forEach((word) => {
      const wordBucket = getBucket(word);
      newSessionBuckets[wordBucket] ||= new Set();
      newSessionBuckets[wordBucket].add(word);
    });

    setTotalWords(wordBank.length);
    setSessionBuckets(newSessionBuckets);
    setSessionWords([]);
    setCard(null);
    setCardIndex(-1);
  };

  const previousWord = () => {
    if (cardIndex === 0) {
      return;
    }

    if (sessionLength && cardIndex === null && sessionWords.length) {
      setCardIndex(sessionLength - 1);
    } else if (cardIndex > 0) {
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
      const nextWord = getNextWord({
        sessionBuckets,
        setSessionBuckets,
        sessionAlgorithm,
      });

      if (nextWord) {
        setSessionWords([...sessionWords, nextWord]);
        setCardIndex(cardIndex + 1);
      } else {
        // End of session without set session length
        setCardIndex(sessionWords.length);
      }
    }
  };

  const gotWord = () => {
    if (card) {
      markCorrect(card.original);
      nextWord();

      setCardResult(RESULT_SUCCESS);
      setTimeout(() => setCardResult(null), STATUS_TIMEOUT_MS);
    } else {
      nextWord();
    }
  };

  const missedWord = () => {
    if (card) {
      markIncorrect(card.original);
      nextWord();

      setCardResult(RESULT_MISS);
      setTimeout(() => setCardResult(null), STATUS_TIMEOUT_MS);
    } else {
      nextWord();
    }
  };

  useEventListener("keydown", ({ key }) => {
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

  // Load next word
  useEffect(() => {
    if (cardIndex < 0 && cardIndex >= sessionWords.length) {
      return;
    }

    let word = sessionWords[cardIndex];

    if (!word) {
      return;
    }

    let translation = getCachedTranslation(word);

    if (translation === undefined || translation === null) {
      fetchTranslation(word).then(({ translation, gender }) => {
        const storedTranslation = translation + (gender ? ` (${gender})` : "");

        setCachedTranslation(word, storedTranslation);

        translation = storedTranslation;
      });
    }

    setCard({
      original: word,
      translation,
    });
  }, [cardIndex, sessionWords]);

  return (
    <div className="app">
      <header className="app-header">
        <Header totalWords={totalWords} />
      </header>
      <main className="app-body">
        {cardResult === RESULT_SUCCESS && <SuccessTitleCard />}

        {cardResult === RESULT_MISS && <MissTitleCard />}

        {!cardResult && (
          <>
            {cardIndex === -1 && <TitleCard text={"Start your session"} />}

            {cardIndex === sessionWords.length && <CompleteTitleCard />}

            {cardIndex >= 0 && cardIndex < sessionWords.length && !card && (
              <TitleCard text="" />
            )}

            {cardIndex >= 0 && cardIndex < sessionWords.length && card && (
              <Card
                original={swapCardOrder ? card.translation : card.original}
                translation={swapCardOrder ? card.original : card.translation}
                cardIndex={cardIndex}
                nextWord={nextWord}
                score={getScore(card.original)}
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
          {cardIndex === sessionWords.length && (
            <button className="failure" onClick={initializeSession}>
              New session
            </button>
          )}

          {cardIndex < sessionWords.length && (
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
