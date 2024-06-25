import { swagger } from "@elysiajs/swagger";
import { Elysia } from "elysia";
import { transactions, utils } from "near-api-js";
import { fetchNonce, latestBlockHash } from "./utils";

const app = new Elysia({ prefix: "/api", aot: false })
  .use(swagger())
  .get(
    "/transfer/:dao/:reciever/:quantity",
    async ({ params: { dao, reciever, quantity }, headers }) => {
      const mbMetadata = JSON.parse(headers["mb-metadata"] || "{}");
      const accountId = mbMetadata?.accountData?.accountId || "near";
      const publicKey = mbMetadata?.accountData?.devicePublicKey || "";

      const actions: transactions.Action[] = [];
      const args = {
        proposal: {
          description: "Transfer NEAR to " + reciever + ".",
          kind: {
            Transfer: {
              token_id: "",
              receiver_id: reciever,
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

      //need nonce
      //pass network from mbMetadata cause rpc node harcoded in latestblockhash
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
      console.log(transaction);
      return transaction;
      // return transactions.createTransaction(
      //   accountId,
      //   publicKey,
      //   dao,
      //   nonce,
      //   actions,
      //   utils.serialize.base_decode(blockHash),
      // );
    },
  )
  .compile();

export const GET = app.handle;
export const POST = app.handle;
