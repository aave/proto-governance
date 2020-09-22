import { task } from "@nomiclabs/buidler/config";
import {
  setBRE,
  registerContractInJsonDb,
  deployProposalExecutor
} from "../../helpers/helpers";
import { eContractid } from "../../helpers/types";

const { ProposalExecutor } = eContractid;

task(`deploy-${ProposalExecutor}`, `Deploys the ${ProposalExecutor}`).setAction(
  async (_, BRE) => {
    setBRE(BRE);

    const proposalExecutor = await deployProposalExecutor();

    await registerContractInJsonDb(ProposalExecutor, proposalExecutor);
  }
);
