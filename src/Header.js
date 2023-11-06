/* eslint-disable jsx-a11y/anchor-is-valid */
import { addWordsToCachedWorkBank } from "./translations";

function Header() {
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
    <div class="dropdown">
      <button class="small">Settings</button>
      <div class="dropdown-content">
        <a
          href="#"
          onClick={() => {
            const response = window.prompt("Enter word to add");

            if (response) {
              addWordsToCachedWorkBank([response.trim()]);
            }
          }}
        >
          Add new word
        </a>
        <a href="#">
          <label htmlFor="file-upload">Import words</label>
          <input id="file-upload" type="file" onChange={importFile} />
        </a>
      </div>
    </div>
  );
}

export default Header;
