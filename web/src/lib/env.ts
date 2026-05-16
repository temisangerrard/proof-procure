function optional(key: string, fallback: string = ""): string {
  return process.env[key] || fallback;
}

export const env = {
  get GLM_API_KEY() { return optional("GLM_API_KEY"); },
  get DEPLOYER_PRIVATE_KEY() { return optional("DEPLOYER_PRIVATE_KEY"); },
  get BASE_RPC_URL() { return optional("BASE_RPC_URL", "https://mainnet.base.org"); },
  get ARC_RPC_URL() { return optional("ARC_RPC_URL", optional("BASE_RPC_URL", "https://mainnet.base.org")); },
  get FACTORY_CONTRACT_ADDRESS() { return optional("FACTORY_CONTRACT_ADDRESS"); },
  get TEST_API_KEY() { return optional("TEST_API_KEY"); },
  get TEST_CLIENT_KEY() { return optional("TEST_CLIENT_KEY"); },
  get CIRCLE_API_KEY() { return optional("CIRCLE_API_KEY", optional("TEST_API_KEY")); },
  get NEXT_PUBLIC_CIRCLE_APP_ID() { return optional("NEXT_PUBLIC_CIRCLE_APP_ID", optional("TEST_CLIENT_KEY")); },
  get CIRCLE_WALLET_SET_ID() { return optional("CIRCLE_WALLET_SET_ID"); },
  get CIRCLE_BLOCKCHAIN() { return optional("CIRCLE_BLOCKCHAIN", "ARC-TESTNET"); },
  get DEMO_AUTH_EMAIL() { return optional("DEMO_AUTH_EMAIL", "demo@proofprocure.com"); },
  get CLOUDFLARE_ACCOUNT_ID() { return optional("CLOUDFLARE_ACCOUNT_ID"); },
  get CLOUDFLARE_EMAIL_API_TOKEN() { return optional("CLOUDFLARE_EMAIL_API_TOKEN"); },
  get PROOF_PROCURE_EMAIL_FROM() { return optional("PROOF_PROCURE_EMAIL_FROM", "login@proofprocure.com"); },
};
