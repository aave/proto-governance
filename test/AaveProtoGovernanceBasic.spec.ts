import BRE from "@nomiclabs/buidler";
import {
  getEthersSignersAddresses,
  getLendingPoolAddressesProvider,
  getAavePropositionPower,
  getAaveProtoGovernance,
  getEthersSigners,
  getHashedProposalType,
  parseGetProposalBasicData,
  parseGetVotesData,
  getProposalExecutor,
  getGovernanceParamsProvider,
  getTestVotingAssetA,
  fastForwardBlocks,
  getFailingProposalExecutor
} from "../helpers/helpers";
import { expectNonNullAddress, expectRevert } from "../helpers/testHelpers";
import { expect } from "chai";
import {
  tEthereumAddress,
  eProposalStatus,
  eProposalType,
  eVote,
  eEthereumNetwork
} from "../helpers/types";
import { AavePropositionPower } from "../types/AavePropositionPower";
import { LendingPoolAddressesProvider } from "../types/LendingPoolAddressesProvider";
import {
  thresholdDev,
  devMaxMovesToVotingAllowed,
  devVotingBlocksDuration,
  devValidatingBlocksDuration,
  ONE_ADDRESS,
  getPropositionPowerThresholdByNetwork
} from "../helpers/constants";
import { AaveProtoGovernance } from "../types/AaveProtoGovernance";
import BigNumber from "bignumber.js";
import { currencyUnitsToDecimals } from "../helpers/calculationHelpers";

