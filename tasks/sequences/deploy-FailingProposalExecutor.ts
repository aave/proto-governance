import { task } from "@nomiclabs/buidler/config";
import {
  setBRE,
  registerContractInJsonDb,
  deployFailingProposalExecutor
} from "../../helpers/helpers";
import { eContractid } from "../../helpers/types";

const { FailingProposalExecutor } = eContractid;

task(
  `deploy-${FailingProposalExecutor}`,
  `Deploys the ${FailingProposalExecutor}`
).setAction(async (_, BRE) => {
  setBRE(BRE);

  const failingProposalExecutor = await deployFailingProposalExecutor();

  await registerContractInJsonDb(
    FailingProposalExecutor,
    failingProposalExecutor
  );
});
