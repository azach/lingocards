import { shuffle } from "./utilities";

export const DEFAULT_SESSION_LENGTH = 25;
export const SESSION_LENGTHS = [
  { value: null, label: "All words" },
  { value: 50, label: 50 },
  { value: 25, label: 25 },
  { value: 10, label: 10 },
  { value: 5, label: 5 },
];

export const SESSION_ALGORITHMS = [
  { value: null, label: "Default (Spaced Repetition)" },
  { value: "random", label: "Random" },
  { value: "legacy", label: "Legacy Bucket System" },
];

const MAX_BUCKET = 6;

// SM-2 Algorithm Constants
const INITIAL_EASE_FACTOR = 2.5;
const MIN_EASE_FACTOR = 1.3;
const INITIAL_INTERVAL = 1; // days
const EASY_BONUS = 1.3;

// Legacy bucket system (kept for backwards compatibility)
export const getBucket = (word) => {
  const scores = getScore(word);
  const netScore = Math.max(scores.correct - scores.incorrect, 0);
  const scoreToRawBucket = Math.floor(Math.log2(netScore + 3));

  return Math.min(Math.max(scoreToRawBucket, 1), MAX_BUCKET);
};

export const getScore = (word) => {
  const scores = JSON.parse(localStorage.getItem("scores")) || {};
  const cachedWord = scores[word] || {};

  return {
    correct: Math.max(cachedWord["correct"] || 0, 0),
    incorrect: Math.max(cachedWord["incorrect"] || 0, 0),
    easeFactor: cachedWord["easeFactor"] || INITIAL_EASE_FACTOR,
    interval: cachedWord["interval"] || 0,
    dueDate: cachedWord["dueDate"] || Date.now(),
    lastReviewed: cachedWord["lastReviewed"] || null,
  };
};

// Get SM-2 card data
export const getCardData = (word) => {
  const scores = JSON.parse(localStorage.getItem("scores")) || {};
  const cachedWord = scores[word] || {};

  return {
    easeFactor: cachedWord["easeFactor"] || INITIAL_EASE_FACTOR,
    interval: cachedWord["interval"] || 0,
    dueDate: cachedWord["dueDate"] || Date.now(),
    lastReviewed: cachedWord["lastReviewed"] || null,
    repetitions: cachedWord["repetitions"] || 0,
  };
};

// Check if a word is due for review
export const isDue = (word) => {
  const cardData = getCardData(word);
  return cardData.dueDate <= Date.now();
};

// SM-2 Algorithm: Mark word as correct
// quality: 0-5 scale (3-5 = pass, 0-2 = fail)
//   5 = perfect response
//   4 = correct with hesitation
//   3 = correct with difficulty
//   2 = incorrect but remembered
//   1 = incorrect but familiar
//   0 = complete blackout
const updateCardSM2 = (word, quality) => {
  const scores = JSON.parse(localStorage.getItem("scores")) || {};
  const cachedWord = scores[word] || {};

  // Get current values or defaults
  let easeFactor = cachedWord["easeFactor"] || INITIAL_EASE_FACTOR;
  let interval = cachedWord["interval"] || 0;
  let repetitions = cachedWord["repetitions"] || 0;

  // Update statistics
  if (quality >= 3) {
    cachedWord["correct"] = (cachedWord["correct"] || 0) + 1;
  } else {
    cachedWord["incorrect"] = (cachedWord["incorrect"] || 0) + 1;
  }

  // SM-2 Algorithm
  if (quality >= 3) {
    // Correct response
    if (repetitions === 0) {
      interval = INITIAL_INTERVAL;
    } else if (repetitions === 1) {
      interval = 6;
    } else {
      interval = Math.round(interval * easeFactor);
    }
    repetitions += 1;
  } else {
    // Incorrect response - reset
    repetitions = 0;
    interval = INITIAL_INTERVAL;
  }

  // Update ease factor based on quality
  easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  easeFactor = Math.max(easeFactor, MIN_EASE_FACTOR);

  // Calculate next due date
  const dueDate = Date.now() + interval * 24 * 60 * 60 * 1000;

  // Save updated values
  cachedWord["easeFactor"] = easeFactor;
  cachedWord["interval"] = interval;
  cachedWord["repetitions"] = repetitions;
  cachedWord["dueDate"] = dueDate;
  cachedWord["lastReviewed"] = Date.now();

  scores[word] = cachedWord;
  localStorage.setItem("scores", JSON.stringify(scores));

  return { easeFactor, interval, repetitions, dueDate };
};

