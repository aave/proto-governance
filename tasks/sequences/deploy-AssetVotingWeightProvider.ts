import { task, types } from "@nomiclabs/buidler/config";
import { verify } from "crypto";
import {
  setBRE,
  registerContractInJsonDb,
  deployAssetVotingWeightProvider
} from "../../helpers/helpers";
import { eContractid } from "../../helpers/types";

const { AssetVotingWeightProvider } = eContractid;

// Execute the deployment task of the test voting assets before this
task(
  `deploy-${AssetVotingWeightProvider}`,
  `Deploys the ${AssetVotingWeightProvider}`
)
  .addOptionalParam("assets", "List of assets to set weight", null, types.json)
  .addFlag("verify", "Verify the contracts via Etherscan API")
  .addOptionalParam(
    "weights",
    "List of weights for each asset",
    null,
    types.json
  )
  .setAction(async ({ assets, weights, verify }, BRE) => {
    setBRE(BRE);

    const assetVotingWeightProvider = await deployAssetVotingWeightProvider(
      assets,
      weights && weights.map((weight: string) => parseInt(weight)),
      verify
    );

    await registerContractInJsonDb(
      AssetVotingWeightProvider,
      assetVotingWeightProvider
    );
  });
