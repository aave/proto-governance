import BigNumber from "bignumber.js";
import { Signer } from "ethers";

export enum eEthereumNetwork {
  kovan = "kovan",
  ropsten = "ropsten",
  main = "main",
  buidlerevm = "buidlerevm"
}
export enum eContractid {
  AavePropositionPower = "AavePropositionPower",
  LendingPoolAddressesProvider = "LendingPoolAddressesProvider",
  TestVotingAssetA = "TestVotingAssetA",
  TestVotingAssetB = "TestVotingAssetB",
  AssetVotingWeightProvider = "AssetVotingWeightProvider",
  AaveProtoGovernance = "AaveProtoGovernance",
  ProposalExecutor = "ProposalExecutor",
  FailingProposalExecutor = "FailingProposalExecutor",
  GovernanceParamsProvider = "GovernanceParamsProvider"
}

export enum eProposalType {
  UPGRADE_ADDRESS_PROPOSAL = "UPGRADE_ADDRESS_PROPOSAL"
}

export enum eActionPrefix {
  SUBMIT_VOTE = "SUBMIT_VOTE",
  CANCEL_VOTE = "CANCEL_VOTE",
  TRANSFER_TOKEN = "TRANSFER_TOKEN",
  MINT_TOKEN = "MINT_TOKEN",
  FAST_FORWARD_BLOCK = "FAST_FORWARD_BLOCK",
  CHALLENGE_VOTERS = "CHALLENGE_VOTERS",
  RESOLVE_PROPOSAL = "RESOLVE_PROPOSAL",
  TRY_TO_MOVE_TO_VALIDATING = "TRY_TO_MOVE_TO_VALIDATING"
}

export type tEthereumAddress = string;

export type tStringCurrencyUnits = string; // ex. 2.5
export type tStringDecimalUnits = string; // ex 2500000000000000000
export type tBigNumberCurrencyUnits = BigNumber;
export type tBigNumberDecimalUnits = BigNumber;

export enum eProposalStatus {
  Initializing = "0",
  Voting = "1",
  Validating = "2",
  Executed = "3"
}

export enum eVote {
  Abstain = "0",
  Yes = "1",
  No = "2",
  INVALID = "3"
}

export interface iVoter {
  asset: tEthereumAddress;
  vote: string;
  weight: string;
  balance: tStringDecimalUnits;
  nonce: string;
}

export interface iProposalBasicData {
  totalVotes: number;
  threshold: tStringDecimalUnits;
  maxMovesToVotingAllowed: number;
  movesToVoting: number;
  votingBlocksDuration: number;
  validatingBlocksDuration: number;
  currentStatusInitBlock: number;
  initProposalBlock: number;
  proposalStatus: string;
  proposalExecutor: tEthereumAddress;
  proposalType: string;
}

export interface iProposalAllData extends iProposalBasicData {
  choicesAccumVotes: tStringDecimalUnits[];
  limitBlockOfProposal: number;
}

export interface iGovernanceParams {
  propositionPower: tEthereumAddress;
  propositionPowerThreshold: string;
  assetsVotingWeightProvider: tEthereumAddress;
}

export interface iAssetWithWeight {
  asset: tEthereumAddress;
  weight: string;
}

export interface iVoterWithAddress extends iVoter {
  voter: tEthereumAddress;
}

export type tChaiAssertionGenerator = () => Promise<Chai.Assertion>;

export interface iSubmitVoteContext {
  choicesAccumVotes: tStringDecimalUnits[];
  voterData: iVoter;
  votingStatus: string;
}

export interface iCancelVoteContext extends iSubmitVoteContext {}

export interface iTransferTokensTestParams {
  from: tEthereumAddress;
  to: tEthereumAddress;
  token: tEthereumAddress;
  amount: tStringCurrencyUnits;
}

export interface iMintTokensTestParams {
  to: tEthereumAddress;
  token: tEthereumAddress;
  amount: tStringCurrencyUnits;
}

export interface iTryToMoveToValidatingTestParams {
  proposalId: number;
  signer: Signer;
}

export interface iChallengeVotersTestParams {
  proposalId: number;
  voters: tEthereumAddress[];
  signer: Signer;
}

export interface iFastForwardBlockParams {
  numberOfBlocks: number;
}

export interface iResolveProposalTestParams {
  proposalId: number;
  signer: Signer;
}

export interface iParamsPerNetwork<T> {
  [eEthereumNetwork.kovan]: T;
  [eEthereumNetwork.ropsten]: T;
  [eEthereumNetwork.main]: T;
  [eEthereumNetwork.buidlerevm]: T;
}
