import bs58 from "bs58";
import { Contract, Signer, Wallet, ethers } from "ethers";
import { promises } from "fs";
import { AavePropositionPower } from "../types/AavePropositionPower";
import { LendingPoolAddressesProvider } from "../types/LendingPoolAddressesProvider";
import { TestVotingAssetA } from "../types/TestVotingAssetA";
import { TestVotingAssetB } from "../types/TestVotingAssetB";
import { AaveProtoGovernance } from "../types/AaveProtoGovernance";
import { ProposalExecutor } from "../types/ProposalExecutor";
import { FailingProposalExecutor } from "../types/FailingProposalExecutor";
import { AssetVotingWeightProvider } from "../types/AssetVotingWeightProvider";
import { BuidlerRuntimeEnvironment } from "@nomiclabs/buidler/types";
import { GovernanceParamsProvider } from "../types/GovernanceParamsProvider";
import { getDb } from "./artifactsDb";
import BigNumber from "bignumber.js";
import BN = require("bn.js");
import {
  eContractid,
  tEthereumAddress,
  iVoter,
  eVote,
  tStringDecimalUnits,
  iProposalBasicData,
  iVoterWithAddress,
  iProposalAllData,
  iGovernanceParams,
  iAssetWithWeight,
  iParamsPerNetwork,
  eEthereumNetwork
} from "./types";
import {
  testVotingAssetAName,
  testVotingAssetASymbol,
  testVotingAssetADecimals,
  testVotingAssetBName,
  testVotingAssetBSymbol,
  testVotingAssetBDecimals,
  getPropositionPowerThresholdByNetwork,
  getAssetWeighParamsTestString,
  getAssetsWeightParamsByNetworkProdString,
  getPropositionPowerThresholdByNetworkString
} from "./constants";
import { ethers as externalEthers } from "ethers";
import { TransactionRequest } from "ethers/providers";
import { verifyContract } from "./etherscan-verification";
import { tToken } from "./contract-types";

export const writeObjectToFile = async (path: string, obj: object) =>
  await promises.writeFile(path, JSON.stringify(obj));

export const bnToBigNumber = (amount: BN): BigNumber =>
  new BigNumber(<any>amount);
export const stringToBigNumber = (amount: string): BigNumber =>
  new BigNumber(amount);

export const getKeyByValue = (object: { [key: string]: any }, value: any) =>
  Object.keys(object).find(key => object[key] === value);

// Buidler Runtime Environment
export let BRE: BuidlerRuntimeEnvironment = {} as BuidlerRuntimeEnvironment;
export const setBRE = (_BRE: BuidlerRuntimeEnvironment) => {
  BRE = _BRE;
};

export const getEthersSigners = async (): Promise<Signer[]> =>
  await Promise.all(await BRE.ethers.signers());

export const getEthersSignersAddresses = async (): Promise<tEthereumAddress[]> =>
  await Promise.all(
    (await BRE.ethers.signers()).map(signer => signer.getAddress())
  );

export const range = (size: number) => Array.from(Array(size).keys());

export const fastForwardBlocks = async (numberOfBlocks: number) => {
  for (let i = 0; i < numberOfBlocks; i++) {
    await BRE.ethers.provider.send("evm_mine", []);
  }
};

export const getCurrentBlock = async () => {
  return BRE.ethers.provider.getBlockNumber();
};

export const sleep = (milliseconds: number) => {
  return new Promise(resolve => setTimeout(resolve, milliseconds));
};

const deployContract = async <ContractType extends Contract>(
  contractName: string,
  args: any[]
): Promise<ContractType> =>
  (await (await BRE.ethers.getContract(contractName)).deploy(
    ...args
  )) as ContractType;

const getContract = async <ContractType extends Contract>(
  contractName: string,
  address: string
): Promise<ContractType> =>
  (await (await BRE.ethers.getContract(contractName)).attach(
    address
  )) as ContractType;

