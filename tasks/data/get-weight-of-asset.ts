import { task, types } from "@nomiclabs/buidler/config";
import { setBRE, getWeightOfAsset } from "../../helpers/helpers";

task(`get-weight-of-asset`, `Returns the voting weight of an asset`)
  .addParam("assetAddress", "Address of the asset", null, types.string)
  .setAction(async ({ assetAddress }, BRE) => {
    setBRE(BRE);
    // await BRE.run("action-deploy-contracts-and-submit-vote");
    const weight = await getWeightOfAsset(assetAddress);
    console.log(weight);
    return weight;
  });
