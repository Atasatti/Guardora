// Creates or updates an ADMIN account in the database named by MONGO_URI.
//
// Registration normally requires an emailed activation code, which is
// impractical for the first account and for demo environments. This seeds a
// verified, active administrator directly.
//
//   node scripts/seed-admin.mjs
//
// The password is prompted for and masked so it never reaches shell history.

import readline from "node:readline";
import dotenv from "dotenv";
import mongoose from "mongoose";
import User from "../src/models/user.js";

dotenv.config();

const ask = (query, { hidden = false } = {}) =>
  new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: true,
    });
    if (hidden) {
      rl._writeToOutput = function (chunk) {
        // Echo the prompt itself, mask whatever is typed after it.
        rl.output.write(chunk.includes(query) ? query : "*");
      };
    }
    rl.question(query, (answer) => {
      rl.close();
      if (hidden) process.stdout.write("\n");
      resolve(answer.trim());
    });
  });

const fail = (message) => {
  console.error(`\n${message}`);
  process.exit(1);
};

if (!process.env.MONGO_URI) fail("MONGO_URI is not set. Check backend/.env.");

const email = (await ask("Admin email: ")).toLowerCase();
if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) fail("That is not a valid email.");

const password = await ask("Password (min 6 chars): ", { hidden: true });
if (password.length < 6) fail("Password must be at least 6 characters.");
if ((await ask("Confirm password: ", { hidden: true })) !== password) {
  fail("Passwords did not match.");
}

const name = (await ask("Display name [Administrator]: ")) || "Administrator";
const phoneNumber = (await ask("Phone number [+10000000000]: ")) || "+10000000000";
const unitNumber = (await ask("Unit number [ADMIN-1]: ")) || "ADMIN-1";

await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 20000 });
console.log(`\nconnected to database: ${mongoose.connection.db.databaseName}`);

// Assigning through the document (rather than an update query) keeps the
// pre-save hook responsible for hashing.
const existing = await User.findOne({ email });
const user = existing || new User({ email });
Object.assign(user, {
  name,
  password,
  phoneNumber,
  unitNumber,
  role: "ADMIN",
  isVerified: true,
  accountStatus: "ACTIVE",
  failedLoginAttempts: 0,
  lockUntil: null,
});
await user.save();

console.log(existing ? "updated existing admin:" : "created admin:");
console.log(`  ${user.email}  role=${user.role}  id=${user._id}`);

await mongoose.disconnect();
