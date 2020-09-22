import { task } from "@nomiclabs/buidler/config";
import { setBRE, BRE } from "../../helpers/helpers";
import { eContractid } from "../../helpers/types";

let deploymentsCounter = 0;
const increaseDeploymentsCounter = () => {
  deploymentsCounter = deploymentsCounter + 1;
};

task("dev-deploy", "Full deployment flow on buidlerevm network").setAction(
  async (_, _BRE) => {
    setBRE(_BRE);
    const { run } = BRE;
    const {
      AavePropositionPower,
      LendingPoolAddressesProvider,
      AssetVotingWeightProvider,
      AaveProtoGovernance,
      ProposalExecutor,
      FailingProposalExecutor,
      GovernanceParamsProvider
    } = eContractid;

    if (deploymentsCounter === 0) {
      await run(`deploy-${LendingPoolAddressesProvider}`);
    }
    increaseDeploymentsCounter();

    await run(`deploy-${AavePropositionPower}`);
    await run(`deploy-testVotingAssets`);
    await run(`deploy-${AssetVotingWeightProvider}`);
    await run(`deploy-${GovernanceParamsProvider}`);
    await run(`deploy-${ProposalExecutor}`);
    await run(`deploy-${FailingProposalExecutor}`);
    await run(`deploy-${AaveProtoGovernance}`);
  }
);
