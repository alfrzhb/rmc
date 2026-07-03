export type AccessIdentity = {
  email: string | null;
  jwt: string | null;
};

export function getAccessIdentity(request: Request): AccessIdentity {
  const headers = request.headers;

  return {
    email: headers.get("cf-access-authenticated-user-email"),
    jwt: headers.get("cf-access-jwt-assertion")
  };
}
