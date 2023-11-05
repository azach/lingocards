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

export default TitleCard;
