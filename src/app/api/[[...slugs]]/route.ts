import { swagger } from "@elysiajs/swagger";
import BN from "bn.js";
import { Elysia } from "elysia";
import { transactions, utils } from "near-api-js";
import { latestBlockHash } from "./utils";

const app = new Elysia({ prefix: "/api", aot: false })
  .use(swagger())
  .get(
    "/transfer/:dao/:reciever/:quantity",
    async ({ params: { dao, reciever, quantity }, headers }) => {
      const mbMetadata = JSON.parse(headers["mb-metadata"] || "{}");
      const accountId = mbMetadata?.accountData?.accountId || "near";

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
          new BN("200000000000000"), //200 Tgas ?
          new BN("100000000000000000000000"), //0.1 deposit?
        ),
      );

      //need nonce
      //pass network from mbMetadata cause rpc node harcoded in latestblockhash
      const blockHash = await latestBlockHash();
      //verify public key.
      return transactions.createTransaction(
        accountId,
        mbMetadata?.accountData?.publicKey,
        dao,
        nonce,
        actions,
        utils.serialize.base_decode(blockHash),
      );
    },
  )
  .compile();

export const GET = app.handle;
export const POST = app.handle;
