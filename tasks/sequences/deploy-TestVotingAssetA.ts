import { task } from "@nomiclabs/buidler/config";
import {
  setBRE,
  registerContractInJsonDb,
  deployTestVotingAssetA
} from "../../helpers/helpers";
import { eContractid } from "../../helpers/types";

const { TestVotingAssetA } = eContractid;

task(`deploy-${TestVotingAssetA}`, `Deploys the ${TestVotingAssetA}`).setAction(
  async (_, BRE) => {
    setBRE(BRE);
    const testVotingAssetA = await deployTestVotingAssetA();
    await registerContractInJsonDb(TestVotingAssetA, testVotingAssetA);
  }
);
