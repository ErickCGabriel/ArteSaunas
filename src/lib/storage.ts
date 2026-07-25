import "server-only";

import path from "node:path";
import fs from "node:fs";

// Files live next to the SQLite database (data/uploads/<contactId>/...) so a
// single directory (data/) covers everything that needs backing up.
const DATA_DIR = path.dirname(
  process.env.DATABASE_PATH ?? path.join(process.cwd(), "data", "artesaunas.db")
);
const UPLOADS_DIR = path.join(DATA_DIR, "uploads");

export function getContactUploadDir(contactId: string) {
  const dir = path.join(UPLOADS_DIR, contactId);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export function getContactFilePath(contactId: string, storedName: string) {
  return path.join(getContactUploadDir(contactId), storedName);
}
