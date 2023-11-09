import "./Card.css";

import { useEffect, useState } from "react";

import ReactCardFlip from "react-card-flip";
import { deleteCachedTranslation } from "./translations";
import { useEventListener } from "./useEventListener";
import { setSnooze } from "./scores";

import snoozeIcon from "./assets/snooze.png";
import trash from "./assets/trash.png";

const SPACEBAR = " ";
const SNOOZE_WEEKS = 1;

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
        <p className="card-text center">{original}</p>
        <p className="card-text center">{translation || "Unknown"}</p>
      </ReactCardFlip>

      <div className="card-header-wrapper">
        <div className="card-header">
          <div style={{ display: "grid", gap: "10px", gridAutoFlow: "column" }}>
            <span className="text dark success">↑{score.correct}</span>
            <span className="text dark failure">↓{score.incorrect}</span>
          </div>
          <div>
            <a
              href={`https://translate.google.com/?sl=el&tl=en&text=${
                isOrderSwapped ? translation : original
              }&op=translate`}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
            >
              Google Translate &#8599;
            </a>
            <span style={{ marginRight: "14px" }} />
            <a
              href={`https://www.wordreference.com/gren/${
                isOrderSwapped ? translation : original
              }`}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
            >
              Dictionary &#8599;
            </a>
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

export default Card;
