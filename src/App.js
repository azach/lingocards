import { useEffect, useState } from "react";

import "./App.css";
import Card from "./Card";
import Header from "./Header";
import { getBucket, getNextWord, markCorrect, markIncorrect } from "./scores";
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
  const [wordBank, setWordBank] = useState([]);
  const [cardIndex, setCardIndex] = useState(-1);
  const [card, setCard] = useState(null);
  const [swapCardOrder, setSwapCardOrder] = useState(false);

  const [sessionWords, setSessionWords] = useState([]);
  const [sessionBuckets, setSessionBuckets] = useState(null);
  const [cardResult, setCardResult] = useState(null);

  const previousWord = () => setCardIndex(cardIndex === 0 ? 0 : cardIndex - 1);

  const nextWord = () => {
    if (cardIndex < sessionWords.length - 1) {
      setCardIndex(cardIndex + 1);
    } else {
      const nextWord = getNextWord({ sessionBuckets, setSessionBuckets });

      if (nextWord) {
        setSessionWords([...sessionWords, nextWord]);
        setCardIndex(cardIndex + 1);
      } else {
        // End of session
        setCardIndex(sessionWords.length);
        setCard(null);
      }
    }
  };

  const gotWord = () => {
    if (card) {
      markCorrect(card.original);
      setCardResult(RESULT_SUCCESS);
      setTimeout(() => {
        setCardResult(null);
        nextWord();
      }, STATUS_TIMEOUT_MS);
    } else {
      nextWord();
    }
  };

  const missedWord = () => {
    if (card) {
      markIncorrect(card.original);
      setCardResult(RESULT_MISS);
      setTimeout(() => {
        setCardResult(null);
        nextWord();
      }, STATUS_TIMEOUT_MS);
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
  useEffect(() => {
    setWordBank(shuffle(getCachedWordBank()));
  }, []);

  // Initialize session
  useEffect(() => {
    if (!sessionBuckets && wordBank.length > 0) {
      const newSessionBuckets = {};

      wordBank.forEach((word) => {
        const wordBucket = getBucket(word);
        newSessionBuckets[wordBucket] ||= new Set();
        newSessionBuckets[wordBucket].add(word);
      });

      setSessionBuckets(newSessionBuckets);
      setSessionWords([]);
    }
  }, [wordBank, sessionBuckets]);

  // Load next word
  useEffect(() => {
    if (cardIndex < 0 && cardIndex >= sessionWords.length) {
      return;
    }

    const word = sessionWords[cardIndex];

    if (!word) {
      return;
    }

    const cachedTranslation = getCachedTranslation(word);

    if (cachedTranslation === undefined) {
      fetchTranslation(word).then(({ translation, gender }) => {
        const storedTranslation = translation + (gender ? ` (${gender})` : "");

        setCachedTranslation(word, storedTranslation);

        setCard({
          original: word,
          translation: storedTranslation,
        });
      });
    } else {
      setCard({
        original: word,
        translation: cachedTranslation,
      });
    }
  }, [cardIndex, sessionWords]);

  return (
    <div className="App">
      <header className="App-header">
        <Header />
      </header>
      <main className="App-body">
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
              />
            )}
          </>
        )}

        <div style={{ marginTop: "20px" }}>
          <input
            type="checkbox"
            id="swapCardOrder"
            onChange={(e) => setSwapCardOrder(e.target.checked)}
          ></input>
          <label htmlFor="swapCardOrder">Show translation first</label>
        </div>

        <div className="Button-row" style={{ marginTop: "40px" }}>
          <button className="failure" onClick={missedWord}>
            Miss
          </button>

          <button onClick={nextWord}>Next word</button>

          <button className="success" onClick={gotWord}>
            Correct
          </button>
        </div>
      </main>

      <footer className="App-footer"></footer>
    </div>
  );
}

export default App;
