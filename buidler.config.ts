import { usePlugin, BuidlerConfig } from "@nomiclabs/buidler/config";
import path from "path";
import fs from "fs";

import accounts from "./testAccounts";
import { eEthereumNetwork } from "./helpers/types";

usePlugin("@nomiclabs/buidler-ethers");
usePlugin("buidler-typechain");
usePlugin("solidity-coverage");
usePlugin("@nomiclabs/buidler-waffle");
usePlugin("@nomiclabs/buidler-etherscan");

if (!process.env.SKIP_TASKS) {
  ["misc", "actions", "data", "deployments", "sequences"].forEach(folder => {
    const tasksPath = path.join(__dirname, "tasks", folder);
    fs.readdirSync(tasksPath).forEach(task => require(`${tasksPath}/${task}`));
  });
  console.log("Loaded tasks");
}

export const BUIDLEREVM_CHAIN_ID = 31337;
const DEFAULT_BLOCK_GAS_LIMIT = 12500000;
const DEFAULT_GAS_PRICE = 50000000000; // 50 gwei
const HARDFORK = "istanbul";
const INFURA_KEY = process.env.INFURA_KEY || "";
const ETHERSCAN_KEY = process.env.ETHERSCAN_KEY || "";
const ETHERSCAN_NETWORK = process.env.ETHERSCAN_NETWORK || "";
const MNEMONIC_PATH = "m/44'/60'/0'/0";
const MNEMONICS: { [network: string]: string } = {
  [eEthereumNetwork.kovan]: process.env.MNEMONIC || "",
  [eEthereumNetwork.ropsten]: process.env.MNEMONIC || "",
  [eEthereumNetwork.main]: process.env.MNEMONIC || ""
};

const getCommonNetworkConfig = (
  networkName: eEthereumNetwork,
  networkId: number
) => {
  return {
    url: `https://${
      networkName === eEthereumNetwork.main ? `${networkName}net` : networkName
    }.infura.io/v3/${INFURA_KEY}`,
    hardfork: HARDFORK,
    blockGasLimit: DEFAULT_BLOCK_GAS_LIMIT,
    gasPrice: DEFAULT_GAS_PRICE,
    chainId: networkId,
    accounts: {
      mnemonic: MNEMONICS[networkName],
      path: MNEMONIC_PATH,
      initialIndex: 0,
      count: 20
    }
  };
};
/* BuidlerConfig.etherscan.url is mandatory and does not detect the buidler network https://github.com/nomiclabs/buidler/issues/583 */
const etherscanApiSubdomain =
  ETHERSCAN_NETWORK == "main" ? "api" : `api-${ETHERSCAN_NETWORK}`;

const config = {
  solc: {
    version: "0.5.16",
    optimizer: { enabled: true, runs: 200 },
    evmVersion: "istanbul"
  },
  typechain: {
    outDir: "types",
    target: "ethers"
  },
  etherscan: {
    url: `https://${etherscanApiSubdomain}.etherscan.io/api`,
    apiKey: ETHERSCAN_KEY
  },
  defaultNetwork: "buidlerevm",
  mocha: {
    timeout: 0
  },
  networks: {
    kovan: getCommonNetworkConfig(eEthereumNetwork.kovan, 42),
    ropsten: getCommonNetworkConfig(eEthereumNetwork.ropsten, 3),
    main: getCommonNetworkConfig(eEthereumNetwork.main, 1),
    buidlerevm: {
      hardfork: "istanbul",
      blockGasLimit: DEFAULT_BLOCK_GAS_LIMIT,
      gas: DEFAULT_BLOCK_GAS_LIMIT,
      gasPrice: 8000000000,
      chainId: BUIDLEREVM_CHAIN_ID,
      throwOnTransactionFailures: true,
      throwOnCallFailures: true,
      accounts: accounts.map(
        ({ secretKey, balance }: { secretKey: string; balance: string }) => ({
          privateKey: secretKey,
          balance
        })
      )
    },
    ganache: {
      url: "http://ganache:8545",
      accounts: {
        mnemonic:
          "fox sight canyon orphan hotel grow hedgehog build bless august weather swarm",
        path: "m/44'/60'/0'/0",
        initialIndex: 0,
        count: 20
      }
    },
    coverage: {
      url: "http://localhost:8555"
    }
  }
};

export default config;
