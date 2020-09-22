import { task, types } from "@nomiclabs/buidler/config";
import { setBRE, resolveProposal } from "../../helpers/helpers";
import { ContractReceipt } from "ethers/contract";

task(
  `action-resolveProposal`,
  `Resolve a proposal with the leading choice once the conditions are met`
)
  .addParam("proposalId", "Numeric ID of the proposal", null, types.int)
  .addParam(
    "signer",
    "The Signer object which submits the transaction",
    null,
    types.json
  )
  .setAction(async ({ proposalId, signer }, _BRE) => {
    setBRE(_BRE);
    const res: ContractReceipt[] = [] as ContractReceipt[];
    res.push(await (await resolveProposal(proposalId, signer)).wait());
    return res;
  });
