import { task, types } from "@nomiclabs/buidler/config";
import {
  setBRE,
  newProposal,
  getHashedProposalType,
  getProposalExecutor,
  multihashToBytes32
} from "../../helpers/helpers";
import { eProposalType } from "../../helpers/types";
import {
  thresholdDev,
  devVotingBlocksDuration,
  devValidatingBlocksDuration,
  devMaxMovesToVotingAllowed,
  MOCK_IPFS_HASH
} from "../../helpers/constants";
import { ContractReceipt } from "ethers/contract";
// @ts-ignore
import isIpfs from "is-ipfs";

task(
  `action-newProposal`,
  `Registers a new proposal into the AaveProtoGovernance`
)
  .addParam(
    "signer",
    "The Signer object of the wallet which submits the transaction",
    null,
    types.json
  )
  .addParam(
    "threshold",
    "Threshold of voting power that needs to be crossed to go from Voting to Validating",
    null,
    types.string
  )
  .addParam(
    "votingBlocksDuration",
    "Minimum number of blocks the proposal needs to be in Voting before being able to change to Validating",
    null,
    types.float
  )
  .addParam(
    "validatingBlocksDuration",
    "Minimum number of blocks the proposal needs to be in Validating before being able to be executed",
    null,
    types.float
  )
  .addParam(
    "maxMovesToVotingAllowed",
    "Variable to control how many changes to Voting state are allowed",
    null,
    types.float
  )
  .addParam(
    "proposalExecutorAddress",
    "Address of the ProposalExecutor with the logic to execute on resolution",
    null,
    types.string
  )
  .addParam(
    "ipfsHash",
    "IPFS hash of the proposal metadata",
    null,
    types.string
  )
  .setAction(
    async (
      {
        signer,
        threshold,
        votingBlocksDuration,
        validatingBlocksDuration,
        maxMovesToVotingAllowed,
        proposalExecutorAddress,
        ipfsHash
      },
      BRE
    ) => {
      setBRE(BRE);

      const res: ContractReceipt[] = [] as ContractReceipt[];

      const _ipfsHash = multihashToBytes32(
        isIpfs.multihash(ipfsHash) ? ipfsHash : MOCK_IPFS_HASH
      );

      res.push(
        await (
          await newProposal([
            getHashedProposalType(eProposalType.UPGRADE_ADDRESS_PROPOSAL),
            _ipfsHash,
            threshold || thresholdDev,
            proposalExecutorAddress || (await getProposalExecutor()).address,
            parseInt(votingBlocksDuration) || devVotingBlocksDuration,
            parseInt(validatingBlocksDuration) || devValidatingBlocksDuration,
            parseInt(maxMovesToVotingAllowed) || devMaxMovesToVotingAllowed,
            signer
          ])
        ).wait()
      );
      return res;
    }
  );
