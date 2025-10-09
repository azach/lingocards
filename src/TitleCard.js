import ReactCardFlip from "react-card-flip";
import star from "./assets/star.png";
import thumbsUp from "./assets/thumbs-up.png";
import thumbsDown from "./assets/thumbs-down.png";

function TitleCard({ text }) {
  return (
    <div className="card-wrapper title">
      <ReactCardFlip
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
        <p className="card-text">{text}</p>
        <p className="card-text">{text}</p>
      </ReactCardFlip>
    </div>
  );
}

export const SuccessTitleCard = () => (
  <TitleCard
    text={
      <img
        alt="success"
        height="128"
        width="128"
        src={thumbsUp}
        style={{ opacity: 0.85, marginTop: "13px" }}
      />
    }
  />
);

export const MissTitleCard = () => (
  <TitleCard
    text={
      <img
        alt="miss"
        height="128"
        width="128"
        src={thumbsDown}
        style={{ opacity: 0.85, marginTop: "13px" }}
      />
    }
  />
);

export const CompleteTitleCard = ({ stats }) => (
  <TitleCard
    text={
      <div style={{ textAlign: "center" }}>
        <img
          alt="Session complete"
          height="128"
          width="128"
          src={star}
          style={{ opacity: 0.9 }}
        />
        {stats && (
          <div style={{ marginTop: "30px", fontSize: "16px", color: "#666" }}>
            <div style={{ display: "flex", justifyContent: "center", gap: "30px" }}>
              <span style={{ color: "#51cf66", fontWeight: "bold" }}>
                ✓ {stats.correct} Correct
              </span>
              <span style={{ color: "#ff6b6b", fontWeight: "bold" }}>
                ✗ {stats.incorrect} Incorrect
              </span>
              <span style={{ color: "#868e96", fontWeight: "bold" }}>
                → {stats.skipped} Skipped
              </span>
            </div>
          </div>
        )}
      </div>
    }
  />
);

export default TitleCard;