export const deployAavePropositionPower = async (
  [tokenName, tokenSymbol, tokenDecimals, cap]: [
    string,
    string,
    string,
    string
  ],
  verify?: boolean
) => {
  let council: tEthereumAddress[] = [];
  switch (BRE.network.name) {
    case "buidlerevm":
      council = await getDevCouncil();
      break;
    case "kovan":
      council = await getKovanCouncil();
      break;
    case "ropsten":
      council = await getRopstenCouncil();
      break;
    case "main":
      council = await getMainCouncil();
      break;
    default:
      council = await getDevCouncil();
      break;
  }
  const id = eContractid.AavePropositionPower;
  const args = [tokenName, tokenSymbol, tokenDecimals, council, cap];

  const instance = await deployContract<AavePropositionPower>(id, args);
  await instance.deployTransaction.wait();

  if (verify) {
    await verifyContract(id, instance.address, args);
  }
  return instance;
};

export const deployLendingPoolAddressesProvider = async () =>
  await deployContract<LendingPoolAddressesProvider>(
    eContractid.LendingPoolAddressesProvider,
    []
  );

export const deployTestVotingAssetA = async () =>
  await deployContract<TestVotingAssetA>(eContractid.TestVotingAssetA, [
    testVotingAssetAName,
    testVotingAssetASymbol,
    testVotingAssetADecimals
  ]);

export const deployTestVotingAssetB = async () =>
  await deployContract<TestVotingAssetB>(eContractid.TestVotingAssetB, [
    testVotingAssetBName,
    testVotingAssetBSymbol,
    testVotingAssetBDecimals
  ]);

export const deployAssetVotingWeightProvider = async (
  assets?: tEthereumAddress[],
  weights?: number[],
  verify?: boolean
) => {
  const params: [tEthereumAddress[], string[]] =
    <eEthereumNetwork>BRE.network.name === eEthereumNetwork.buidlerevm
      ? await getAssetWeighParamsTestString()
      : await getAssetsWeightParamsByNetworkProdString(
          <eEthereumNetwork>BRE.network.name
        );
  const id = eContractid.AssetVotingWeightProvider;

  const args =
    assets && weights ? [assets, weights.map(w => w.toString())] : params;

  const instance = await deployContract<AssetVotingWeightProvider>(id, args);
  await instance.deployTransaction.wait();

  if (verify) {
    await verifyContract(id, instance.address, args);
  }
  return instance;
};

export const deployGovernanceParamsProvider = async (
  network: eEthereumNetwork,
  verify?: boolean
) => {
  const id = eContractid.GovernanceParamsProvider;
  const args = [
    getPropositionPowerThresholdByNetworkString(network),
    (await getAavePropositionPower()).address,
    (await getAssetVotingWeightProvider()).address
  ];
  const instance = await deployContract<GovernanceParamsProvider>(id, args);
  await instance.deployTransaction.wait();
  if (verify) {
    await verifyContract(id, instance.address, args);
  }
  return instance;
};

export const deployAaveProtoGovernance = async (verify?: boolean) => {
  const id = eContractid.AaveProtoGovernance;
  const args = [(await getGovernanceParamsProvider()).address];

  const instance = await deployContract<AaveProtoGovernance>(id, args);
  await instance.deployTransaction.wait();

  if (verify) {
    await verifyContract(id, instance.address, args);
  }
  return instance;
};

export const deployProposalExecutor = async () =>
  await deployContract<ProposalExecutor>(eContractid.ProposalExecutor, []);

export const deployFailingProposalExecutor = async () =>
  await deployContract<FailingProposalExecutor>(
    eContractid.FailingProposalExecutor,
    []
  );

export const newProposal = async ([
  proposalType,
  ipfsHash,
  threshold,
  proposalExecutor,
  votingBlocksDuration,
  validatingBlocksDuration,
  maxMovesToVotingAllowed,
  signer
]: [
  string,
  string,
  string,
  tEthereumAddress,
  number,
  number,
  number,
  Signer
]) =>
  await (await getAaveProtoGovernance())
    .connect(signer)
    .newProposal(
      proposalType,
      ipfsHash,
      threshold,
      proposalExecutor,
      votingBlocksDuration,
      validatingBlocksDuration,
      maxMovesToVotingAllowed
    );

