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
      className={`Card-wrapper ${isFlipped ? "back" : "front"}`}
    >
      <ReactCardFlip
        isFlipped={isFlipped}
        flipSpeedBackToFront={0}
        flipSpeedFrontToBack={0}
        containerClassName="Card-body"
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
        <p className="Card-text">{original}</p>
        <p className="Card-text">{translation || "Unknown"}</p>
      </ReactCardFlip>

      <div className="Card-externaLinkContainer">
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

      <div className="Card-footer-wrapper">
        <div className="Card-footer">
          <div>
            <span
              className="Card-removeWord"
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