describe("AaveProtoGovernance basic tests", () => {
  let signers: tEthereumAddress[] = [] as tEthereumAddress[];
  let aaveProtoGovernance: AaveProtoGovernance = {} as AaveProtoGovernance;
  let aavePropositionPower: AavePropositionPower = {} as AavePropositionPower;
  let lendingPoolAddressesProvider: LendingPoolAddressesProvider = {} as LendingPoolAddressesProvider;

  before(async () => {
    await BRE.run("dev-deploy");
    aaveProtoGovernance = await getAaveProtoGovernance();
    aavePropositionPower = await getAavePropositionPower();
    lendingPoolAddressesProvider = await getLendingPoolAddressesProvider();
    signers = <tEthereumAddress[]>await getEthersSignersAddresses();
  });

  after(async () => {
    await BRE.run("dev-deploy");
  });

  it("Has a non-null address after deployment", async function() {
    expectNonNullAddress(
      aaveProtoGovernance.address,
      "Invalid AaveProtoGovernance null address"
    );
  });

  it("Reverts when trying to send ETH to the contract", async function() {
    await expectRevert(
      "ETH_TRANSFER_NOT_ALLOWED",
      BRE.run("action-transferEthByAddress", {
        from: await (await getEthersSigners())[0].getAddress(),
        to: aaveProtoGovernance.address,
        amount: "1"
      })
    );
  });

  it("Creation of a new proposal fails when trying with an address with no AavePropositionPower balance", async function() {
    await expectRevert(
      "INVALID_PROPOSITION_POWER_BALANCE",
      BRE.run("action-newProposal", {
        signer: (await getEthersSigners())[
          getPropositionPowerThresholdByNetwork(eEthereumNetwork.buidlerevm) + 1
        ]
      })
    );
  });

  it("Creation of a new proposal fails with invalid voting threshold", async function() {
    await expectRevert(
      "INVALID_THRESHOLD",
      BRE.run("action-newProposal", {
        signer: (await getEthersSigners())[0],
        threshold: new BigNumber(
          currencyUnitsToDecimals(new BigNumber(4900), 18)
        )
          .multipliedBy(100)
          .toFixed()
      })
    );
  });

  it("Creation of a new proposal fails with invalid votingBlocksDuration", async function() {
    await expectRevert(
      "INVALID_VOTING_BLOCKS_DURATION",
      BRE.run("action-newProposal", {
        signer: (await getEthersSigners())[0],
        votingBlocksDuration: devVotingBlocksDuration - 1
      })
    );
  });

  it("Creation of a new proposal fails for invalid validatingBlocksDuration", async function() {
    await expectRevert(
      "INVALID_VALIDATING_BLOCKS_DURATION",
      BRE.run("action-newProposal", {
        signer: (await getEthersSigners())[0],
        validatingBlocksDuration: devVotingBlocksDuration - 1
      })
    );
  });

  it("Creation of a new proposal fails for invalid maxMovesToVotingAllowed", async function() {
    await expectRevert(
      "INVALID_MAXVOTESTOVOTINGALLOWED",
      BRE.run("action-newProposal", {
        signer: (await getEthersSigners())[0],
        maxMovesToVotingAllowed: 1
      })
    );
    await expectRevert(
      "INVALID_MAXVOTESTOVOTINGALLOWED",
      BRE.run("action-newProposal", {
        signer: (await getEthersSigners())[0],
        maxMovesToVotingAllowed: 7
      })
    );
  });

  it("govParamsProvider is registered properly", async function() {
    expect(await aaveProtoGovernance.getGovParamsProvider()).to.be.equal(
      (await getGovernanceParamsProvider()).address
    );
  });

  it("Checks the data of a newly created proposal in the AaveProtoGovernance", async function() {
    const [txReceipt] = await BRE.run("action-newProposal", {
      signer: (await getEthersSigners())[0]
    });

    const aaveProtoGovernance = await getAaveProtoGovernance();
    const proposalId = 0;

    const {
      totalVotes,
      threshold,
      maxMovesToVotingAllowed,
      movesToVoting,
      votingBlocksDuration,
      validatingBlocksDuration,
      currentStatusInitBlock,
      proposalStatus,
      proposalExecutor,
      proposalType
    } = parseGetProposalBasicData(
      await aaveProtoGovernance.getProposalBasicData(proposalId)
    );

    const [abstainVotes, yesVotes, noVotes] = parseGetVotesData(
      await aaveProtoGovernance.getVotesData(proposalId)
    );

    await expectRevert(
      "INVALID_PROPOSAL_ID",
      aaveProtoGovernance.getProposalBasicData(proposalId + 1)
    );

    await expectRevert(
      "INVALID_PROPOSAL_ID",
      aaveProtoGovernance.getVoterData(
        proposalId + 1,
        await (await getEthersSigners())[0].getAddress()
      )
    );

    await expectRevert(
      "INVALID_PROPOSAL_ID",
      aaveProtoGovernance.getVotesData(
        await (await getEthersSigners())[0].getAddress()
      )
    );

    expect(totalVotes, "INVALID_TOTALVOTES").to.be.equal(0);
    expect(threshold, "INVALID_THRESHOLD").to.be.equal(thresholdDev);
    expect(
      maxMovesToVotingAllowed,
      "INVALID_MAXMOVESTOVOTINGALLOWED"
    ).to.be.equal(devMaxMovesToVotingAllowed);
    expect(movesToVoting, "INVALID_MOVESTOVOTING").to.be.equal(1);
    expect(votingBlocksDuration, "INVALID_VOTINGBLOCKSDURATION").to.be.equal(
      devVotingBlocksDuration
    );
    expect(
      validatingBlocksDuration,
      "INVALID_VALIDATINGBLOCKSDURATION"
    ).to.be.equal(devValidatingBlocksDuration);
    expect(
      currentStatusInitBlock,
      "INVALID_CURRENTSTATUSINITBLOCK"
    ).to.be.equal(txReceipt.blockNumber);
    expect(proposalStatus, "INVALID_PROPOSALSTATUS").to.be.equal(
      eProposalStatus.Voting
    );
    expect(proposalExecutor, "INVALID_PROPOSALEXECUTOR").to.be.equal(
      (await getProposalExecutor()).address
    );
    expect(proposalType, "INVALID_PROPOSALTYPE").to.be.equal(
      getHashedProposalType(eProposalType.UPGRADE_ADDRESS_PROPOSAL)
    );

    expect(abstainVotes, "INVALID_ABSTAIN_VOTES").to.be.equal("0");
    expect(yesVotes, "INVALID_YES_VOTES").to.be.equal("0");
    expect(noVotes, "INVALID_NO_VOTES").to.be.equal("0");
  });

  it("Checks the data of a secondly created proposal in the AaveProtoGovernance", async function() {
    const [txReceipt] = await BRE.run("action-newProposal", {
      signer: (await getEthersSigners())[0]
    });

    const aaveProtoGovernance = await getAaveProtoGovernance();
    const proposalId = 1;

    const {
      totalVotes,
      threshold,
      maxMovesToVotingAllowed,
      movesToVoting,
      votingBlocksDuration,
      validatingBlocksDuration,
      currentStatusInitBlock,
      proposalStatus,
      proposalExecutor,
      proposalType
    } = parseGetProposalBasicData(
      await aaveProtoGovernance.getProposalBasicData(proposalId)
    );

    const [abstainVotes, yesVotes, noVotes] = parseGetVotesData(
      await aaveProtoGovernance.getVotesData(proposalId)
    );

    await expectRevert(
      "INVALID_PROPOSAL_ID",
      aaveProtoGovernance.getProposalBasicData(proposalId + 1)
    );

    await expectRevert(
      "INVALID_PROPOSAL_ID",
      aaveProtoGovernance.getVoterData(
        proposalId + 1,
        await (await getEthersSigners())[0].getAddress()
      )
    );

    await expectRevert(
      "INVALID_PROPOSAL_ID",
      aaveProtoGovernance.getVotesData(
        await (await getEthersSigners())[0].getAddress()
      )
    );

    await expectRevert(
      "INVALID_PROPOSAL_ID",
      aaveProtoGovernance.getVotesData(
        await (await getEthersSigners())[0].getAddress()
      )
    );

    await expectRevert(
      "ASSET_NOT_LISTED",
      BRE.run("action-submitVoteByVoter", {
        proposalId,
        vote: 1,
        votingAsset: ONE_ADDRESS,
        voter: (await getEthersSigners())[0]
      })
    );

    const invalidVotingSignature =
      "0xeeb399573df30f0e08c47c41e3e8fa4a7d343344fcd2eb7997c9039a2f69b2522d0b8b0065490275f84b44947ad0c8a49b72d1b1a6a083f1f197644b6916f70faa";
    await expectRevert(
      "SIGNATURE_NOT_VALID",
      BRE.run("action-submitVoteByRelayer", {
        proposalId,
        vote: 1,
        votingAsset: ONE_ADDRESS,
        voter: (await getEthersSigners())[1],
        relayer: (await getEthersSigners())[0],
        signature: invalidVotingSignature
      })
    );

    const invalidHashedParams =
      "0xa1321baa8855c16771dbf17e63a5be75f5c726b06bf391bd922ef2a81f013dc3";
    await expectRevert(
      "INCONSISTENT_HASHES",
      BRE.run("action-submitVoteByRelayer", {
        proposalId,
        vote: 1,
        votingAsset: ONE_ADDRESS,
        voter: (await getEthersSigners())[1],
        relayer: (await getEthersSigners())[0],
        hashedParams: invalidHashedParams
      })
    );

    const invalidNonce = "6";
    await expectRevert(
      "INVALID_NONCE",
      BRE.run("action-submitVoteByRelayer", {
        proposalId,
        vote: 1,
        votingAsset: ONE_ADDRESS,
        voter: (await getEthersSigners())[1],
        relayer: (await getEthersSigners())[0],
        nonce: invalidNonce
      })
    );

    expect(totalVotes, "INVALID_TOTALVOTES").to.be.equal(0);
    expect(threshold, "INVALID_THRESHOLD").to.be.equal(thresholdDev);
    expect(
      maxMovesToVotingAllowed,
      "INVALID_MAXMOVESTOVOTINGALLOWED"
    ).to.be.equal(devMaxMovesToVotingAllowed);
    expect(movesToVoting, "INVALID_MOVESTOVOTING").to.be.equal(1);
    expect(votingBlocksDuration, "INVALID_VOTINGBLOCKSDURATION").to.be.equal(
      devVotingBlocksDuration
    );
    expect(
      validatingBlocksDuration,
      "INVALID_VALIDATINGBLOCKSDURATION"
    ).to.be.equal(devValidatingBlocksDuration);
    expect(
      currentStatusInitBlock,
      "INVALID_CURRENTSTATUSINITBLOCK"
    ).to.be.equal(txReceipt.blockNumber);
    expect(proposalStatus, "INVALID_PROPOSALSTATUS").to.be.equal(
      eProposalStatus.Voting
    );
    expect(proposalExecutor, "INVALID_PROPOSALEXECUTOR").to.be.equal(
      (await getProposalExecutor()).address
    );
    expect(proposalType, "INVALID_PROPOSALTYPE").to.be.equal(
      getHashedProposalType(eProposalType.UPGRADE_ADDRESS_PROPOSAL)
    );

    expect(abstainVotes, "INVALID_ABSTAIN_VOTES").to.be.equal("0");
    expect(yesVotes, "INVALID_YES_VOTES").to.be.equal("0");
    expect(noVotes, "INVALID_NO_VOTES").to.be.equal("0");
  });

  it("Failure trying to execute an incorrect ProposalExecutor on resolution", async function() {
    const proposalId = 2;

    await BRE.run("action-newProposal", {
      signer: (await getEthersSigners())[0],
      proposalExecutorAddress: (await getFailingProposalExecutor()).address
    });

    await BRE.run("action-mintTestVotingAsset", {
      to: signers[1],
      amount: "5000000"
    });

    await BRE.run("action-mintTestVotingAsset", {
      to: signers[2],
      amount: "600000"
    });

    await BRE.run("action-submitVoteByVoter", {
      proposalId,
      vote: Number(eVote.Yes),
      votingAsset: (await getTestVotingAssetA()).address,
      voter: (await getEthersSigners())[1]
    });

    await fastForwardBlocks(devVotingBlocksDuration);

    await BRE.run("action-submitVoteByVoter", {
      proposalId,
      vote: Number(eVote.Yes),
      votingAsset: (await getTestVotingAssetA()).address,
      voter: (await getEthersSigners())[2]
    });

    await fastForwardBlocks(devVotingBlocksDuration);

    await expectRevert(
      "DELEGATECALL_REVERTED",
      BRE.run("action-resolveProposal", {
        proposalId,
        signer: (await getEthersSigners())[0]
      })
    );
  });
});
