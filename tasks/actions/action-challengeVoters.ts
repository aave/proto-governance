import { task, types } from "@nomiclabs/buidler/config";
import { setBRE, challengeVoters } from "../../helpers/helpers";
import { ContractReceipt } from "ethers/contract";

task(
  `action-challengeVoters`,
  `In Validating status, challenges voters who did double-voting`
)
  .addParam("proposalId", "Numeric ID of the proposal", null, types.int)
  .addParam(
    "voters",
    "The list of voters addresses to challenge",
    null,
    types.json
  )
  .addParam(
    "signer",
    "The Signer object which submits the transaction",
    null,
    types.json
  )
  .setAction(async ({ proposalId, voters, signer }, _BRE) => {
    setBRE(_BRE);
    const res: ContractReceipt[] = [] as ContractReceipt[];
    res.push(await (await challengeVoters(proposalId, voters, signer)).wait());
    return res;
  });
