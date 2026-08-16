const MESSAGES = [
  "how's business going today?",
  "ready to log today's numbers?",
  "let's see what today brings.",
  "another day at Diamond Residence.",
  "hope the till's been busy today.",
  "let's get today on record.",
];

/** Picks a message deterministically by day-of-year, so it rotates
 * daily without differing between server render and client hydration. */
export function greetingForToday(): string {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86_400_000
  );
  return MESSAGES[dayOfYear % MESSAGES.length];
}
