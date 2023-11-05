import { shuffle } from "./utilities";

export const getBucket = (word) => {
  const scores = JSON.parse(localStorage.getItem("scores")) || {};
  const cachedWord = scores[word] || {};
  return Math.max(cachedWord["bucket"] || 0, 0);
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
  const buckets = Object.keys(sessionBuckets);

  if (!buckets.length) {
    return;
  }

  const weights = buckets.map((_, i) => 100 / Math.pow(2, i));
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
