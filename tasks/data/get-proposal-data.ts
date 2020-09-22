import { task, types } from "@nomiclabs/buidler/config";
import { setBRE, getProposalData } from "../../helpers/helpers";

task(`get-proposal-data`, `Returns a proposal's data`)
  .addParam("proposalId", "Id of the proposal", null, types.string)
  .setAction(async ({ proposalId }, BRE) => {
    setBRE(BRE);
    // await BRE.run("action-deploy-contracts-and-submit-vote");
    const proposalData = await getProposalData(parseInt(proposalId));
    console.log(proposalData);
    return proposalData;
  });
