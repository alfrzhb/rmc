export type Bindings = {
  APP_ENV: "local" | "staging" | "production";
  APP_NAME: string;
  ALLOWED_ORIGIN: string;
  MAX_UPLOAD_SIZE_MB: string;
  DB: D1Database;
  R2_BUCKET: R2Bucket;
};
