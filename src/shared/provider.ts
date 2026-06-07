import { ethers } from "ethers";
import { PHAROS_CONFIG } from "../config";

let provider: ethers.JsonRpcProvider | undefined;

export function getProvider(): ethers.JsonRpcProvider {
  if (!provider) {
    provider = new ethers.JsonRpcProvider(
      PHAROS_CONFIG.rpc,
      { chainId: PHAROS_CONFIG.chainId, name: "pharos-atlantic-testnet" },
      { staticNetwork: true }
    );
  }

  return provider;
}
