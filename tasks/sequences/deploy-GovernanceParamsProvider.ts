import { task } from "@nomiclabs/buidler/config";
import {
  setBRE,
  registerContractInJsonDb,
  deployGovernanceParamsProvider
} from "../../helpers/helpers";
import { eContractid, eEthereumNetwork } from "../../helpers/types";

const { GovernanceParamsProvider } = eContractid;

task(
  `deploy-${GovernanceParamsProvider}`,
  `Deploys the ${GovernanceParamsProvider}`
)
  .addFlag("verify", "Verify the contracts via Etherscan API")
  .setAction(async ({ verify }, BRE) => {
    setBRE(BRE);

    const governanceParamsProvider = await deployGovernanceParamsProvider(
      <eEthereumNetwork>BRE.network.name,
      verify
    );

    await registerContractInJsonDb(
      GovernanceParamsProvider,
      governanceParamsProvider
    );
  });
