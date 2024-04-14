import fs from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

export function temporaryDirectory({ prefix = '' } = {}) {
  const uniqueString = generateRandomString(8); // Generates a random 8-character string
  const directory = path.join(tmpdir(), `${prefix}${uniqueString}`);

  fs.mkdirSync(directory, { recursive: true }); // Ensures the directory is created if it doesn't exist
  return directory;
}

export function generateRandomString(length: number) {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}