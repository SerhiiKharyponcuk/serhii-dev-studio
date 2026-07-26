import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { randomUUID } from "node:crypto";
import { env } from "../../config/env.js";
import { AppError } from "../../utils/http.js";

const required = <T>(value: T | undefined, name: string): T => {
  if (value === undefined)
    throw new Error(`${name} must be configured when FILE_STORAGE is set to s3`);
  return value;
};

const bucket = () => required(env.S3_BUCKET, "S3_BUCKET");
const credentials = () => {
  if (!env.S3_ACCESS_KEY_ID && !env.S3_SECRET_ACCESS_KEY) return {};
  return {
    credentials: {
      accessKeyId: required(env.S3_ACCESS_KEY_ID, "S3_ACCESS_KEY_ID"),
      secretAccessKey: required(env.S3_SECRET_ACCESS_KEY, "S3_SECRET_ACCESS_KEY")
    }
  };
};
const client = () =>
  new S3Client({
    region: env.S3_REGION,
    ...(env.S3_ENDPOINT ? { endpoint: env.S3_ENDPOINT } : {}),
    forcePathStyle: env.S3_FORCE_PATH_STYLE,
    ...credentials()
  });

export async function storeS3File(file: Express.Multer.File) {
  const key = randomUUID();
  await client().send(
    new PutObjectCommand({
      Bucket: bucket(),
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype
    })
  );
  return key;
}

export async function loadS3File(key: string) {
  if (!/^[0-9a-f-]{36}$/i.test(key)) throw new AppError(400, "Invalid file key");
  try {
    const object = await client().send(new GetObjectCommand({ Bucket: bucket(), Key: key }));
    if (!object.Body) throw new AppError(404, "File not found", "NOT_FOUND");
    return Buffer.from(await object.Body.transformToByteArray());
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(404, "File not found", "NOT_FOUND");
  }
}
