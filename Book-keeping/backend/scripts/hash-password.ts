// Usage: npm run hash-password -- "somePlainPassword"
// Prints a bcrypt hash to paste into src/lib/accounts.ts

import bcrypt from "bcryptjs";

const plain = process.argv[2];

if (!plain) {
  console.error('Usage: npm run hash-password -- "yourPassword"');
  process.exit(1);
}

const hash = bcrypt.hashSync(plain, 10);
console.log(hash);
