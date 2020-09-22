import { task, types } from "@nomiclabs/buidler/config";
import {
  setBRE,
  getEthersSignersAddresses,
  getEthersSigners,
  transferEth
} from "../../helpers/helpers";
import { tEthereumAddress } from "../../helpers/types";
import { Signer, ethers } from "ethers";
import { ContractReceipt } from "ethers/contract";

task(`action-transferEthByAddress`, `Transfers ETH from a wallet to another`)
  .addParam("from", "Wallet address to send from", null, types.string)
  .addParam("to", "Wallet address to send to", null, types.string)
  .addParam("amount", "Amount to transfer, in ETH", null, types.string)
  .setAction(async ({ from, to, amount }, BRE) => {
    setBRE(BRE);
    const signerAddresses: tEthereumAddress[] = await getEthersSignersAddresses();
    const signers: Signer[] = await getEthersSigners();
    const signerFrom = signers[signerAddresses.findIndex(e => e === from)];

    // const wallet = await walletFromAddress(from, "buidlerevm");
    const res: ContractReceipt[] = [] as ContractReceipt[];
    res.push(
      await (
        await transferEth(
          signerFrom,
          to,
          ethers.utils.parseEther(amount).toHexString()
        )
      ).wait()
    );
    return res;
  });
