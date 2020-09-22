import { task, types } from "@nomiclabs/buidler/config";
import { setBRE, submitVoteByVoter } from "../../helpers/helpers";
import { eVote } from "../../helpers/types";

import { ContractReceipt } from "ethers/contract";

task(`action-submitVoteByVoter`, `Submits directly a vote to a proposal`)
  .addParam("proposalId", "Numeric ID of the proposal", null, types.int)
  .addParam("vote", "0 (abstain), 1 (yes), 2 (no)", null, types.int)
  .addParam(
    "votingAsset",
    "The address of the voting asset",
    null,
    types.string
  )
  .addParam(
    "voter",
    "The Signer object of the voter which submits the transaction",
    null,
    types.json
  )
  .setAction(async ({ proposalId, vote, votingAsset, voter }, BRE) => {
    setBRE(BRE);

    const res: ContractReceipt[] = [] as ContractReceipt[];
    res.push(
      await (
        await submitVoteByVoter(proposalId, <eVote>vote, votingAsset, voter)
      ).wait()
    );
    return res;
  });
