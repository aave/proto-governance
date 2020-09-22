import { task } from "@nomiclabs/buidler/config";
import { setBRE, getGovernanceParams } from "../../helpers/helpers";

task(
  `get-governance-params`,
  `Returns the global governance configuration params`
).setAction(async ({}, BRE) => {
  setBRE(BRE);
  // await BRE.run("action-deploy-contracts-and-submit-vote");
  const governanceParams = await getGovernanceParams();
  console.log(governanceParams);
  return governanceParams;
});
