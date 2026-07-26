import { env } from "../../config/env.js";
import { loadFile as loadLocalFile, storeFile as storeLocalFile } from "./local-storage.js";
import { loadS3File, storeS3File } from "./s3-storage.js";

export const storeFile = (file: Express.Multer.File) =>
  env.FILE_STORAGE === "s3" ? storeS3File(file) : storeLocalFile(file);

export const loadFile = (key: string) =>
  env.FILE_STORAGE === "s3" ? loadS3File(key) : loadLocalFile(key);
