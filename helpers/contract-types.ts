import BigNumber from "bignumber.js";
import { Signer } from "ethers";
import { TestVotingAssetA } from "../types/TestVotingAssetA";
import { TestVotingAssetB } from "../types/TestVotingAssetB";
import { AaveProtoGovernance } from "../types/AaveProtoGovernance";
import {
  tStringDecimalUnits,
  iVoterWithAddress,
  tEthereumAddress,
  eVote
} from "./types";

export interface iTryToMoveToValidatingContext {
  choicesAccumVotes: tStringDecimalUnits[];
  aaveProtoGovernance: AaveProtoGovernance;
}

export interface iChallengeVotersContext {
  choicesAccumVotes: tStringDecimalUnits[];
  votersData: iVoterWithAddress[];
  aaveProtoGovernance: AaveProtoGovernance;
}

export interface iResolveProposalContext {
  choicesAccumVotes: tStringDecimalUnits[];
  targetAddressBeforeChange: tEthereumAddress; // The address which should or not be changed after executing the proposal
  aaveProtoGovernance: AaveProtoGovernance;
  blockLimitOfProposal: number;
}

export interface iFastForwardBlockContext {
  blockNumber: number;
}

export interface iSubmitVoteByVoterTestParams {
  proposalId: number;
  voter: Signer;
  vote: eVote;
  votingAsset: TestVotingAssetA;
  aaveProtoGovernance: AaveProtoGovernance;
}

export interface iSubmitVoteByRelayerTestParams
  extends iSubmitVoteByVoterTestParams {
  relayer: Signer;
}

export interface iCancelVoteByVoterTestParams {
  proposalId: number;
  voter: Signer;
  aaveProtoGovernance: AaveProtoGovernance;
}

export interface iCancelVoteByRelayerTestParams
  extends iCancelVoteByVoterTestParams {
  relayer: Signer;
}

export type tToken = TestVotingAssetA | TestVotingAssetB;

export interface iTransferTokenContext {
  senderBalance: tStringDecimalUnits;
  recipientBalance: tStringDecimalUnits;
  token: tToken;
}

export interface iMintTokensContext {
  senderAddress: tEthereumAddress;
  recipientBalance: tStringDecimalUnits;
  token: tToken;
}