export const markCorrect = (word) => {
  // Quality 4 = correct with slight hesitation (good default for "got it")
  updateCardSM2(word, 4);
};

export const markIncorrect = (word) => {
  // Quality 1 = incorrect but word seems familiar
  updateCardSM2(word, 1);
};

// Additional quality levels for future enhancement
export const markPerfect = (word) => {
  updateCardSM2(word, 5);
};

export const markHard = (word) => {
  updateCardSM2(word, 3);
};

export const getSnooze = (word) => {
  const snoozed = JSON.parse(localStorage.getItem("snoozed")) || {};
  return snoozed[word];
};

export const setSnooze = (word, date) => {
  const snoozed = JSON.parse(localStorage.getItem("snoozed")) || {};

  if (!date) {
    delete snoozed[word];
  } else {
    snoozed[word] = date;
  }

  localStorage.setItem("snoozed", JSON.stringify(snoozed));
};

export const isSnoozed = (word) => {
  const snoozedUntil = getSnooze(word);

  if (!snoozedUntil) {
    return false;
  }

  if (snoozedUntil >= Number(new Date())) {
    return true;
  }

  setSnooze(word, null);

  return false;
};

export const getNextWord = ({
  sessionBuckets,
  setSessionBuckets,
  sessionAlgorithm,
}) => {
  const buckets = Object.keys(sessionBuckets).map(Number).sort();

  if (!buckets.length) {
    return;
  }

  let bucketValue;
  let nextWord;

  if (sessionAlgorithm === "random") {
    // Random: pick any word randomly
    const candidates = shuffle(
      buckets.flatMap((val) =>
        Array.from(sessionBuckets[val]).map((entry) => ({ val, entry }))
      )
    );

    bucketValue = candidates[0].val;
    nextWord = candidates[0].entry;
  } else if (sessionAlgorithm === "legacy") {
    // Legacy bucket system: weighted by bucket
    const weights = buckets.map((val) => 100 / Math.pow(2, val));
    const totalWeight = weights.reduce((acc, curr) => acc + curr, 0);
    const randomWeight = Math.random() * totalWeight;

    let i = 0;
    const bucketIndex = weights.findIndex((val) => {
      i += val;
      return randomWeight <= i;
    });

    bucketValue = buckets[bucketIndex];
    nextWord = shuffle(Array.from(sessionBuckets[bucketValue]))[0];
  } else {
    // Default: Spaced Repetition - prioritize due words and overdue words
    const allWords = buckets.flatMap((val) =>
      Array.from(sessionBuckets[val]).map((word) => ({
        word,
        bucket: val,
        cardData: getCardData(word),
      }))
    );

    // Sort by due date (most overdue first), then by bucket (lower = less mastered)
    allWords.sort((a, b) => {
      const dueDiff = a.cardData.dueDate - b.cardData.dueDate;
      if (Math.abs(dueDiff) > 1000 * 60 * 60) {
        // If more than 1 hour difference in due date, prioritize by due date
        return dueDiff;
      }
      // Otherwise prioritize by bucket (less mastered words)
      return a.bucket - b.bucket;
    });

    // Take from top 20% to add some randomness while still prioritizing due words
    const topCandidates = allWords.slice(0, Math.max(1, Math.ceil(allWords.length * 0.2)));
    const selected = shuffle(topCandidates)[0];

    nextWord = selected.word;
    bucketValue = selected.bucket;
  }

  sessionBuckets[bucketValue].delete(nextWord);

  if (sessionBuckets[bucketValue].size === 0) {
    delete sessionBuckets[bucketValue];
  }

  setSessionBuckets({ ...sessionBuckets });

  return nextWord;
};
