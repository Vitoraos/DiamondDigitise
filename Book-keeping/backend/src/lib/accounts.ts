// ─────────────────────────────────────────────────────────────
// Hardcoded staff accounts for Diamond Residence.
//
// To ADD a person:
//   1. Run: npm run hash-password -- "theirPlainPassword"
//   2. Copy the printed hash into a new entry below.
//
// To REMOVE a person: delete their entry.
//
// Passwords are NEVER stored in plaintext, even here — a leaked
// or shared file should not hand out live credentials.
// ─────────────────────────────────────────────────────────────

export type Role = "owner" | "staff";

export interface Account {
  username: string;
  phone: string; // used as an alternate login identifier
  passwordHash: string; // bcrypt hash — generate with scripts/hash-password.ts
  displayName: string;
  role: Role;
}

export const accounts: Account[] = [
  {
    username: "owner",
    phone: "+2340000000000",
    // placeholder hash — replace by running the hash-password script
    passwordHash: "$2a$10$REPLACE_WITH_REAL_BCRYPT_HASH_______________________",
    displayName: "Owner",
    role: "owner",
  },
];

/**
 * Looks up an account by username OR phone number.
 * Login is intentionally case-insensitive on username, but phone
 * numbers are matched exactly (no normalization assumed here —
 * make sure staff type their number the same way it's stored).
 */
export function findAccount(identifier: string): Account | undefined {
  const normalized = identifier.trim().toLowerCase();
  return accounts.find(
    (a) =>
      a.username.toLowerCase() === normalized || a.phone === identifier.trim()
  );
}
