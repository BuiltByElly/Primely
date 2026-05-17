export const validateLink = (link: string) => {
  try {
    const parsed = new URL(link);
    return (
      ((parsed.protocol === "https:" || parsed.protocol === "http:") &&
        parsed.host.includes(".")) ||
      parsed.host.includes(":")
    );
  } catch {
    return false;
  }
};