export const registerContractInJsonDb = async (
  contractId: eContractid,
  contractInstance: Contract
) => {
  const currentNetwork = BRE.network.name;
  if (
    currentNetwork !== "buidlerevm" &&
    currentNetwork !== "soliditycoverage"
  ) {
    console.log();
    console.log(`*** Deployed ${contractId} ***`);
    console.log(`Network: ${currentNetwork}`);
    console.log(contractInstance.address);
    console.log(`******`);
    console.log();
  }

  await getDb()
    .set(`${contractId}.${currentNetwork}`, {
      address: contractInstance.address,
      deployer: contractInstance.deployTransaction.from
    })
    .write();
};

export const getAavePropositionPower = async () => {
  const addressDeployed = (
    await getDb()
      .get(`${eContractid.AavePropositionPower}.${BRE.network.name}`)
      .value()
  ).address;
  return await getContract<AavePropositionPower>(
    eContractid.AavePropositionPower,
    addressDeployed
  );
};

export const getLendingPoolAddressesProvider = async () => {
  const addressDeployed = (
    await getDb()
      .get(`${eContractid.LendingPoolAddressesProvider}.${BRE.network.name}`)
      .value()
  ).address;
  return await getContract<LendingPoolAddressesProvider>(
    eContractid.LendingPoolAddressesProvider,
    addressDeployed
  );
};

export const getTestVotingAssetA = async () => {
  const addressDeployed = (
    await getDb()
      .get(`${eContractid.TestVotingAssetA}.${BRE.network.name}`)
      .value()
  ).address;
  return await getContract<TestVotingAssetA>(
    eContractid.TestVotingAssetA,
    addressDeployed
  );
};

export const getTestVotingAssetB = async () => {
  const addressDeployed = (
    await getDb()
      .get(`${eContractid.TestVotingAssetB}.${BRE.network.name}`)
      .value()
  ).address;
  return await getContract<TestVotingAssetB>(
    eContractid.TestVotingAssetB,
    addressDeployed
  );
};

export const getAvailableVotingAssets = async (): Promise<tToken[]> => [
  await getTestVotingAssetA(),
  await getTestVotingAssetB()
];

export const findTokenByAddressOnAvailables = async (
  token: tEthereumAddress
): Promise<tToken | undefined> =>
  (await getAvailableVotingAssets()).find(
    availableToken => token === availableToken.address
  );

export const getAssetVotingWeightProvider = async () => {
  const addressDeployed = (
    await getDb()
      .get(`${eContractid.AssetVotingWeightProvider}.${BRE.network.name}`)
      .value()
  ).address;
  return await getContract<AssetVotingWeightProvider>(
    eContractid.AssetVotingWeightProvider,
    addressDeployed
  );
};

export const getAaveProtoGovernance = async () => {
  const addressDeployed = (
    await getDb()
      .get(`${eContractid.AaveProtoGovernance}.${BRE.network.name}`)
      .value()
  ).address;
  return await getContract<AaveProtoGovernance>(
    eContractid.AaveProtoGovernance,
    addressDeployed
  );
};

export const getGovernanceParamsProvider = async () => {
  const addressDeployed = (
    await getDb()
      .get(`${eContractid.GovernanceParamsProvider}.${BRE.network.name}`)
      .value()
  ).address;
  return await getContract<GovernanceParamsProvider>(
    eContractid.GovernanceParamsProvider,
    addressDeployed
  );
};

export const getProposalExecutor = async () => {
  const addressDeployed = (
    await getDb()
      .get(`${eContractid.ProposalExecutor}.${BRE.network.name}`)
      .value()
  ).address;
  return await getContract<ProposalExecutor>(
    eContractid.ProposalExecutor,
    addressDeployed
  );
};

export const getFailingProposalExecutor = async () => {
  const addressDeployed = (
    await getDb()
      .get(`${eContractid.FailingProposalExecutor}.${BRE.network.name}`)
      .value()
  ).address;
  return await getContract<FailingProposalExecutor>(
    eContractid.FailingProposalExecutor,
    addressDeployed
  );
};

export const getHashedProposalType = (proposalType: string) =>
  externalEthers.utils.keccak256(
    externalEthers.utils.toUtf8Bytes(proposalType)
  );

export const validateRelayAction = async (
  paramsHashByRelayer: string,
  paramsHashBySigner: string,
  signature: string,
  signer: tEthereumAddress,
  proposalId: number,
  nonce: number,
  relayer: Signer
) =>
  await (await getAaveProtoGovernance())
    .connect(relayer)
    .validateRelayAction(
      paramsHashByRelayer,
      paramsHashBySigner,
      signature,
      signer,
      proposalId,
      nonce
    );

