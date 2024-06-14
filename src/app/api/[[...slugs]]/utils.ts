const { JsonRpcProvider } = require("@near-js/providers");

export async function latestBlockHash(): Promise<string> {
  const provider = new JsonRpcProvider({ url: "https://rpc.near.org" });
  const { sync_info } = await provider.status();

  return sync_info.latest_block_hash;
}
