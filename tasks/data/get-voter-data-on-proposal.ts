import { task, types } from "@nomiclabs/buidler/config";
import { setBRE, getVoterData } from "../../helpers/helpers";

task(`get-voter-data-on-proposal`, `Returns a voter's data on a proposal`)
  .addParam("proposalId", "Id of the proposal", null, types.string)
  .addParam("voterAddress", "Address of the voter", null, types.string)
  .setAction(async ({ proposalId, voterAddress }, BRE) => {
    setBRE(BRE);
    // await BRE.run("action-deploy-contracts-and-submit-vote");
    const voterData = await getVoterData(parseInt(proposalId), voterAddress);
    console.log(voterData);
    return voterData;
  });
