function optional(key: string, fallback: string = ""): string {
  return process.env[key] || fallback;
}

export const env = {
  get GLM_API_KEY() { return optional("GLM_API_KEY"); },
  get DEPLOYER_PRIVATE_KEY() { return optional("DEPLOYER_PRIVATE_KEY"); },
  get BASE_RPC_URL() { return optional("BASE_RPC_URL", "https://mainnet.base.org"); },
  get FACTORY_CONTRACT_ADDRESS() { return optional("FACTORY_CONTRACT_ADDRESS"); },
};