export const submitVoteByVoter = async (
  proposalId: number,
  vote: eVote,
  votingAsset: tEthereumAddress,
  voter: Signer
) =>
  await (await getAaveProtoGovernance())
    .connect(voter)
    .submitVoteByVoter(proposalId, vote, votingAsset);

export const submitVoteByRelayer = async (
  proposalId: number,
  vote: eVote,
  voter: tEthereumAddress,
  votingAsset: tEthereumAddress,
  signature: string,
  hashedParams: string,
  relayer: Signer,
  nonce?: number
) => {
  const aaveProtoGovernance = await getAaveProtoGovernance();
  const nonceToSubmit =
    nonce ||
    (await aaveProtoGovernance.getVoterData(proposalId, voter))[3].toNumber() +
      1;

  return await aaveProtoGovernance
    .connect(relayer)
    .submitVoteByRelayer(
      proposalId,
      vote,
      voter,
      votingAsset,
      nonceToSubmit,
      signature,
      hashedParams
    );
};

export const submitTxBySigner = async (
  tx: TransactionRequest,
  signer: Signer
) => await signer.sendTransaction(tx);

export const cancelVoteByVoter = async (proposalId: number, voter: Signer) =>
  await (await getAaveProtoGovernance())
    .connect(voter)
    .cancelVoteByVoter(proposalId);

export const cancelVoteByRelayer = async (
  proposalId: number,
  voter: tEthereumAddress,
  signature: string,
  hashedParams: string,
  relayer: Signer
) => {
  const aaveProtoGovernance = await getAaveProtoGovernance();
  const nonce =
    (await aaveProtoGovernance.getVoterData(proposalId, voter))[3].toNumber() +
    1;
  return await aaveProtoGovernance
    .connect(relayer)
    .cancelVoteByRelayer(proposalId, voter, nonce, signature, hashedParams);
};

export const parseGetVoterData = ({
  _vote,
  _weight,
  _balance,
  _nonce,
  _asset
}: any): iVoter => ({
  asset: _asset,
  vote: new BigNumber(_vote).toFixed(),
  weight: new BigNumber(_weight).toFixed(),
  balance: new BigNumber(_balance).toFixed(),
  nonce: new BigNumber(_nonce).toFixed()
});

export const getVoterData = async (
  proposalId: number,
  voter: tEthereumAddress
): Promise<iVoterWithAddress> => ({
  voter,
  ...parseGetVoterData(
    await (await getAaveProtoGovernance()).getVoterData(proposalId, voter)
  )
});

export const parseGetProposalBasicData = ({
  _totalVotes,
  _threshold,
  _maxMovesToVotingAllowed,
  _movesToVoting,
  _votingBlocksDuration,
  _validatingBlocksDuration,
  _currentStatusInitBlock,
  _initProposalBlock,
  _proposalStatus,
  _proposalExecutor,
  _proposalType
}: any): iProposalBasicData => ({
  totalVotes: _totalVotes.toNumber(),
  threshold: new BigNumber(_threshold.toString()).toFixed(0),
  maxMovesToVotingAllowed: _maxMovesToVotingAllowed.toNumber(),
  movesToVoting: _movesToVoting.toNumber(),
  votingBlocksDuration: _votingBlocksDuration.toNumber(),
  validatingBlocksDuration: _validatingBlocksDuration.toNumber(),
  currentStatusInitBlock: _currentStatusInitBlock.toNumber(),
  initProposalBlock: _initProposalBlock.toNumber(),
  proposalStatus: _proposalStatus.toString(),
  proposalExecutor: _proposalExecutor,
  proposalType: _proposalType
});

export const parseGetVotesData = (
  votesByChoice: any[]
): tStringDecimalUnits[] => [
  new BigNumber(votesByChoice[0]).toFixed(0),
  new BigNumber(votesByChoice[1]).toFixed(0),
  new BigNumber(votesByChoice[2]).toFixed(0)
];

