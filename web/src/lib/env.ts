function optional(key: string, fallback: string = ""): string {
  return process.env[key] || fallback;
}

export const env = {
  get GLM_API_KEY() {
    return optional("GLM_API_KEY");
  },
  get DEPLOYER_PRIVATE_KEY() {
    return optional("DEPLOYER_PRIVATE_KEY");
  },
  get WALLET_SEED() {
    return optional("WALLET_SEED");
  },
  get GAS_SPONSOR_PRIVATE_KEY() {
    return optional("GAS_SPONSOR_PRIVATE_KEY");
  },
  get BASE_RPC_URL() {
    return optional("BASE_RPC_URL", "https://mainnet.base.org");
  },
  get ARC_RPC_URL() {
    return optional(
      "ARC_RPC_URL",
      optional("BASE_RPC_URL", "https://mainnet.base.org"),
    );
  },
  get FACTORY_CONTRACT_ADDRESS() {
    return optional(
      "FACTORY_CONTRACT_ADDRESS",
      "0x84a52e5bb4831d1171cc870f3621cf376fe50933",
    );
  },
  get USDC_CONTRACT_ADDRESS() {
    return optional(
      "USDC_CONTRACT_ADDRESS",
      "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    );
  },
  get QWEN_API_KEY() {
    return optional("QWEN_API_KEY");
  },
  get TEST_API_KEY() {
    return optional("TEST_API_KEY");
  },
  get TEST_CLIENT_KEY() {
    return optional("TEST_CLIENT_KEY");
  },
  get CIRCLE_API_KEY() {
    return optional("CIRCLE_API_KEY", optional("TEST_API_KEY"));
  },
  get NEXT_PUBLIC_CIRCLE_APP_ID() {
    return optional("NEXT_PUBLIC_CIRCLE_APP_ID", optional("TEST_CLIENT_KEY"));
  },
  get CIRCLE_WALLET_SET_ID() {
    return optional("CIRCLE_WALLET_SET_ID");
  },
  get CIRCLE_BLOCKCHAIN() {
    return optional("CIRCLE_BLOCKCHAIN", "ARC-TESTNET");
  },
  get WALLET_PROVIDER() {
    return optional("WALLET_PROVIDER", "circle");
  },
  get RESEND_API_KEY() {
    return optional("RESEND_API_KEY");
  },
  get RESEND_FROM() {
    return optional("RESEND_FROM", "onboarding@resend.dev");
  }, // swap for verified domain later
};
