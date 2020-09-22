import { task, types } from "@nomiclabs/buidler/config";
import {
  setBRE,
  getEthersSigners,
  submitTxBySigner
} from "../../helpers/helpers";
import { ContractReceipt } from "ethers/contract";

task(
  `action-submit-raw-tx-by-relayer`,
  `Submits a raw transaction by the relayer signer`
)
  .addParam(
    "tx",
    "The raw transaction to submit by the relayer",
    null,
    types.json
  )
  .setAction(async ({ tx }, BRE) => {
    setBRE(BRE);

    const relayer = (await getEthersSigners())[0];

    const res: ContractReceipt[] = [] as ContractReceipt[];
    res.push(await (await submitTxBySigner(tx, relayer)).wait());
    return res;
  });
