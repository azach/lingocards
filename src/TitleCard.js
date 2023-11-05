import ReactCardFlip from "react-card-flip";
import star from "./assets/star.png";
import thumbsUp from "./assets/thumbs-up.png";
import thumbsDown from "./assets/thumbs-down.png";

function TitleCard({ text }) {
  return (
    <div className="Card-wrapper title">
      <ReactCardFlip
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
        <p className="Card-text">{text}</p>
        <p className="Card-text">{text}</p>
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

export const CompleteTitleCard = () => (
  <TitleCard
    text={
      <img
        alt="Session complete"
        height="128"
        width="128"
        src={star}
        style={{ opacity: 0.9 }}
      />
    }
  />
);

export default TitleCard;
