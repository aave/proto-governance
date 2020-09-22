import { task } from "@nomiclabs/buidler/config";
import {
  setBRE,
  registerContractInJsonDb,
  deployAaveProtoGovernance
} from "../../helpers/helpers";
import { eContractid } from "../../helpers/types";

const { AaveProtoGovernance } = eContractid;

task(`deploy-${AaveProtoGovernance}`, `Deploys the ${AaveProtoGovernance}`)
  .addFlag("verify", "Verify the contracts via Etherscan API")
  .setAction(async ({ verify }, BRE) => {
    setBRE(BRE);

    const aaveProtoGovernance = await deployAaveProtoGovernance(verify);

    await registerContractInJsonDb(AaveProtoGovernance, aaveProtoGovernance);
  });
