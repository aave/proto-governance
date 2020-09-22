import { task } from "@nomiclabs/buidler/config";
import {
  setBRE,
  getEthersSigners,
  submitVoteByVoter,
  getTestVotingAssetA,
} from "../../helpers/helpers";
import { eVote } from "../../helpers/types";

task(
  `action-deploy-contracts-and-submit-vote`,
  `Deploy the contracts, creates a proposal 0, mints test token to signer[0] and votes YES`
).setAction(async ({}, BRE) => {
  setBRE(BRE);

  await BRE.run("dev-deploy");

  await BRE.run("action-newProposal", {
    signer: (await getEthersSigners())[0],
  });

  const signer = (await getEthersSigners())[0];
  const votingAsset = await getTestVotingAssetA();

  await BRE.run("action-mintTestVotingAsset", {
    to: await signer.getAddress(),
    amount: "5000000",
  });

  await submitVoteByVoter(0, eVote.No, votingAsset.address, signer);
});
