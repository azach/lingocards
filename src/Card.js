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

function Card({
  original,
  score,
  translation,
  cardIndex,
  nextWord,
  isOrderSwapped,
}) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isMouseOver, setIsMouseOver] = useState(false);

  useEffect(() => {
    setIsFlipped(false);
  }, [original]);

  useEventListener("keydown", (e) => {
    if (e.key === SPACEBAR || e.key === "w") {
      setIsFlipped(!isFlipped);
    }
  });

  const snooze = () => {
    const snoozeDate = new Date();
    snoozeDate.setDate(snoozeDate.getDate() + SNOOZE_WEEKS * 7);

    setSnooze(isOrderSwapped ? translation : original, Number(snoozeDate));

    nextWord();
  };

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
        <p className="card-text center">{inflect(original, translation)}</p>
        <p className="card-text center">{translation || "Unknown"}</p>
      </ReactCardFlip>

      <div className="card-header-wrapper">
        <div className="card-header">
          <div style={{ display: "grid", gap: "10px", gridAutoFlow: "column" }}>
            <span className="text dark success">↑{score.correct}</span>
            <span className="text dark failure">↓{score.incorrect}</span>
          </div>
          <div className="button-row">
            <ExternalLink
              href={`https://en.wiktionary.org/wiki/${
                isOrderSwapped ? translation : original
              }`}
              alt="Wiktionary"
              src={wiki}
            />
            <ExternalLink
              href={`https://translate.google.com/details?sl=el&tl=en&text=${
                isOrderSwapped ? translation : original
              }&op=translate`}
              alt="Google Translate"
              src={google}
            />
            <ExternalLink
              href={`https://www.wordreference.com/gren/${
                isOrderSwapped ? translation : original
              }`}
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
                deleteCachedTranslation(
                  isOrderSwapped ? translation : original
                );
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

function inflect(original, translation) {
  if (!translation) {
    return original;
  }

  if (translation.endsWith("(m)")) {
    return `ο ${original}`;
  } else if (translation.endsWith("(f)")) {
    return `η ${original}`;
  } else if (translation.endsWith("(n)")) {
    return `το ${original}`;
  }

  return original;
}

export default Card;
