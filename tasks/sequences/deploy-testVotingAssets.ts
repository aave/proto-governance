import { task } from "@nomiclabs/buidler/config";
import { setBRE } from "../../helpers/helpers";

task(`deploy-testVotingAssets`, `Deploys the test Voting assets`).setAction(
  async (_, BRE) => {
    setBRE(BRE);
    await BRE.run("deploy-TestVotingAssetA");
    await BRE.run("deploy-TestVotingAssetB");
  }
);
