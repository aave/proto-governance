import { task, types } from "@nomiclabs/buidler/config";
import {
  setBRE,
  deployAavePropositionPower,
  registerContractInJsonDb
} from "../../helpers/helpers";
import { eContractid, eEthereumNetwork } from "../../helpers/types";
import {
  aavePropositionPowerName,
  aavePropositionPowerSymbol,
  aavePropositionPowerDecimals,
  getPropositionPowerThresholdByNetwork,
  getPropositionPowerThresholdByNetworkString
} from "../../helpers/constants";

const { AavePropositionPower } = eContractid;

task(`deploy-${AavePropositionPower}`, `Deploys the ${AavePropositionPower}`)
  .addParam("cap", "Cap of the minted proposition power", null, types.string)
  .addFlag("verify", "Verify the contracts via Etherscan API")
  .setAction(async ({ cap, verify }, BRE) => {
    setBRE(BRE);

    const aavePropositionPower = await deployAavePropositionPower(
      [
        aavePropositionPowerName,
        aavePropositionPowerSymbol,
        aavePropositionPowerDecimals.toString(),
        cap ||
          getPropositionPowerThresholdByNetworkString(
            <eEthereumNetwork>BRE.network.name
          )
      ],
      verify
    );

    await registerContractInJsonDb(AavePropositionPower, aavePropositionPower);
  });
