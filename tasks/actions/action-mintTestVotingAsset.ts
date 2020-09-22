import { task, types } from "@nomiclabs/buidler/config";
import { setBRE, getTestVotingAssetA, mintToken } from "../../helpers/helpers";
import BigNumber from "bignumber.js";
import { currencyUnitsToDecimals } from "../../helpers/calculationHelpers";
import { ContractReceipt } from "ethers/contract";

task(`action-mintTestVotingAsset`, `Mints TestVotingAssetA tokens to 2 voters`)
  .addParam("to", "Recipient of the minted tokens", null, types.string)
  .addParam("amount", "Amount to transfer, in big units", null, types.string)
  .setAction(async ({ to, amount }, BRE) => {
    setBRE(BRE);

    const res: ContractReceipt[] = [] as ContractReceipt[];
    res.push(
      await (
        await mintToken(
          to,
          await getTestVotingAssetA(),
          currencyUnitsToDecimals(new BigNumber(amount), 18)
        )
      ).wait()
    );
    return res;
  });
