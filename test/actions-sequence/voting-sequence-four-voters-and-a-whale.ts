import {
  submitVoteByRelayerTestGenerator,
  submitVoteByVoterTestGenerator,
  fastForwardBlockTestGenerator,
  resolveProposalTestGenerator,
  mintTokensTestGenerator
} from "../../helpers/testHelpers";
import { Signer } from "ethers";
import { eVote } from "../../helpers/types";
import { TestVotingAssetA } from "../../types/TestVotingAssetA";
import { AaveProtoGovernance } from "../../types/AaveProtoGovernance";
import { devVotingBlocksDuration } from "../../helpers/constants";

interface iSequenceVotingAndCancelActionParams {
  proposalId: number;
  signers: Signer[];
  votingAsset: TestVotingAssetA;
  aaveProtoGovernance: AaveProtoGovernance;
}

type tSequenceVotingAndCancelReturn = [
  string,
  (params: iSequenceVotingAndCancelActionParams) => Promise<any>
][];

const sequence = (): tSequenceVotingAndCancelReturn => [
  [
    "Voter 1 receives 300K tokens from minting",
    async (params: iSequenceVotingAndCancelActionParams) =>
      await mintTokensTestGenerator({
        to: await params.signers[1].getAddress(),
        token: params.votingAsset.address,
        amount: "300000"
      })
  ],
  [
    "Voter 2 receives 100K tokens from minting",
    async (params: iSequenceVotingAndCancelActionParams) =>
      await mintTokensTestGenerator({
        to: await params.signers[2].getAddress(),
        token: params.votingAsset.address,
        amount: "100000"
      })
  ],
  [
    "Voter 3 receives 500K tokens from minting",
    async (params: iSequenceVotingAndCancelActionParams) =>
      await mintTokensTestGenerator({
        to: await params.signers[3].getAddress(),
        token: params.votingAsset.address,
        amount: "500000"
      })
  ],
  [
    "Voter 4 receives 200K tokens from minting",
    async (params: iSequenceVotingAndCancelActionParams) =>
      await mintTokensTestGenerator({
        to: await params.signers[4].getAddress(),
        token: params.votingAsset.address,
        amount: "200000"
      })
  ],
  [
    "Voter 5 receives 6M tokens from minting",
    async (params: iSequenceVotingAndCancelActionParams) =>
      await mintTokensTestGenerator({
        to: await params.signers[5].getAddress(),
        token: params.votingAsset.address,
        amount: "6000000"
      })
  ],

  [
    "Voter 1 votes through relayer",
    async (params: iSequenceVotingAndCancelActionParams) =>
      await submitVoteByRelayerTestGenerator({
        proposalId: params.proposalId,
        voter: params.signers[1],
        vote: eVote.No,
        votingAsset: params.votingAsset,
        aaveProtoGovernance: params.aaveProtoGovernance,
        relayer: params.signers[0]
      })
  ],
  [
    "Voter 2 votes directly",
    async (params: iSequenceVotingAndCancelActionParams) =>
      await submitVoteByVoterTestGenerator({
        proposalId: params.proposalId,
        voter: params.signers[2],
        vote: eVote.No,
        votingAsset: params.votingAsset,
        aaveProtoGovernance: params.aaveProtoGovernance
      })
  ],
  [
    "Voter 3 votes directly",
    async (params: iSequenceVotingAndCancelActionParams) =>
      await submitVoteByVoterTestGenerator({
        proposalId: params.proposalId,
        voter: params.signers[3],
        vote: eVote.No,
        votingAsset: params.votingAsset,
        aaveProtoGovernance: params.aaveProtoGovernance
      })
  ],
  [
    "Voter 4 votes directly",
    async (params: iSequenceVotingAndCancelActionParams) =>
      await submitVoteByVoterTestGenerator({
        proposalId: params.proposalId,
        voter: params.signers[4],
        vote: eVote.No,
        votingAsset: params.votingAsset,
        aaveProtoGovernance: params.aaveProtoGovernance
      })
  ],
  [
    "(REVERT EXPECTED) Trigger resolveProposal()",
    async (params: iSequenceVotingAndCancelActionParams) =>
      await resolveProposalTestGenerator({
        proposalId: params.proposalId,
        signer: params.signers[0]
      })
  ],
  [
    "Fast forward blocks",
    async (params: iSequenceVotingAndCancelActionParams) =>
      await fastForwardBlockTestGenerator({
        // TODO improve this, as it should not be needed to forward all the blocks required, as ~100 already passed since
        // the proposal was registered
        numberOfBlocks: devVotingBlocksDuration
      })
  ],
  [
    "Voter 5 votes directly",
    async (params: iSequenceVotingAndCancelActionParams) =>
      await submitVoteByVoterTestGenerator({
        proposalId: params.proposalId,
        voter: params.signers[5],
        vote: eVote.Yes,
        votingAsset: params.votingAsset,
        aaveProtoGovernance: params.aaveProtoGovernance
      })
  ],
  [
    "Fast forward blocks",
    async (params: iSequenceVotingAndCancelActionParams) =>
      await fastForwardBlockTestGenerator({
        // TODO improve this, as it should not be needed to forward all the blocks required, as ~100 already passed since
        // the proposal was registered
        numberOfBlocks: devVotingBlocksDuration
      })
  ],
  [
    "Trigger resolveProposal()",
    async (params: iSequenceVotingAndCancelActionParams) =>
      await resolveProposalTestGenerator({
        proposalId: params.proposalId,
        signer: params.signers[0]
      })
  ]
];

export default sequence;
