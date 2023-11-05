import { useEffect, useState } from "react";

import "./App.css";
import Card from "./Card";
import Header from "./Header";
import { getBucket, getNextWord, markCorrect, markIncorrect } from "./scores";
import {
  fetchTranslation,
  getCachedTranslation,
  getCachedWordBank,
  setCachedTranslation,
} from "./translations";
import { useEventListener } from "./useEventListener";
import { shuffle } from "./utilities";

function App() {
  const [wordBank, setWordBank] = useState([]);
  const [cardIndex, setCardIndex] = useState(-1);
  const [card, setCard] = useState(null);
  const [swapCardOrder, setSwapCardOrder] = useState(false);

  const [sessionWords, setSessionWords] = useState([]);
  const [sessionBuckets, setSessionBuckets] = useState(null);

  const previousWord = () =>
    setCardIndex(
      ((cardIndex === 0 ? sessionWords.length : cardIndex) - 1) %
        sessionWords.length
    );

  const nextWord = () => {
    if (cardIndex < sessionWords.length - 1) {
      setCardIndex(cardIndex + 1);
    } else {
      const nextWord = getNextWord({ sessionBuckets, setSessionBuckets });

      if (!nextWord && sessionWords.length) {
        // Loop through session
        setCardIndex(0);
      } else {
        setSessionWords([...sessionWords, nextWord]);
        setCardIndex(cardIndex + 1);
      }
    }
  };

  useEventListener("keydown", ({ key }) => {
    if (key === "ArrowLeft") {
      previousWord();
    } else if (key === "ArrowRight") {
      nextWord();
    }
  });

  // Load words from dictionary
  useEffect(() => {
    const cachedWordBank = getCachedWordBank();

    fetch("words.txt")
      .then((res) => res.text())
      .then((text) =>
        setWordBank(
          shuffle(
            text
              .split("\n")
              .map((s) => s.trim())
              .filter(Boolean)
              .concat(cachedWordBank)
          )
        )
      )
      .catch((e) => console.error(e));
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
        {(cardIndex === -1 || !card) && (
          <Card
            original={"Start your session"}
            translation={"Start your session"}
          />
        )}
        {card && (
          <Card
            original={swapCardOrder ? card.translation : card.original}
            translation={swapCardOrder ? card.original : card.translation}
            cardIndex={cardIndex}
          />
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
          <button
            className="failure"
            onClick={() => {
              markIncorrect(card.original);
              nextWord();
            }}
          >
            Wrong
          </button>

          <button onClick={nextWord}>Next word</button>

          <button
            className="success"
            onClick={() => {
              markCorrect(card.original);
              nextWord();
            }}
          >
            Correct
          </button>
        </div>
      </main>

      <footer className="App-footer">
        <div className="Button-row">
          <button
            className="small"
            onClick={() => localStorage.removeItem("translations")}
          >
            Reset translations cache
          </button>
          <button className="small" onClick={() => localStorage.clear()}>
            Reset cache
          </button>
        </div>
      </footer>
    </div>
  );
}

export default App;
