import { useState } from "react";
import { addWordsToCachedWorkBank } from "./translations";

function Header() {
  const [showActions, setShowActions] = useState(false);

  const importFile = (e) => {
    const file = e.target.files[0];

    if (!file) {
      return;
    }

    const fileReader = new FileReader();
    fileReader.readAsText(file, "UTF-8");
    fileReader.onload = (e) => {
      const content = e.target.result;
      const words = content.split("\n").map((w) => w.trim());

      addWordsToCachedWorkBank(words);
    };
  };

  return (
    <div className="button-row">
      <button
        className="small"
        onClick={() => setShowActions(!showActions)}
        style={{ padding: "11px 14px" }}
      >
        {showActions ? "←" : "→"}
      </button>

      {showActions && (
        <>
          <button
            className="small"
            onClick={() => {
              const response = window.prompt("Enter word to add");

              if (response) {
                addWordsToCachedWorkBank([response.trim()]);
              }
            }}
          >
            Add new word
          </button>

          <label htmlFor="file-upload" className="file-upload small">
            Import words
          </label>
          <input id="file-upload" type="file" onChange={importFile} />
        </>
      )}
    </div>
  );
}

export default Header;
