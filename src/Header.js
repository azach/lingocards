import { addWordsToCachedWorkBank } from "./translations";

function Header() {
  return (
    <button
      className="small"
      onClick={() => {
        const response = window.prompt("Enter word to add");

        if (response) {
          addWordsToCachedWorkBank([response]);
        }
      }}
    >
      Add new word
    </button>
  );
}

export default Header;
