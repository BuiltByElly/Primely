export const capitalize = (str: string) => {
  if (!str) return;
  const words = str.split(" ");

  for (const word of words) {
    const firstLetter = word.charAt(0).toUpperCase();
    const remainingLetter = word.slice(1);

    const completeWord = firstLetter + remainingLetter;
    words[words.indexOf(word)] = completeWord;
  }
  return words.join(" ");
};
