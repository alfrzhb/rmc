import type { CurrentUser } from "@ratama/shared";

export type Bindings = {
  APP_ENV: "local" | "staging" | "production";
  APP_NAME: string;
  ALLOWED_ORIGIN: string;
  ENABLE_FILE_UPLOADS: "false";
  DOCUMENT_STORAGE_MODE: "external_link";
  DB: D1Database;
};

export type Variables = {
  currentUser: CurrentUser;
};

export type AppEnv = {
  Bindings: Bindings;
  Variables: Variables;
};
