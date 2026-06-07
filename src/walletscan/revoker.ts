import { ethers } from "ethers";

const ERC20_ABI = ["function approve(address spender,uint256 amount) returns (bool)"] as const;

export function buildRevokeTx(tokenAddress: string, spenderAddress: string): object {
  const iface = new ethers.Interface(ERC20_ABI);
  return {
    to: tokenAddress,
    data: iface.encodeFunctionData("approve", [spenderAddress, 0n]),
    value: "0"
  };
}