export const getProposalData = async (
  proposalId: number
): Promise<iProposalAllData> => {
  const aaveProtoGovernance = await getAaveProtoGovernance();

  return {
    ...parseGetProposalBasicData(
      await aaveProtoGovernance.getProposalBasicData(proposalId)
    ),
    choicesAccumVotes: parseGetVotesData(
      await aaveProtoGovernance.getVotesData(proposalId)
    ),
    limitBlockOfProposal: (
      await aaveProtoGovernance.getLimitBlockOfProposal(proposalId)
    ).toNumber()
  };
};

export const getGovernanceParams = async (): Promise<iGovernanceParams> => {
  const governanceParamsProvider = await getGovernanceParamsProvider();

  return {
    propositionPower: await governanceParamsProvider.getPropositionPower(),
    propositionPowerThreshold: (
      await governanceParamsProvider.getPropositionPowerThreshold()
    ).toString(),
    assetsVotingWeightProvider: await governanceParamsProvider.getAssetVotingWeightProvider()
  };
};

export const getWeightOfAsset = async (
  asset: tEthereumAddress
): Promise<iAssetWithWeight> => ({
  asset,
  weight: (
    await (await getAssetVotingWeightProvider()).getVotingWeight(asset)
  ).toString()
});

export const transferEth = async (
  from: Signer,
  to: tEthereumAddress,
  value: tStringDecimalUnits
) => await from.sendTransaction({ to, value });

export const ethBalanceOf = async (wallet: Wallet) => await wallet.getBalance();

export const walletFromAddress = async (
  address: tEthereumAddress,
  network: string
): Promise<Wallet> =>
  new Wallet(
    (<any[]>BRE.config.networks[`${network}`].accounts)[
      (await getEthersSignersAddresses()).findIndex(e => e === address)
    ].privateKey,
    await (await getEthersSigners())[
      (await getEthersSignersAddresses()).findIndex(e => e === address)
    ].provider
  );

export const transferToken = async (
  token: TestVotingAssetA | TestVotingAssetB,
  from: Signer,
  to: tEthereumAddress,
  amount: tStringDecimalUnits
) => await token.connect(from).transfer(to, amount);

export const getTokenBalanceInBigUnits = async (
  token: tToken,
  address: tEthereumAddress
) => ethers.utils.formatEther(await token.balanceOf(address));

export const challengeVoters = async (
  proposalId: number,
  votersToChallenge: tEthereumAddress[],
  signer: Signer
) =>
  await (await getAaveProtoGovernance())
    .connect(signer)
    .challengeVoters(proposalId, votersToChallenge);

export const mintToken = async (
  recipient: tEthereumAddress,
  token: tToken,
  amount: tStringDecimalUnits
) => await token.mint(recipient, amount);

export const tryToMoveToValidating = async (
  proposalId: number,
  signer: Signer
) =>
  await (await getAaveProtoGovernance())
    .connect(signer)
    .tryToMoveToValidating(proposalId);

export const resolveProposal = async (proposalId: number, signer: Signer) =>
  await (await getAaveProtoGovernance())
    .connect(signer)
    .resolveProposal(proposalId);

export const getDevCouncil = async () =>
  (await getEthersSignersAddresses()).slice(
    0,
    Number(getPropositionPowerThresholdByNetwork(eEthereumNetwork.buidlerevm))
  );

export const getKovanCouncil = async () => [
  "0xD2CC1DDbb5dCd639BDE79438aae7C1ac41e1a446"
];

export const getRopstenCouncil = async () => [
  "0x7DE38FdD3E36F960e5aa65E275856f865324c39d"
];

export const getMainCouncil = async () => [
  "0xB9062896ec3A615a4e4444DF183F0531a77218AE",
  "0xf7692C7920c174Bdcc3387E8ec1FB2A6BD3ed906"
];

export const multihashToBytes32 = (multihash: string) =>
  `0x${bs58
    .decode(multihash)
    .slice(2)
    .toString("hex")}`;

export const getParamPerNetwork = <T>(
  { buidlerevm, kovan, ropsten, main }: iParamsPerNetwork<T>,
  network: eEthereumNetwork
) => {
  switch (network) {
    case eEthereumNetwork.buidlerevm:
      return buidlerevm;
    case eEthereumNetwork.kovan:
      return kovan;
    case eEthereumNetwork.ropsten:
      return ropsten;
    case eEthereumNetwork.main:
      return main;
    default:
      return buidlerevm;
  }
};
