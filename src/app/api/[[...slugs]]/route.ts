import { swagger } from "@elysiajs/swagger";
import { Elysia } from "elysia";
import { transactions, utils } from "near-api-js";
import {
  fetchNearView,
  fetchNonce,
  latestBlockHash,
  pikespeakQuery,
} from "./utils";
import Big from "big.js";

const app = new Elysia({ prefix: "/api", aot: false })
  .use(swagger())
  // Create a Near Transfer proposal
  .get(
    "/transfer/:dao/:receiver/:quantity",
    async ({ params: { dao, receiver, quantity }, headers }) => {
      const mbMetadata = JSON.parse(headers["mb-metadata"] || "{}");
      const accountId = mbMetadata?.accountData?.accountId || "near";
      const publicKey = mbMetadata?.accountData?.devicePublicKey || "";
      const daoPolicy = await fetchNearView(dao, "get_policy", "e30=");
      const actions: transactions.Action[] = [];
      const args = {
        proposal: {
          description: "Transfer NEAR to " + receiver + ".",
          kind: {
            Transfer: {
              token_id: "",
              receiver_id: receiver,
              amount: Big(quantity).mul(Big(10).pow(24)).toFixed(),
            },
          },
        },
      };
      actions.push(
        transactions.functionCall(
          "add_proposal",
          args,
          BigInt("200000000000000"), //new BN("200000000000000"), //200 Tgas ?
          BigInt(daoPolicy?.proposal_bond || "100000000000000000000000"), //0.1 deposit?
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
  // List of all DAOs a user is part of.
  .get("/daos/:account?", async ({ params: { account }, headers }) => {
    const mbMetadata = JSON.parse(headers["mb-metadata"] || "{}");
    const accountId = account || mbMetadata?.accountData?.accountId || "near";
    const allDaos = await pikespeakQuery("daos/members");
    const userDaos = allDaos?.[accountId]?.daos || [];

    return { daos: userDaos };
  })
  // List of top n(or all) proposals in a DAO.
  .get("/proposals/:dao", async ({ params: { dao }, query }) => {
    const count = query.count ? Number(query.count) : 50;
    const proposals = await pikespeakQuery(`daos/proposals`, {
      daos: [dao],
      limit: count,
    });
    return { proposals: proposals };
  })
  // List proposals the user is eligible to vote on
  .get(
    "/proposals/vote/:account?",
    async ({ params: { account }, headers }) => {
      const mbMetadata = JSON.parse(headers["mb-metadata"] || "{}");
      const accountId = account || mbMetadata?.accountData?.accountId || "near";

      // daos where user has permission to vote
      const daos =
        (await pikespeakQuery(`daos/members`))[accountId]?.daos ?? [];

      const daoPolicyPromises = daos.map((dao) =>
        fetchNearView(dao, "get_policy", "e30=").then((policy) => ({
          daoId: dao,
          policy,
        })),
      );
      const policies = await Promise.all(daoPolicyPromises);

      const groupWithPermission = policies.flatMap(({ daoId, policy }) =>
        policy.roles
          .filter((role) => {
            const hasVotingPermission =
              role.permissions &&
              role.permissions.some(
                (permission) =>
                  permission.includes(":VoteApprove") ||
                  permission.includes(":VoteReject") ||
                  permission.includes(":VoteRemove"),
              );
            // Ensure that role.kind.Group exists and account is included in the group
            const isAccountInGroup =
              role.kind.Group && role.kind.Group.includes(account);
            // Only return roles where voting permission exists and account is included in the group
            return hasVotingPermission && isAccountInGroup;
          })
          .map(() => daoId),
      );
      const proposals = await pikespeakQuery(`daos/proposals`, {
        daos: [groupWithPermission],
        status: ["InProgress"],
      });

      return { proposals: proposals };
    },
  )
  // Specific Information for a given proposal
  .get(
    "/proposal/:dao/:proposalId",
    async ({ params: { dao, proposalId } }) => {
      const response = await pikespeakQuery(`daos/proposal/${dao}`, {
        id: proposalId,
      });
      return { proposal: response[0] };
    },
  )
  // Voting on a given proposal.
  .get(
    "/vote/:dao/:proposalId/:action",
    async ({ params: { dao, proposalId, action }, headers }) => {
      const mbMetadata = JSON.parse(headers["mb-metadata"] || "{}");
      const accountId = mbMetadata?.accountData?.accountId || "near";
      const publicKey = mbMetadata?.accountData?.devicePublicKey || "";
      const actions: transactions.Action[] = [];
      actions.push(
        transactions.functionCall(
          "act_proposal",
          {
            id: proposalId,
            action: action,
          },
          BigInt("300000000000000"),
          BigInt("0"),
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
  .compile();

export const GET = app.handle;
export const POST = app.handle;
