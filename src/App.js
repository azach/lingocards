import { useEffect, useState } from "react";

import "./App.css";
import Card from "./Card";
import { useEventListener } from "./useEventListener";

function App() {
  const [wordBank, setWordBank] = useState([]);
  const [cardIndex, setCardIndex] = useState(0);
  const [card, setCard] = useState(null);
  const [swapCardOrder, setSwapCardOrder] = useState(false);

  const markCorrect = (word) => {
    const scores = JSON.parse(localStorage.getItem("scores")) || {};
    const cachedWord = scores[word] || {};
    cachedWord["correct"] = (cachedWord["correct"] || 0) + 1;
    cachedWord["bucket"] = (cachedWord["bucket"] || 0) + 1;

    if (!scores["maxBucket"] || cachedWord["bucket"] > scores["maxBucket"]) {
      scores["maxBucket"] = cachedWord["bucket"];
    }

    scores[word] = cachedWord;

    localStorage.setItem("scores", JSON.stringify(scores));
  };

  const markIncorrect = (word) => {
    const scores = JSON.parse(localStorage.getItem("scores")) || {};
    const cachedWord = scores[word] || {};
    cachedWord["incorrect"] = (cachedWord["incorrect"] || 0) + 1;
    cachedWord["bucket"] = Math.min((cachedWord["bucket"] || 0) - 1, 0);

    scores[word] = cachedWord;

    localStorage.setItem("scores", JSON.stringify(scores));
  };

  const previousWord = () =>
    setCardIndex(
      ((cardIndex === 0 ? wordBank.length : cardIndex) - 1) % wordBank.length
    );
  const nextWord = () => setCardIndex((cardIndex + 1) % wordBank.length);

  useEventListener("keydown", ({ key }) => {
    if (key === "ArrowLeft") {
      previousWord();
    } else if (key === "ArrowRight") {
      nextWord();
    }
  });

  // Load words from dictionary
  useEffect(() => {
    fetch("words.txt")
      .then((res) => res.text())
      .then((text) =>
        setWordBank(
          shuffle(
            text
              .split("\n")
              .map((s) => s.trim())
              .filter(Boolean)
          )
        )
      )
      .catch((e) => console.error(e));
  }, []);

  // Load next word
  useEffect(() => {
    const word = wordBank[cardIndex];

    if (!word) {
      return;
    }

    const cachedTranslations =
      JSON.parse(localStorage.getItem("translations")) || {};
    const cachedTranslation = cachedTranslations[word];

    if (cachedTranslation === undefined) {
      const url = `https://www.wordreference.com/gren/${word}`;
      fetch(url)
        .then((response) => response.text())
        .then(async (text) => {
          const parser = new DOMParser();
          const htmlDoc = parser.parseFromString(
            text,
            "text/html"
          ).documentElement;

          let translations = htmlDoc.querySelectorAll(
            '[data-dict="gren"] tr[id] td.ToWrd'
          );

          if (translations.length === 0) {
            translations = htmlDoc.querySelectorAll(
              '[data-dict="engr"] tr[id] td.FrWrd'
            );
          }

          const translation = Array.from(translations)
            .map((el) => el.innerText.trim())
            .join(", ");

          cachedTranslations[word] = translation;
          localStorage.setItem(
            "translations",
            JSON.stringify(cachedTranslations)
          );

          setCard({
            original: word,
            translation,
          });
        });
    } else {
      setCard({
        original: word,
        translation: cachedTranslation,
      });
    }
  }, [cardIndex, wordBank]);

  return (
    <div className="App">
      <header className="App-header"></header>
      <main className="App-body">
        {card && (
          <Card
            original={swapCardOrder ? card.translation : card.original}
            translation={swapCardOrder ? card.original : card.translation}
          />
        )}

        <div style={{ marginTop: "20px" }}>
          <input
            type="checkbox"
            id="swapCardOrder"
            onChange={(e) => setSwapCardOrder(e.target.checked)}
          ></input>
          <label for="swapCardOrder">Show translation first</label>
        </div>

        <div style={{ marginTop: "40px" }}>
          <button
            className="failure"
            onClick={() => {
              markIncorrect(card.original);
              nextWord();
            }}
          >
            Wrong
          </button>
          <span style={{ marginRight: "14px" }} />
          <button onClick={nextWord}>Next word</button>
          <span style={{ marginRight: "14px" }} />
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
        <button onClick={() => localStorage.removeItem("translations")}>
          Reset translations cache
        </button>
        <span style={{ marginRight: "14px" }} />
        <button onClick={() => localStorage.clear()}>Reset cache</button>
      </footer>
    </div>
  );
}

function shuffle(array) {
  let currentIndex = array.length,
    randomIndex;

  while (currentIndex > 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex],
      array[currentIndex],
    ];
  }

  return array;
}

export default App;
