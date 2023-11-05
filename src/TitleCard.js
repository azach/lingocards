import ReactCardFlip from "react-card-flip";

function TitleCard({ text }) {
  return (
    <div className="Card-wrapper front">
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
        src="thumbs-up.png"
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
        src="thumbs-down.png"
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
        src="star.png"
        style={{ opacity: 0.9 }}
      />
    }
  />
);

export default TitleCard;
