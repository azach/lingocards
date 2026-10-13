import "./Card.css";

import { useEffect, useState } from "react";

import ReactCardFlip from "react-card-flip";
import { deleteCachedTranslation } from "./translations";
import { useEventListener } from "./useEventListener";
import { setSnooze } from "./scores";

import google from "./assets/google.png";
import snoozeIcon from "./assets/snooze.png";
import trash from "./assets/trash.png";
import wiki from "./assets/wiki.png";
import wordreference from "./assets/wordreference.png";

const SPACEBAR = " ";
const SNOOZE_WEEKS = 1;

function ExternalLink({ href, alt, src }) {
  return (
    <span className="card-action">
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        onClick={(e) => e.stopPropagation()}
      >
        <img alt={alt} height="25" width="25" src={src} />
      </a>
    </span>
  );
}

// `word` is the word bank entry (usually Greek). `translation` is its cached
// translation, with any gender suffix, e.g. "house (n)": null while it's still
// loading, and "" if no translation was found.
function Card({ word, score, translation, cardIndex, nextWord, isOrderSwapped }) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isMouseOver, setIsMouseOver] = useState(false);

  useEffect(() => {
    setIsFlipped(false);
  }, [word]);

  useEventListener("keydown", (e) => {
    if (e.key === SPACEBAR || e.key === "w") {
      setIsFlipped(!isFlipped);
    }
  });

  const snooze = () => {
    const snoozeDate = new Date();
    snoozeDate.setDate(snoozeDate.getDate() + SNOOZE_WEEKS * 7);

    setSnooze(word, Number(snoozeDate));

    nextWord();
  };

  const front = inflect(word, translation);
  const back = translation === null ? "…" : translation || "Unknown";
  const encodedWord = encodeURIComponent(word);

  return (
    <div
      onClick={() => setIsFlipped(!isFlipped)}
      onMouseOver={() => setIsMouseOver(true)}
      onMouseOut={() => setIsMouseOver(false)}
      className={`card-wrapper ${isFlipped ? "back" : "front"}`}
    >
      <ReactCardFlip
        isFlipped={isFlipped}
        flipSpeedBackToFront={0}
        flipSpeedFrontToBack={0}
        containerClassName="card-body"
        cardStyles={{
          front: {
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          },
          back: {
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          },
        }}
      >
        <p className="card-text center">{isOrderSwapped ? back : front}</p>
        <p className="card-text center">{isOrderSwapped ? front : back}</p>
      </ReactCardFlip>

      <div className="card-header-wrapper">
        <div className="card-header">
          <div
            style={{
              display: "grid",
              gap: "10px",
              gridAutoFlow: "column",
              alignItems: "center",
            }}
          >
            <span className="text dark success">↑{score.correct}</span>
            <span className="text dark failure">↓{score.incorrect}</span>
            {score.interval > 0 && (
              <span
                className="text dark"
                style={{ fontSize: "12px", opacity: 0.7 }}
              >
                {score.interval}d
              </span>
            )}
          </div>
          <div className="button-row">
            <ExternalLink
              href={`https://en.wiktionary.org/wiki/${encodedWord}`}
              alt="Wiktionary"
              src={wiki}
            />
            <ExternalLink
              href={`https://translate.google.com/details?sl=el&tl=en&text=${encodedWord}&op=translate`}
              alt="Google Translate"
              src={google}
            />
            <ExternalLink
              href={`https://www.wordreference.com/gren/${encodedWord}`}
              alt="Word Reference"
              src={wordreference}
            />
          </div>
        </div>
      </div>

      <div className="card-footer-wrapper">
        <div className="card-footer">
          <div
            className="button-row"
            style={{ visibility: isMouseOver ? "visible" : "hidden" }}
          >
            <span
              title="Remove word"
              className="card-action"
              onClick={(e) => {
                e.stopPropagation();
                deleteCachedTranslation(word);
                nextWord();
              }}
            >
              <img alt="Remove" height="20" width="20" src={trash} />
            </span>
            <span
              title="Snooze for 1 week"
              className="card-action"
              onClick={(e) => {
                e.stopPropagation();
                snooze();
              }}
            >
              <img alt="Snooze" height="20" width="20" src={snoozeIcon} />
            </span>
          </div>
          <div>{cardIndex}</div>
        </div>
      </div>
    </div>
  );
}

const ARTICLES = { m: "ο", f: "η", n: "το" };

// Prefix a Greek word with its definite article, using the gender suffix that
// was appended to its translation (e.g. "house (n)" -> "το σπίτι").
function inflect(word, translation) {
  if (!translation || !/\p{Script=Greek}/u.test(word)) {
    return word;
  }

  const gender = translation.match(/\((m|f|n)\)$/)?.[1];

  return gender ? `${ARTICLES[gender]} ${word}` : word;
}

export default Card;
