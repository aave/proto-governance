import { task } from "@nomiclabs/buidler/config";
import { checkVerification } from "../../helpers/etherscan-verification";
import { setBRE, BRE } from "../../helpers/helpers";
import { eContractid } from "../../helpers/types";

task("main-deploy", "Full deployment flow on Main network")
  .addFlag("verify", "Verify the contracts via Etherscan API")
  .setAction(async ({ verify }, _BRE) => {
    setBRE(_BRE);
    const { run } = BRE;
    const {
      AavePropositionPower,
      AssetVotingWeightProvider,
      AaveProtoGovernance,
      GovernanceParamsProvider,
    } = eContractid;

    // Prevent loss of gas verifying all the needed ENVs for Etherscan verification
    if (verify) {
      checkVerification();
    }

    await run(`deploy-${AavePropositionPower}`, { verify });
    await run(`deploy-${AssetVotingWeightProvider}`, { verify });
    await run(`deploy-${GovernanceParamsProvider}`, { verify });
    await run(`deploy-${AaveProtoGovernance}`, { verify });

    console.log(`- Finished deployment at ${BRE.network.name} network.`);
  });
