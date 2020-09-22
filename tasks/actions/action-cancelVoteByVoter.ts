import { task, types } from "@nomiclabs/buidler/config";
import { setBRE, cancelVoteByVoter } from "../../helpers/helpers";
import { ContractReceipt } from "ethers/contract";

task(`action-cancelVoteByVoter`, `Cancel a vote on a proposal`)
  .addParam("proposalId", "Numeric ID of the proposal", null, types.int)
  .addParam(
    "voter",
    "The Signer object of the voter which submits the transaction",
    null,
    types.json
  )
  .setAction(async ({ proposalId, voter }, BRE) => {
    setBRE(BRE);

    const res: ContractReceipt[] = [] as ContractReceipt[];
    res.push(await (await cancelVoteByVoter(proposalId, voter)).wait());
    return res;
  });
