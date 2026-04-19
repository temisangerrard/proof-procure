function required(key: string): string {
  const v = process.env[key];
  if (!v) throw new Error(`Missing env var: ${key}`);
  return v;
}

function optional(key: string, fallback: string = ""): string {
  return process.env[key] || fallback;
}

export const env = {
  get RESEND_API_KEY() { return required("RESEND_API_KEY"); },
  get CLOUDFLARE_ACCOUNT_ID() { return required("CLOUDFLARE_ACCOUNT_ID"); },
  get CLOUDFLARE_D1_API_TOKEN() { return required("CLOUDFLARE_D1_API_TOKEN"); },
  get DATABASE_ID() { return required("DATABASE_ID"); },
  get SESSION_SECRET() { return required("SESSION_SECRET"); },
  get GLM_API_KEY() { return required("GLM_API_KEY"); },
  get DEPLOYER_PRIVATE_KEY() { return required("DEPLOYER_PRIVATE_KEY"); },
  get BASE_RPC_URL() { return optional("BASE_RPC_URL", "https://mainnet.base.org"); },
  get GMAIL_USER() { return optional("GMAIL_USER", ""); },
  get GMAIL_APP_PASSWORD() { return optional("GMAIL_APP_PASSWORD", ""); },
};
