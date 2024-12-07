import { NextResponse } from "next/server";
import { DEPLOYMENT_URL } from "vercel-url";

const accountId = JSON.parse(process.env.BITTE_KEY || "{}").accountId;
const tunnelUrl = JSON.parse(process.env.BITTE_CONFIG || "{}").url;

const pluginUrl = tunnelUrl || DEPLOYMENT_URL;

if (!accountId) {
	console.warn("No accountId found in environment variables");
}

const json = {
  openapi: "3.0.0",
  info: {
    title: "Near Social Agent",
    description:
      "Assistant designed to help anyone interact with on-chain data using the Near Social graph database.",
    version: "1.0.0",
  },
  servers: [
    {
      url: pluginUrl,
    },
  ],
  "x-mb": {
    "account-id": accountId,
    assistant: {
      name: "Social Agent",
      description:
        "This agent is made to view or update on-chain data stored in the SocialDB contract (social.near).",
      instructions:
        "Facilitate the process of a user saving data in the SocialDB contract under their accountId. To generate the transaction data, you need to provide the following information: the account ID, the intended path, and the data itself. The API will return saved data which should be used with the 'generate-transaction' tool to submit the proposal. Any updates should be calling the 'set' method on the SocialDB contract. Display JSON data in Table format always.",
      tools: [{ type: "generate-transaction" }],
    },
  },
  paths: {
    "/api/data/{accountId}": {
      get: {
        description: "Fetches all the data saved by a given accountId.",
        operationId: "fetchUserData",
        parameters: [
          {
            in: "path",
            name: "accountId",
            required: true,
            schema: {
              type: "string",
            },
            description:
              "The account data saved in the SocialDB contract by a given account.",
          },
        ],
        responses: {
          "200": {
            description: "All the data under a given account.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    daos: {
                      type: "array",
                      description:
                        "The data saved in the SocialDB contract by a given account.",
                      items: {
                        type: "string",
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
};

export async function GET() {
  //const pluginData = {}
  return NextResponse.json(json);
}
