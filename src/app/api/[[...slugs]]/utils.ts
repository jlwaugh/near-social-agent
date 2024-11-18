const { JsonRpcProvider } = require("@near-js/providers");
import axios from "axios";
import Big from "big.js";
import { transactions, utils } from "near-api-js";

export async function latestBlockHash(): Promise<string> {
  const provider = new JsonRpcProvider({ url: "https://rpc.near.org" });
  const { sync_info } = await provider.status();

  return sync_info.latest_block_hash;
}

export async function fetchNonce(
  accountId: string,
  publicKey: utils.key_pair.PublicKey,
): Promise<number> {
  const provider = new JsonRpcProvider({ url: "https://rpc.near.org" });
  const rawAccessKey = await provider.query({
    request_type: "view_access_key",
    account_id: accountId,
    public_key: publicKey.toString(),
    finality: "optimistic",
  });

  return rawAccessKey.nonce;
}

export async function fetchNearView(
  accountId: string,
  methodName: string,
  argsBase64: string,
): Promise<any> {
  const provider = new JsonRpcProvider({
    url: "https://free.rpc.fastnear.com/",
  });
  const rawAccessKey = await provider.query({
    request_type: "call_function",
    account_id: accountId,
    args_base64: argsBase64,
    method_name: methodName,
    finality: "optimistic",
  });
  const resultBytes = rawAccessKey.result;
  const resultString = String.fromCharCode(...resultBytes);
  return JSON.parse(resultString);
}

const forgeUrl = (apiUrl: string, params: { [key: string]: any }) =>
  apiUrl +
  Object.keys(params)
    .sort()
    .reduce((paramString, p) => paramString + `${p}=${params[p]}&`, "?");

export async function pikespeakQuery(
  query: string,
  params: { [key: string]: any } = {},
) {
  try {
    const response = await axios.get(
      forgeUrl(`https://api.pikespeak.ai/${query}`, params),
      {
        headers: { "x-api-key": "29231aff-8c08-4f38-9096-b1d947050d27" },
      },
    );
    return response.data;
  } catch (error) {
    console.error(`Error fetching data from ${query}:`, error);
    throw error;
  }
}

export async function fetchFTMetadata(account: string) {
  return await fetchNearView(account, "ft_metadata", "e30=");
}

export async function createTransferProposal(
  accountId: string,
  publicKey: utils.key_pair.PublicKey,
  dao: string,
  receiver: string,
  quantity: string,
  tokenId: string,
) {
  const daoPolicy = await fetchNearView(dao, "get_policy", "e30=");
  const actions: transactions.Action[] = [];
  let decimals = 24;
  if (tokenId !== "") {
    const metadata = await fetchFTMetadata(tokenId);
    decimals = metadata?.decimals;
  }
  const amount = Big(quantity).mul(Big(10).pow(decimals)).toFixed();
  const args = {
    proposal: {
      description: "Transfer to " + receiver + ".",
      kind: {
        Transfer: {
          token_id: tokenId,
          receiver_id: receiver,
          amount: amount,
        },
      },
    },
  };

  // Get deposit from policy
  const deposit = daoPolicy?.proposal_bond || "100000000000000000000000"; // 0.1 NEAR default

  // Return the function call data in AI-friendly format
  return `
[
    {
      "methodName": "add_proposal",
      "args": ${JSON.stringify(args)},
      "gas": "200000000000000",
      "deposit": "${deposit}",
      "contractName": "${dao}"
    }
]
Use this data to call \`generate-transaction\` tool to generate a transaction.
  `;
}
