function required(key: string): string {
  const v = process.env[key];
  if (!v) throw new Error(`Missing env var: ${key}`);
  return v;
}

function optional(key: string, fallback: string = ""): string {
  return process.env[key] || fallback;
}

export const env = {
  get SESSION_SECRET() { return required("SESSION_SECRET"); },
  get GLM_API_KEY() { return optional("GLM_API_KEY", ""); },
  get DEPLOYER_PRIVATE_KEY() { return optional("DEPLOYER_PRIVATE_KEY", ""); },
  get BASE_RPC_URL() { return optional("BASE_RPC_URL", "https://mainnet.base.org"); },
  get GMAIL_USER() { return optional("GMAIL_USER", ""); },
  get GMAIL_APP_PASSWORD() { return optional("GMAIL_APP_PASSWORD", ""); },
  get FACTORY_CONTRACT_ADDRESS() { return optional("FACTORY_CONTRACT_ADDRESS", ""); },
};
