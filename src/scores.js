import { shuffle } from "./utilities";

export const DEFAULT_SESSION_LENGTH = 25;
export const SESSION_LENGTHS = [
  { value: null, label: "All words" },
  { value: 50, label: 50 },
  { value: 25, label: 25 },
  { value: 10, label: 10 },
  { value: 5, label: 5 },
];

export const getBucket = (word) => {
  const scores = JSON.parse(localStorage.getItem("scores")) || {};
  const cachedWord = scores[word] || {};
  return Math.max(cachedWord["bucket"] || 0, 0);
};

export const getScore = (word) => {
  const scores = JSON.parse(localStorage.getItem("scores")) || {};
  const cachedWord = scores[word] || {};

  return {
    correct: Math.max(cachedWord["correct"] || 0, 0),
    incorrect: Math.max(cachedWord["incorrect"] || 0, 0),
  };
};

export const markCorrect = (word) => {
  const scores = JSON.parse(localStorage.getItem("scores")) || {};
  const cachedWord = scores[word] || {};
  cachedWord["correct"] = (cachedWord["correct"] || 0) + 1;
  cachedWord["bucket"] = Math.max(cachedWord["bucket"] || 0, 0) + 1;

  scores[word] = cachedWord;

  localStorage.setItem("scores", JSON.stringify(scores));
};

export const markIncorrect = (word) => {
  const scores = JSON.parse(localStorage.getItem("scores")) || {};
  const cachedWord = scores[word] || {};
  cachedWord["incorrect"] = (cachedWord["incorrect"] || 0) + 1;
  cachedWord["bucket"] = Math.max((cachedWord["bucket"] || 0) - 1, 0);

  scores[word] = cachedWord;

  localStorage.setItem("scores", JSON.stringify(scores));
};

export const getNextWord = ({ sessionBuckets, setSessionBuckets }) => {
  const buckets = Object.keys(sessionBuckets).map(Number).sort();

  if (!buckets.length) {
    return;
  }

  const weights = buckets.map((val) => 100 / Math.pow(2, val));
  const totalWeight = weights.reduce((acc, curr) => acc + curr, 0);
  const randomWeight = Math.random() * totalWeight;

  let i = 0;
  const bucketIndex = weights.findIndex((val) => {
    i += val;
    return randomWeight <= i;
  });

  const bucketValue = buckets[bucketIndex];
  const nextWord = shuffle(Array.from(sessionBuckets[bucketValue]))[0];

  sessionBuckets[bucketValue].delete(nextWord);

  if (sessionBuckets[bucketValue].size === 0) {
    delete sessionBuckets[bucketValue];
  }

  setSessionBuckets({ ...sessionBuckets });

  return nextWord;
};
