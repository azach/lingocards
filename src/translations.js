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

export async function fetchTranslation(word) {
  const response = await fetch(`https://www.wordreference.com/gren/${word}`);

  const text = await response.text();

  const parser = new DOMParser();
  const htmlDoc = parser.parseFromString(text, "text/html").documentElement;

  let translations = htmlDoc.querySelectorAll(
    '[data-dict="gren"] tr[id] td.ToWrd'
  );

  if (translations.length === 0) {
    translations = htmlDoc.querySelectorAll(
      '[data-dict="engr"] tr[id] td.FrWrd'
    );
  }

  const translation = Array.from(translations)
    .map((el) => el.innerText.trim())
    .join(", ");

  let gender = [];
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

  return { translation, gender: gender.join("/") };
}

export function getCachedWordBank() {
  return JSON.parse(localStorage.getItem("word_bank")) || [];
}

export function addWordsToCachedWorkBank(words) {
  let cachedWordBank = JSON.parse(localStorage.getItem("word_bank")) || [];

  cachedWordBank = cachedWordBank.concat(words).filter(Boolean);

  localStorage.setItem(
    "word_bank",
    JSON.stringify([...new Set(cachedWordBank)])
  );
}
