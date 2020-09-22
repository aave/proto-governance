import { task } from "@nomiclabs/buidler/config";
import {
  setBRE,
  registerContractInJsonDb,
  deployTestVotingAssetB
} from "../../helpers/helpers";
import { eContractid } from "../../helpers/types";

const { TestVotingAssetB } = eContractid;

task(`deploy-${TestVotingAssetB}`, `Deploys the ${TestVotingAssetB}`).setAction(
  async (_, BRE) => {
    setBRE(BRE);

    const testVotingAssetB = await deployTestVotingAssetB();

    await registerContractInJsonDb(TestVotingAssetB, testVotingAssetB);
  }
);
