import "./Card.css";

import { useEffect, useState } from "react";

import ReactCardFlip from "react-card-flip";
import { removeWordFromCachedWorkBank } from "./translations";
import { useEventListener } from "./useEventListener";

const SPACEBAR = " ";

function Card({ original, translation, cardIndex, nextWord }) {
  const [isFlipped, setIsFlipped] = useState(false);

  useEffect(() => {
    setIsFlipped(false);
  }, [original]);

  useEventListener("keydown", (e) => {
    if (e.key === SPACEBAR || e.key === "w") {
      setIsFlipped(!isFlipped);
    }
  });

  return (
    <div
      onClick={() => setIsFlipped(!isFlipped)}
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
        <p className="card-text">{original}</p>
        <p className="card-text">{translation || "Unknown"}</p>
      </ReactCardFlip>

      <div className="card-external-link-wrapper">
        <a
          href={`https://translate.google.com/?sl=el&tl=en&text=${original}&op=translate`}
          target="_blank"
          rel="noreferrer"
          onClick={(e) => e.stopPropagation()}
        >
          Google Translate &#8599;
        </a>
        <span style={{ marginRight: "14px" }} />
        <a
          href={`https://www.wordreference.com/gren/${original}`}
          target="_blank"
          rel="noreferrer"
          onClick={(e) => e.stopPropagation()}
        >
          Dictionary &#8599;
        </a>
      </div>

      <div className="card-footer-wrapper">
        <div className="card-footer">
          <div>
            <span
              className="card-remove-word"
              onClick={(e) => {
                e.stopPropagation();
                removeWordFromCachedWorkBank(
                  isFlipped ? translation : original
                );
                nextWord();
              }}
            >
              &#10540;
            </span>
          </div>
          <div>{cardIndex}</div>
        </div>
      </div>
    </div>
  );
}

export default Card;
