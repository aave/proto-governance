import BRE from "@nomiclabs/buidler";
import {
  getTestVotingAssetA,
  getEthersSigners,
  getAaveProtoGovernance
} from "../helpers/helpers";

import votingAndCancelSequenceByVoter from "./actions-sequence/voting-cancelsequence-by-voter";
import votingAndCancelSequenceByRelayer from "./actions-sequence/voting-cancelsequence-by-relayer";
import votingWithDoubleVotingSequence from "./actions-sequence/voting-sequence-with-double-voting";
import votingAndSequenceChallengerOtherSide from "./actions-sequence/voting-sequence-challenge-other-side";
import votingSequenceFourVotersAndWhale from "./actions-sequence/voting-sequence-four-voters-and-a-whale";
import votingSequenceNoByVoter from "./actions-sequence/voting-cancelsequence-by-voter-NO";
import votingSequenceAbstainByVoter from "./actions-sequence/voting-cancelsequence-by-voter-ABSTAIN";
import sequenceTryingToResolveAfterLimit from "./actions-sequence/sequence-trying-to-resolve-after-limit";

const scenarios: [string, Function][] = [
  ["Voting and Cancel directly", votingAndCancelSequenceByVoter],
  ["Voting by voter with NO outcome", votingSequenceNoByVoter],
  ["Voting by voter with ABSTAIN outcome", votingSequenceAbstainByVoter],
  ["Voting and Cancel through relayers", votingAndCancelSequenceByRelayer],
  [
    "Voting directly and through relayers",
    votingAndSequenceChallengerOtherSide
  ],
  [
    "Voting with double-voting attempt through relayers",
    votingWithDoubleVotingSequence
  ],
  [
    "4 small voters voting No and a whale Yes",
    votingSequenceFourVotersAndWhale
  ],
  [
    "Fails trying to resolve a proposal after the proposal absolute limit",
    sequenceTryingToResolveAfterLimit
  ]
];

describe("AaveProtoGovernance - Scenarios", async () => {
  for (const [description, scenario] of scenarios) {
    describe(<string>description, async () => {
      before(async () => {
        await BRE.run("dev-deploy");
        await BRE.run("action-newProposal", {
          signer: (await getEthersSigners())[0]
        });
      });

      after(async () => {
        await BRE.run("dev-deploy");
      });

      for (const [description, action] of scenario()) {
        it(description, async () => {
          await action({
            proposalId: 0, // As the AaveProtoGovernance is deployed for each "it", proposal 0 can be used always
            signers: await getEthersSigners(),
            votingAsset: await getTestVotingAssetA(),
            aaveProtoGovernance: await getAaveProtoGovernance()
          });
        });
      }
    });
  }
});
