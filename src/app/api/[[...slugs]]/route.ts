import { swagger } from "@elysiajs/swagger";
import { Elysia } from "elysia";
// import { transactions, utils } from "near-api-js";

const { Social } = require('@builddao/near-social-js');

const social = new Social();

// const mbMetadata = JSON.parse(headers["mb-metadata"] || "{}");
// const userId = mbMetadata?.accountData?.accountId || "near";
// const publicKey = mbMetadata?.accountData?.devicePublicKey || "";

// // check if userAccount is properly defined
// if (!userId || !publicKey) {
//   throw new Error("user account is missing or invalid");
// }

// const userAccount = {
//   userId,
//   publicKey,
// }

const accountId = "buildagents.near";

// using the API server
// const fetchData = social.get({
//   keys: [`${accountId}/**`],
// });

// // using a direct contract call
// const getData = social.keys({
//   keys: [`${accountId}/**`],
//   useApiServer: false,
// });

// const thing = social.keys({
//   keys: [`${path}`],
//   blockHeight: 0,
//   returnDeleted: true,
//   returnType: 'History',
//   valuesOnly: true,
// });

// const store = social.storageDeposit({
//   userAccount,
//   registration_only: true, // set to true if you want to pay only the bare minimum deposit
//   account_id: accountId, // optional -- defaults to the signer account
//   deposit: '10000000000000000000000', // amount to deposit in yoctoNEAR
// });

// const withdraw = async ({ amount }) => {
//     return await social.storageWithdraw({ amount });
// };

const app = new Elysia({ prefix: "/api", aot: false })
  .use(swagger())

  // data of a particular account
  // .get("/data/:accountId", async ({ params: { accountId } }) => {
  //   try {
  //     const accountData = await fetchData(accountId);
  //     return { status: 'success', data: accountData };
  //   } catch (error) {
  //     throw new Error(`Failed to fetch account data...`);
  //   }
  // })

  // data via specific path
  .get("/data/:path", async ({ params: { path } }) => {
    const socialData = await social.get({
        keys: [`${path}/**`],
    });
    return { socialData };
  })

  // // save new data
  // .get(
  //   "/save",
  //   async ({ params: { userId, newData }}) => {
  //     const setData = social.set({
  //     userAccount,
  //     data: {
  //       [userId]: { newData },
  //     },
  //   });
  //   return { setData };
  // })

  // // update data
  // .get(
  //   "/update",
  //   async ({ params: { userId, newData }}) => {
  //     const args = {
  //       data: {
  //         [userId]: {
  //           newData
  //         }
  //       }
  //     }

  //   return `
  //   [
  //     {
  //       "methodName": "set",
  //       "args": ${JSON.stringify(args)},
  //       "gas": "300000000000000",
  //       "deposit": "10000000000000000000000",
  //     }
  //   ]
  //   Use this data to call \`generate-transaction\` tool to generate a transaction.
  //     `;
  //   },
  // )

  // // storage deposit
  // .post("/store", async ({ body }: { body: { amount: string } }) => {
  //   const { amount } = body;
  //   const transaction = await store({ userAccount, deposit: amount });
  //   return { transaction };
  // })

  // // storage withdrawal
  // .post("/withdraw", async ({ body }) => {
  //   const { amount } = body as { amount: string };
  //   const transaction = await withdraw({ amount });
  //   return { transaction };
  // })

  .compile();

export const GET = app.handle;
export const POST = app.handle;
