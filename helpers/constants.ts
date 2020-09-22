import BigNumber from "bignumber.js";
import { currencyUnitsToDecimals } from "./calculationHelpers";
import { eContractid, eEthereumNetwork, tEthereumAddress } from "./types";
import {
  getParamPerNetwork,
  getTestVotingAssetA,
  getTestVotingAssetB
} from "./helpers";

export const ADDRESS_0x0 = "0x0000000000000000000000000000000000000000";
export const ONE_ADDRESS = "0x0000000000000000000000000000000000000001";
export const aavePropositionPowerName = "Aave Proposition Power";
export const aavePropositionPowerSymbol = "APP";
export const aavePropositionPowerDecimals = 18;
export const initialPropositionPowerForDeployer = currencyUnitsToDecimals(
  new BigNumber(2),
  18
); // 2 XAAVE in wei
export const initialAVotingAssetToVoter1 = currencyUnitsToDecimals(
  new BigNumber(10),
  18
); // 10 VOTA in wei
export const initialAVotingAssetToVoter2 = currencyUnitsToDecimals(
  new BigNumber(6),
  18
); // 6 VOTA in wei
export const testVotingAssetAName = "Test Voting Asset A";
export const testVotingAssetASymbol = "VOTA";
export const testVotingAssetADecimals = 18;

export const testVotingAssetBName = "Test Voting Asset B";
export const testVotingAssetBSymbol = "VOTB";
export const testVotingAssetBDecimals = 18;

export const testAssetWeights = {
  [eContractid.TestVotingAssetA]: 100,
  [eContractid.TestVotingAssetB]: 50
};

export const ONE_ETHER = new BigNumber(10).pow(18);

export const MOCK_IPFS_HASH = "QmYjtig7VJQ6XsnUjqqJvj7QaMcCAwtrgNdahSiFofrE7o";

export const thresholdDev = new BigNumber(
  currencyUnitsToDecimals(new BigNumber(5500000), 18)
)
  .multipliedBy(100)
  .toFixed(); // 5 500 000 * 100, simulating a LEND situation where 5 500 000 LEND are needed as threshold, and LEND has 100 weight

// Test address we want to register in the test LendingPoolAddressesProvider as LendingPool address once a proposal is resolved
export const testPayloadProposalAddress =
  "0x3d83f9b51989C6eE72dD16A42ad8660b9CFBb09b";

// This will divide 100% to get the percentage of the total supply of the proposition power
// needed to register a new proposal
export const getPropositionPowerThresholdByNetwork = (
  network: eEthereumNetwork
): number =>
  getParamPerNetwork<number>(
    {
      [eEthereumNetwork.buidlerevm]: 2,
      [eEthereumNetwork.kovan]: 1,
      [eEthereumNetwork.ropsten]: 1,
      [eEthereumNetwork.main]: 2
    },
    network
  );

export const getAssetWeighParamsTest = async (): Promise<[
  tEthereumAddress[],
  number[]
]> => [
  [
    (await getTestVotingAssetA()).address,
    (await getTestVotingAssetB()).address
  ],
  [
    testAssetWeights[eContractid.TestVotingAssetA],
    testAssetWeights[eContractid.TestVotingAssetB]
  ]
];

export const getAssetsWeightParamsByNetworkProd = async (
  network: eEthereumNetwork
): Promise<[tEthereumAddress[], number[]]> =>
  getParamPerNetwork<[tEthereumAddress[], number[]]>(
    {
      // Not used
      [eEthereumNetwork.buidlerevm]: [
        ["", ""],
        [0, 0]
      ],
      [eEthereumNetwork.kovan]: [
        [kovanLENDTokenAddress, kovanALENDTokenAddress],
        [kovanLENDTokenAssetWeight, kovanALENDTokenAssetWeight]
      ],
      [eEthereumNetwork.ropsten]: [
        [ropstenLENDTokenAddress, ropstenALENDTokenAddress],
        [ropstenLENDTokenAssetWeight, ropstenALENDTokenAssetWeight]
      ],
      [eEthereumNetwork.main]: [
        [mainLENDTokenAddress, mainALENDTokenAddress],
        [mainLENDTokenAssetWeight, mainALENDTokenAssetWeight]
      ]
    },
    network
  );

export const devVotingBlocksDuration = 1660;
export const devValidatingBlocksDuration = 1660;
export const devMaxMovesToVotingAllowed = 3;

export const kovanLENDTokenAddress =
  "0x690eAcA024935Aaff9B14b9FF9e9C8757a281f3C";
export const kovanLENDTokenAssetWeight = 1;

export const kovanALENDTokenAddress =
  "0xcBa131C7FB05fe3c9720375cD86C99773faAbF23";
export const kovanALENDTokenAssetWeight = 1;

export const mainLENDTokenAddress =
  "0x80fB784B7eD66730e8b1DBd9820aFD29931aab03";
export const mainLENDTokenAssetWeight = 1;

export const mainALENDTokenAddress =
  "0x7D2D3688Df45Ce7C552E19c27e007673da9204B8";
export const mainALENDTokenAssetWeight = 1;

export const ropstenLENDTokenAddress =
  "0xB47F338EC1e3857BB188E63569aeBAB036EE67c6";
export const ropstenLENDTokenAssetWeight = 1;

export const ropstenALENDTokenAddress =
  "0xa56c4b678565C9F1Fd35178F94f8CeE043538247";
export const ropstenALENDTokenAssetWeight = 1;

export const getPropositionPowerThresholdByNetworkString = (
  network: eEthereumNetwork
): string => getPropositionPowerThresholdByNetwork(network).toString();

export const getAssetWeighParamsTestString = async (): Promise<[
  tEthereumAddress[],
  string[]
]> => {
  const [addresses, numbers] = await getAssetWeighParamsTest();
  return [addresses, numbers.map(x => x.toString())];
};

export const getAssetsWeightParamsByNetworkProdString = async (
  network: eEthereumNetwork
): Promise<[tEthereumAddress[], string[]]> => {
  const [addresses, numbers] = await getAssetsWeightParamsByNetworkProd(
    network
  );
  return [addresses, numbers.map(x => x.toString())];
};
