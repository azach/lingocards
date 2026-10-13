/* eslint-disable jsx-a11y/anchor-is-valid */
import { addWordsToCachedWorkBank, getCachedWordBank } from "./translations";

function Header({ totalWords, dueWords, onWordBankChanged }) {
  const importFile = (e) => {
    const file = e.target.files[0];

    if (!file) {
      return;
    }

    // Allow re-importing the same file
    e.target.value = "";

    const fileReader = new FileReader();
    fileReader.readAsText(file, "UTF-8");
    fileReader.onload = (e) => {
      const content = e.target.result;
      const words = content
        .split("\n")
        .map((w) => w.trim())
        .filter(Boolean);

      addWordsToCachedWorkBank(words);
      onWordBankChanged();
    };
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
      {dueWords !== undefined && dueWords > 0 && (
        <div style={{ fontSize: "14px", color: "#666" }}>
          <span style={{ fontWeight: "bold", color: "#ff6b6b" }}>{dueWords}</span> due for review
        </div>
      )}
      <div className="dropdown">
        <button className="small">Settings</button>
        <div className="dropdown-content">
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();

            const response = window.prompt("Enter word to add")?.trim();

            if (response) {
              addWordsToCachedWorkBank([response]);
              onWordBankChanged();
            }
          }}
        >
          Add new word
        </a>
        <a href="#">
          <label htmlFor="file-upload">Import words</label>
          <input id="file-upload" type="file" onChange={importFile} />
        </a>
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();

            const blob = new Blob([getCachedWordBank().sort().join("\n")], {
              type: "text/plain",
            });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.download = "words.txt";
            link.href = url;
            link.click();
            URL.revokeObjectURL(url);
          }}
        >
          {totalWords ? `Export ${totalWords} words` : "Export words"}
        </a>
        </div>
      </div>
    </div>
  );
}

export default Header;
