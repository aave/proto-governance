import { task, types } from "@nomiclabs/buidler/config";
import {
  setBRE,
  getEthersSignersAddresses,
  getEthersSigners,
  transferToken,
  findTokenByAddressOnAvailables
} from "../../helpers/helpers";
import { ethers } from "ethers";
import { ContractReceipt } from "ethers/contract";

task(
  `action-transferTokensByAddress`,
  `Transfers tokens from a wallet to another`
)
  .addParam("from", "Wallet address to send from", null, types.string)
  .addParam("to", "Wallet address to send to", null, types.string)
  .addParam("token", "Address of the token to transfer", null, types.string)
  .addParam(
    "amount",
    "Amount to transfer, in token big units",
    null,
    types.string
  )
  .setAction(async ({ from, to, amount, token }, BRE) => {
    setBRE(BRE);

    if (!token) {
      throw "Task action-transferTokensByAddress. Invalid token to transfer";
    }

    const tokenToTransfer = await findTokenByAddressOnAvailables(token);

    if (!tokenToTransfer) {
      throw "Task action-transferTokensByAddress. Invalid token to transfer";
    }

    const res: ContractReceipt[] = [] as ContractReceipt[];
    res.push(
      await (
        await transferToken(
          tokenToTransfer,
          (await getEthersSigners())[
            (await getEthersSignersAddresses()).findIndex(e => e === from)
          ],
          to,
          ethers.utils.parseEther(amount).toHexString()
        )
      ).wait()
    );
    return res;
  });
