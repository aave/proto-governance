import { task, types } from "@nomiclabs/buidler/config";
import { setBRE, tryToMoveToValidating } from "../../helpers/helpers";
import { ContractReceipt } from "ethers/contract";

task(
  `action-tryToMoveToValidating`,
  `Try to move to Validating state a proposal once the conditions are met`
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
    res.push(await (await tryToMoveToValidating(proposalId, signer)).wait());
    return res;
  });
