export const validateLink = (link: string) => {
  try {
    const parsed = new URL(link);
    return (
      ((parsed.protocol === "https:" || parsed.protocol === "http:") &&
        parsed.hostname.includes(".")) ||
      parsed.hostname.includes(":")
    );
  } catch {
    return false;
  }
};
