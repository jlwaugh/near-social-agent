const { JsonRpcProvider } = require("@near-js/providers");
import axios from "axios";
import { utils } from "near-api-js";
//import { AccessKeyViewRaw } from "@near-js/types";

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
    console.log(forgeUrl(`https://api.pikespeak.ai/${query}`, params));
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
