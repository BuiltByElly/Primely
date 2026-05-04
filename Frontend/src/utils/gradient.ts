// gradientFromUsername.ts

const GRADIENTS = [
  "bg-gradient-to-r from-rose-400 to-orange-400",
  "bg-gradient-to-br from-violet-500 to-fuchsia-500",
  "bg-gradient-to-r from-cyan-400 to-blue-500",
  "bg-gradient-to-br from-emerald-400 to-teal-500",
  "bg-gradient-to-r from-amber-400 to-rose-500",
  "bg-gradient-to-bl from-sky-400 to-indigo-500",
  "bg-gradient-to-r from-pink-400 to-purple-600",
  "bg-gradient-to-br from-lime-400 to-emerald-500",
  "bg-gradient-to-r from-orange-400 to-pink-500",
  "bg-gradient-to-bl from-blue-400 to-cyan-400",
];

export function getGradientClasses(username: string): string {
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = (hash * 31 + username.charCodeAt(i)) >>> 0;
  }
  return GRADIENTS[hash % GRADIENTS.length];
}
