import { swagger } from "@elysiajs/swagger";
import { Elysia } from "elysia";
import { transactions, utils } from "near-api-js";
import { fetchNonce, latestBlockHash } from "./utils";
import axios from 'axios';

const app = new Elysia({ prefix: "/api", aot: false })
  .use(swagger())
  .get(
    "/transfer/:dao/:receiver/:quantity",
    async ({ params: { dao, receiver, quantity }, headers }) => {
      const mbMetadata = JSON.parse(headers["mb-metadata"] || "{}");
      const accountId = mbMetadata?.accountData?.accountId || "near";
      const publicKey = mbMetadata?.accountData?.devicePublicKey || "";

      const actions: transactions.Action[] = [];
      const args = {
        proposal: {
          description: "Transfer NEAR to " + receiver + ".",
          kind: {
            Transfer: {
              token_id: "",
              receiver_id: receiver,
              amount: quantity,
            },
          },
        },
      };
      actions.push(
        transactions.functionCall(
          "add_proposal",
          args,
          BigInt("200000000000000"), //new BN("200000000000000"), //200 Tgas ?
          BigInt("100000000000000000000000"), //0.1 deposit?
        ),
      );

      const blockHash = await latestBlockHash();
      const nonce = await fetchNonce(accountId, publicKey);
      const transaction = transactions.createTransaction(
        accountId,
        publicKey,
        dao,
        nonce,
        actions,
        utils.serialize.base_decode(blockHash),
      );
      return transaction;
    },
  )
  .get("/daos/:accountId?", async ({ params, headers }) => {
    const mbMetadata = JSON.parse(headers["mb-metadata"] || "{}");
    const accountId = params["accountId?"] || mbMetadata?.accountData?.accountId || "near";

    const apiKey = "29231aff-8c08-4f38-9096-b1d947050d27";
    const response = await axios.get('https://api.pikespeak.ai/daos/members', {
      headers: { 'x-api-key': apiKey }
    });

    const allDaos = response.data;
    const userDaos = allDaos[accountId]?.daos || [];

    return { daos: userDaos };
  })
  .compile();

export const GET = app.handle;
export const POST = app.handle;