export function getCachedTranslation(word) {
  const cachedTranslations =
    JSON.parse(localStorage.getItem("translations")) || {};

  return cachedTranslations[word];
}

export function setCachedTranslation(word, translation) {
  const cachedTranslations =
    JSON.parse(localStorage.getItem("translations")) || {};

  cachedTranslations[word] = translation;

  localStorage.setItem("translations", JSON.stringify(cachedTranslations));
}

export function addWordsToCachedWorkBank(words) {
  const cachedTranslations =
    JSON.parse(localStorage.getItem("translations")) || {};

  words.forEach((word) => (cachedTranslations[word] ||= null));

  localStorage.setItem("translations", JSON.stringify(cachedTranslations));
}

export function deleteCachedTranslation(word) {
  const cachedTranslations =
    JSON.parse(localStorage.getItem("translations")) || {};

  delete cachedTranslations[word];

  localStorage.setItem("translations", JSON.stringify(cachedTranslations));
}

export async function fetchTranslation(word) {
  const response = await fetch(`https://www.wordreference.com/gren/${word}`);

  const text = await response.text();

  const parser = new DOMParser();
  const htmlDoc = parser.parseFromString(text, "text/html").documentElement;

  // Try Greek to English first
  let translations = htmlDoc.querySelectorAll(
    '[data-dict="gren"] tr[id] td.ToWrd'
  );

  let gender = [];
  let translation = "";

  // If no Greek to English translations, try English to Greek
  if (translations.length === 0) {
    // For English to Greek, get the principal translation (first one)
    const firstRow = htmlDoc.querySelector('[data-dict="engr"] tr[id]');

    if (firstRow) {
      // Get the Greek translation (ToWrd)
      const toWrdElement = firstRow.querySelector('td.ToWrd');
      if (toWrdElement) {
        // Extract just the main word, removing any additional text like "ουσ θηλ"
        const fullText = toWrdElement.innerText.trim();
        // Take only the first word (the actual translation)
        const mainWord = fullText.split(/[\s,]/)[0];

        // Check if there's a gender indicator in the row
        const rowText = firstRow.innerText;
        if (rowText.includes("ουδ")) {
          gender.push("n");
        }
        if (rowText.includes("θηλ")) {
          gender.push("f");
        }
        if (rowText.includes("αρ")) {
          gender.push("m");
        }

        translation = mainWord;
      }
    }
  } else {
    // For Greek to English, get all translations
    translation = Array.from(translations)
      .map((el) => el.innerText.trim())
      .join(", ");

    // Extract gender from the reverse lookup
    const fromTranslationToTargetPrincipalTranslation = Array.from(
      htmlDoc.querySelectorAll('[data-dict="engr"] tr.langHeader ~ tr .ToWrd')
    )
      .map((t) => t.innerText)
      .find((t) => t.includes(word));

    if (fromTranslationToTargetPrincipalTranslation) {
      if (fromTranslationToTargetPrincipalTranslation.includes("ουδ")) {
        gender.push("n");
      }
      if (fromTranslationToTargetPrincipalTranslation.includes("θηλ")) {
        gender.push("f");
      }
      if (fromTranslationToTargetPrincipalTranslation.includes("αρ")) {
        gender.push("m");
      }
    }
  }

  return { translation, gender: gender.join("/") };
}

export function getCachedWordBank() {
  const cachedTranslations =
    JSON.parse(localStorage.getItem("translations")) || {};

  return Object.keys(cachedTranslations);
}
