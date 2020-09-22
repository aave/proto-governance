import { task, types } from "@nomiclabs/buidler/config";
import { expect } from "chai";
import {
  setBRE,
  cancelVoteByRelayer,
  getAaveProtoGovernance
} from "../../helpers/helpers";
import {
  getHashAndSignatureFromCancelVoteParams,
  isSignatureValid
} from "../../helpers/tx-util";
import { ContractReceipt } from "ethers/contract";

task(
  `action-cancelVoteByRelayer`,
  `Cancels a vote on a proposal through a relayer`
)
  .addParam("proposalId", "Numeric ID of the proposal", null, types.int)
  .addParam(
    "voter",
    "The Signer object of the voter address who signs to cancel the previous vote",
    null,
    types.json
  )
  .addParam(
    "relayer",
    "The Signer object of the relayer which submits the transaction",
    null,
    types.json
  )
  .setAction(async ({ proposalId, voter, relayer }, BRE) => {
    setBRE(BRE);

    const voterAddress = await voter.getAddress();
    const aaveProtoGovernance = await getAaveProtoGovernance();
    const nonce =
      (
        await aaveProtoGovernance.getVoterData(proposalId, voterAddress)
      )[3].toNumber() + 1;

    const {
      hashedParams,
      arrayifiedHashedParams,
      signature
    } = await getHashAndSignatureFromCancelVoteParams(
      { proposalId, voter: voterAddress, nonce },
      voter
    );

    expect(
      isSignatureValid(arrayifiedHashedParams, signature, voterAddress),
      `INVALID SIGNATURE`
    ).to.be.true;

    const res: ContractReceipt[] = [] as ContractReceipt[];
    res.push(
      await (
        await cancelVoteByRelayer(
          proposalId,
          voterAddress,
          signature,
          hashedParams,
          relayer
        )
      ).wait()
    );
    return res;
  });
