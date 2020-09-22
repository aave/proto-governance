import BRE from "@nomiclabs/buidler";
import { expect } from "chai";
import {
  tEthereumAddress,
  tChaiAssertionGenerator,
  eVote,
  eProposalStatus,
  eActionPrefix,
  iSubmitVoteContext,
  iCancelVoteContext,
  iTransferTokensTestParams,
  tStringCurrencyUnits,
  iFastForwardBlockParams,
  iChallengeVotersTestParams,
  iVoterWithAddress,
  iResolveProposalTestParams,
  iMintTokensTestParams,
  iTryToMoveToValidatingTestParams
} from "./types";
import { ADDRESS_0x0, ONE_ADDRESS } from "./constants";
import { TestVotingAssetA } from "../types/TestVotingAssetA";
import { Signer, ethers } from "ethers";
import BigNumber from "bignumber.js";
import {
  parseGetVoterData,
  getAssetVotingWeightProvider,
  getTokenBalanceInBigUnits,
  findTokenByAddressOnAvailables,
  getCurrentBlock,
  fastForwardBlocks,
  getTestVotingAssetA,
  getLendingPoolAddressesProvider,
  getEthersSignersAddresses,
  getAaveProtoGovernance,
  parseGetVotesData,
  parseGetProposalBasicData
} from "./helpers";
import { AssetVotingWeightProvider } from "../types/AssetVotingWeightProvider";
import { ContractReceipt } from "ethers/contract";
import _ from "lodash";
import { AaveProtoGovernance } from "../types/AaveProtoGovernance";
import {
  iTransferTokenContext,
  iMintTokensContext,
  iTryToMoveToValidatingContext,
  iChallengeVotersContext,
  iResolveProposalContext,
  iFastForwardBlockContext,
  iSubmitVoteByVoterTestParams,
  iSubmitVoteByRelayerTestParams,
  iCancelVoteByVoterTestParams,
  iCancelVoteByRelayerTestParams
} from "./contract-types";

export const expectNonNullAddress = (
  contractAddress: tEthereumAddress,
  msg: string
) => expect(contractAddress, msg).to.not.equal(ADDRESS_0x0);

export const expectRevert = async (
  revertMsg: string,
  promise: Promise<any>
) => {
  try {
    await promise;
  } catch (error) {
    return expect(<string>error.message).to.contain(revertMsg);
  }
  return expect(true, "False positive").to.be.false;
};

const awaitForAll = async (funcs: Function[]) =>
  await Promise.all(funcs.map(f => f()));

const execAssertionsGenerators = async (
  assertionGenerators: tChaiAssertionGenerator[]
) => await awaitForAll(assertionGenerators);

const execPreconditions = async (
  preconditions: tChaiAssertionGenerator[]
): Promise<boolean> => {
  try {
    await execAssertionsGenerators(preconditions);
    return false;
  } catch (error) {
    return true;
  }
};

const execPostconditions = async (postconditions: tChaiAssertionGenerator[]) =>
  await execAssertionsGenerators(postconditions);

const getSubmitVoteContext = async (
  proposalId: number,
  voter: Signer
): Promise<iSubmitVoteContext> => {
  const aaveProtoGovernance = await getAaveProtoGovernance();

  return {
    choicesAccumVotes: parseGetVotesData(
      await aaveProtoGovernance.getVotesData(proposalId)
    ),
    voterData: parseGetVoterData(
      await aaveProtoGovernance.getVoterData(
        proposalId,
        await voter.getAddress()
      )
    ),
    votingStatus: (
      await aaveProtoGovernance.getProposalBasicData(proposalId)
    )._proposalStatus.toString()
  };
};

const getCancelVoteContext = async (
  proposalId: number,
  voter: Signer
): Promise<iCancelVoteContext> => await getSubmitVoteContext(proposalId, voter);

const getTransferTokenContext = async (
  from: tEthereumAddress,
  to: tEthereumAddress,
  tokenAddress: tEthereumAddress
): Promise<iTransferTokenContext> => {
  const token = await findTokenByAddressOnAvailables(tokenAddress);

  if (!token) {
    throw `getTransferTokenContext. Invalid token ${token}`;
  }

  return {
    senderBalance: await getTokenBalanceInBigUnits(token, from),
    recipientBalance: await getTokenBalanceInBigUnits(token, to),
    token
  };
};

const getMintTokensContext = async (
  to: tEthereumAddress,
  tokenAddress: tEthereumAddress
): Promise<iMintTokensContext> => {
  const token = await findTokenByAddressOnAvailables(tokenAddress);

  if (!token) {
    throw `getMintTokensContext. Invalid token ${token}`;
  }

  return {
    recipientBalance: await getTokenBalanceInBigUnits(token, to),
    token,
    senderAddress: (await getEthersSignersAddresses())[0]
  };
};

const getTryToMoveToValidatingContext = async (
  proposalId: number
): Promise<iTryToMoveToValidatingContext> => {
  const aaveProtoGovernance = await getAaveProtoGovernance();

  return {
    choicesAccumVotes: parseGetVotesData(
      await aaveProtoGovernance.getVotesData(proposalId)
    ),
    aaveProtoGovernance
  };
};

const getChallengeVotersContext = async (
  proposalId: number,
  voters: tEthereumAddress[]
): Promise<iChallengeVotersContext> => {
  const aaveProtoGovernance = await getAaveProtoGovernance();
  const votersData: iVoterWithAddress[] = [] as iVoterWithAddress[];
  for (const voter of voters) {
    votersData.push({
      voter,
      ...parseGetVoterData(
        await aaveProtoGovernance.getVoterData(proposalId, voter)
      )
    });
  }

  return {
    choicesAccumVotes: parseGetVotesData(
      await aaveProtoGovernance.getVotesData(proposalId)
    ),
    votersData,
    aaveProtoGovernance
  };
};

const getBlockLimitOfProposal = async (
  aaveProtoGovernance: AaveProtoGovernance,
  proposalId: number
): Promise<number> => {
  const { initProposalBlock } = parseGetProposalBasicData(
    await aaveProtoGovernance.getProposalBasicData(proposalId)
  );
  const maxBlocksDelta = (
    await aaveProtoGovernance.getLimitBlockOfProposal(proposalId)
  ).toNumber();
  return initProposalBlock + maxBlocksDelta;
};

const getResolveProposalContext = async (
  proposalId: number
): Promise<iResolveProposalContext> => {
  const aaveProtoGovernance = await getAaveProtoGovernance();
  const lendingPoolAddressesProvider = await getLendingPoolAddressesProvider();

  return {
    choicesAccumVotes: parseGetVotesData(
      await aaveProtoGovernance.getVotesData(proposalId)
    ),
    // We suppose the lendingPoolManager will be always changed
    targetAddressBeforeChange: await lendingPoolAddressesProvider.getLendingPoolManager(),
    aaveProtoGovernance,
    blockLimitOfProposal: await getBlockLimitOfProposal(
      aaveProtoGovernance,
      proposalId
    )
  };
};

const getFastForwardBlockContext = async (): Promise<iFastForwardBlockContext> => ({
  blockNumber: await getCurrentBlock()
});

const expectProposalStatus = async (
  proposalId: number,
  aaveProtoGovernance: AaveProtoGovernance,
  expectedStatus: eProposalStatus
) =>
  expect(
    (
      await aaveProtoGovernance.getProposalBasicData(proposalId)
    )._proposalStatus.toString(),
    `Proposal should be in ${expectedStatus} proposal status`
  ).to.be.equal(expectedStatus);

const expectCorrectProposalStatusAfterVoting = async (
  proposalId: number,
  vote: eVote,
  aaveProtoGovernance: AaveProtoGovernance
) =>
  expect(
    (
      await aaveProtoGovernance.getProposalBasicData(proposalId)
    )._proposalStatus.toString(),
    "Proposal status is not correct"
  ).to.be.equal(
    (await isVotingThresholdOfChoicePassed(
      proposalId,
      aaveProtoGovernance,
      vote
    )) && !(await isVotingPeriodPassed(proposalId, aaveProtoGovernance))
      ? eProposalStatus.Validating
      : eProposalStatus.Voting
  );

const isVotingThresholdOfChoicePassed = async (
  proposalId: number,
  aaveProtoGovernance: AaveProtoGovernance,
  vote: eVote
) =>
  new BigNumber(
    (await aaveProtoGovernance.getVotesData(proposalId))[
      parseInt(vote)
    ].toString()
  ).isGreaterThan(
    new BigNumber(
      (
        await aaveProtoGovernance.getProposalBasicData(proposalId)
      )._threshold.toString()
    )
  );

const didAnyChoicePassThreshold = async (
  proposalId: number,
  aaveProtoGovernance: AaveProtoGovernance
): Promise<boolean> =>
  _.some(
    await Promise.all(
      [eVote.Abstain, eVote.Yes, eVote.No].map(choice =>
        isVotingThresholdOfChoicePassed(proposalId, aaveProtoGovernance, choice)
      )
    )
  );

const isVotingPeriodPassed = async (
  proposalId: number,
  aaveProtoGovernance: AaveProtoGovernance
) =>
  new BigNumber(
    (
      await aaveProtoGovernance.getProposalBasicData(proposalId)
    )._currentStatusInitBlock.toNumber()
  )
    .plus(
      new BigNumber(
        (
          await aaveProtoGovernance.getProposalBasicData(proposalId)
        )._votingBlocksDuration.toNumber()
      )
    )
    .isLessThanOrEqualTo(new BigNumber(await getCurrentBlock()));

const isValidatingPeriodPassed = async (
  proposalId: number,
  aaveProtoGovernance: AaveProtoGovernance
) =>
  new BigNumber(
    (
      await aaveProtoGovernance.getProposalBasicData(proposalId)
    )._currentStatusInitBlock.toNumber()
  )
    .plus(
      new BigNumber(
        (
          await aaveProtoGovernance.getProposalBasicData(proposalId)
        )._validatingBlocksDuration.toNumber()
      )
    )
    .isLessThanOrEqualTo(new BigNumber(await getCurrentBlock()));

const expectCorrectVoteAccumOnVoting = async (
  proposalId: number,
  votingAsset: TestVotingAssetA,
  voterAddress: tEthereumAddress,
  assetVotingWeights: AssetVotingWeightProvider,
  context: iSubmitVoteContext,
  vote: eVote,
  actionPrefix: eActionPrefix,
  aaveProtoGovernance: AaveProtoGovernance
) =>
  expect(
    (await aaveProtoGovernance.getVotesData(proposalId))[
      parseInt(vote)
    ].toString(),
    `${actionPrefix}. The balance * assetWeight was not adding succesfully to the voting option`
  ).to.be.equal(
    new BigNumber(context.voterData.balance).isGreaterThan(0)
      ? new BigNumber(
          (await votingAsset.balanceOf(voterAddress))
            .mul(await assetVotingWeights.getVotingWeight(votingAsset.address))
            .toString()
        )
          .plus(context.choicesAccumVotes[parseInt(vote)])
          .minus(
            new BigNumber(context.voterData.balance).multipliedBy(
              context.voterData.weight
            )
          )
          .toFixed(0)
      : new BigNumber(
          (await votingAsset.balanceOf(voterAddress))
            .mul(await assetVotingWeights.getVotingWeight(votingAsset.address))
            .toString()
        )
          .plus(context.choicesAccumVotes[parseInt(vote)])
          .toFixed(0)
  );

// TODO review this function, to simplify it (potentially getting rid of expectPromises)
const expectCorrectVoteAccumAfterChallenge = async (
  proposalId: number,
  context: iChallengeVotersContext,
  actionPrefix: eActionPrefix
) => {
  const { votersData, aaveProtoGovernance } = context;
  const votingAsset = await getTestVotingAssetA();
  const expectPromises = [];
  const leadingChoice = (
    await aaveProtoGovernance.getLeadingChoice(proposalId)
  ).toString();
  // The .slice() is used to not include the INVALID option on the iteration
  for (const votingChoice of Object.values(eVote).slice(0, 3)) {
    let amountToRemove = new BigNumber(0);
    for (const voterData of votersData) {
      const {
        voter: voterAddress,
        balance: previousVoterBalance,
        weight,
        vote
      } = voterData;
      const currentVoterBalance = new BigNumber(
        (await votingAsset.balanceOf(voterAddress)).toString()
      );
      if (
        vote === votingChoice &&
        new BigNumber(currentVoterBalance).isLessThan(
          new BigNumber(previousVoterBalance)
        )
      ) {
        amountToRemove = amountToRemove.plus(
          new BigNumber(previousVoterBalance).multipliedBy(
            new BigNumber(weight)
          )
        );
        const currentVoterData = parseGetVoterData(
          await aaveProtoGovernance.getVoterData(proposalId, voterAddress)
        );

        expectPromises.push(
          async () =>
            expect(
              currentVoterData.asset,
              `${actionPrefix}. Invalid registered voting asset address after vote cancelled`
            ).to.be.equal(ADDRESS_0x0),
          async () =>
            expect(
              currentVoterData.balance,
              `${actionPrefix}. Invalid registered voting balance after vote cancelled`
            ).to.be.equal("0"),
          async () =>
            expect(
              currentVoterData.vote,
              `${actionPrefix}. Invalid registered vote value`
            ).to.be.equal("0"),
          async () =>
            expect(
              currentVoterData.weight,
              `${actionPrefix}. Invalid registered voting asset weight value`
            ).to.be.equal("0")
        );
      }
    }

    expect(
      new BigNumber(
        (await aaveProtoGovernance.getVotesData(proposalId))[
          parseInt(votingChoice)
        ].toString()
      ).isEqualTo(
        new BigNumber(context.choicesAccumVotes[parseInt(votingChoice)]).minus(
          amountToRemove
        )
      ),
      `${actionPrefix}. The balance * assetWeight was not removed succesfully from the voting option`
    ).to.be.true;
  }

  await expectProposalStatus(
    proposalId,
    aaveProtoGovernance,
    new BigNumber(
      (await aaveProtoGovernance.getVotesData(proposalId))[
        parseInt(leadingChoice)
      ].toString()
    ).isGreaterThan(
      new BigNumber(
        (
          await aaveProtoGovernance.getProposalBasicData(proposalId)
        )._threshold.toString()
      )
    )
      ? eProposalStatus.Validating
      : eProposalStatus.Voting
  );

  return awaitForAll(expectPromises);
};

const expectCorrectVoteAccumOnCancel = async (
  proposalId: number,
  context: iCancelVoteContext,
  aaveProtoGovernance: AaveProtoGovernance
) =>
  expect(
    (await aaveProtoGovernance.getVotesData(proposalId))[
      parseInt(context.voterData.vote)
    ].toString(),
    `${eActionPrefix.CANCEL_VOTE}. The previous voting choice value was not removed correctly`
  ).to.be.equal(
    new BigNumber(context.voterData.balance).isGreaterThan(0)
      ? new BigNumber(
          context.choicesAccumVotes[parseInt(context.voterData.vote)]
        )
          .minus(
            new BigNumber(context.voterData.balance).multipliedBy(
              context.voterData.weight
            )
          )
          .toFixed(0)
      : context.voterData.balance
  );

const submitVotePreconditions = async (
  vote: eVote,
  votingAsset: TestVotingAssetA,
  voter: Signer,
  context: iSubmitVoteContext
): Promise<tChaiAssertionGenerator[]> => {
  const voterAddress = await voter.getAddress();

  return [
    async () =>
      expect(
        context.votingStatus,
        `${eActionPrefix.SUBMIT_VOTE}. Invalid Voting status`
      ).to.be.equal(eProposalStatus.Voting),
    async () =>
      expectNonNullAddress(
        votingAsset.address,
        "The voting asset contract can't be null"
      ),
    async () =>
      expect(
        new BigNumber(
          (await votingAsset.balanceOf(voterAddress)).toString()
        ).isGreaterThan(0),
        "votingAsset balance of voter needs to be > 0"
      ).to.be.true
  ];
};

// TODO add override vote postconditions
const submitVotePostconditions = async (
  proposalId: number,
  vote: eVote,
  votingAsset: TestVotingAssetA,
  voter: Signer,
  aaveProtoGovernance: AaveProtoGovernance,
  context: iSubmitVoteContext
): Promise<tChaiAssertionGenerator[]> => {
  const voterAddress = await voter.getAddress();
  const registeredVote = parseGetVoterData(
    await aaveProtoGovernance.getVoterData(proposalId, voterAddress)
  );
  const assetVotingWeights = await getAssetVotingWeightProvider();
  const actionPrefix = eActionPrefix.SUBMIT_VOTE;

  return [
    async () =>
      expect(
        registeredVote.asset,
        `${actionPrefix}. Invalid registered voting asset address after voting`
      ).to.be.equal(votingAsset.address),
    async () =>
      expect(
        registeredVote.balance,
        `${actionPrefix}. Invalid registered voting balance after voting`
      ).to.be.equal((await votingAsset.balanceOf(voterAddress)).toString()),
    async () =>
      expect(
        registeredVote.vote,
        `${actionPrefix}. Invalid registered vote value`
      ).to.be.equal(vote.toString()),
    async () =>
      expect(
        registeredVote.weight,
        `${actionPrefix}. Invalid registered voting asset weight value`
      ).to.be.equal(
        (
          await (await getAssetVotingWeightProvider()).getVotingWeight(
            votingAsset.address
          )
        ).toString()
      ),
    async () =>
      await expectCorrectVoteAccumOnVoting(
        proposalId,
        votingAsset,
        voterAddress,
        assetVotingWeights,
        context,
        vote,
        actionPrefix,
        aaveProtoGovernance
      ),
    async () =>
      await expectCorrectProposalStatusAfterVoting(
        proposalId,
        vote,
        aaveProtoGovernance
      )
  ];
};

const cancelVotePreconditions = async (
  voter: Signer,
  context: iCancelVoteContext
): Promise<tChaiAssertionGenerator[]> => {
  const voterAddress = await voter.getAddress();
  const { voterData } = context;

  return [
    async () =>
      expect(context.votingStatus).to.be.equal(eProposalStatus.Voting),
    async () => expect(voterData.balance).to.not.equal("0")
  ];
};

const cancelVotePostconditions = async (
  proposalId: number,
  voter: Signer,
  aaveProtoGovernance: AaveProtoGovernance,
  context: iCancelVoteContext
): Promise<tChaiAssertionGenerator[]> => {
  const voterAddress = await voter.getAddress();
  const registeredVote = parseGetVoterData(
    await aaveProtoGovernance.getVoterData(proposalId, voterAddress)
  );
  const actionPrefix = eActionPrefix.CANCEL_VOTE;

  return [
    async () =>
      expect(
        registeredVote.asset,
        `${actionPrefix}. Invalid registered voting asset address after vote cancelled`
      ).to.be.equal(ADDRESS_0x0),
    async () =>
      expect(
        registeredVote.balance,
        `${actionPrefix}. Invalid registered voting balance after vote cancelled`
      ).to.be.equal("0"),
    async () =>
      expect(
        registeredVote.vote,
        `${actionPrefix}. Invalid registered vote value`
      ).to.be.equal("0"),
    async () =>
      expect(
        registeredVote.weight,
        `${actionPrefix}. Invalid registered voting asset weight value`
      ).to.be.equal("0"),
    async () =>
      await expectCorrectVoteAccumOnCancel(
        proposalId,
        context,
        aaveProtoGovernance
      )
  ];
};

const transferTokenPreconditions = async (
  amount: tStringCurrencyUnits,
  context: iTransferTokenContext
): Promise<tChaiAssertionGenerator[]> => {
  const { senderBalance } = context;
  return [
    async () =>
      expect(
        new BigNumber(ethers.utils.parseEther(amount).toString()).isGreaterThan(
          0
        )
      ).to.be.true,
    async () =>
      expect(new BigNumber(senderBalance).isGreaterThanOrEqualTo(amount)).to.be
        .true
  ];
};

const transferTokenPostconditions = async (
  amount: tStringCurrencyUnits,
  from: tEthereumAddress,
  to: tEthereumAddress,
  context: iTransferTokenContext
): Promise<tChaiAssertionGenerator[]> => {
  const {
    senderBalance: senderBalanceBefore,
    recipientBalance: recipientBalanceBefore,
    token
  } = context;
  const actionPrefix = eActionPrefix.TRANSFER_TOKEN;

  return [
    async () =>
      expect(
        new BigNumber(await getTokenBalanceInBigUnits(token, from)).toFixed(0),
        `${actionPrefix}. Invalid sender token balance after transfer of ${amount} tokens`
      ).to.be.equal(
        new BigNumber(senderBalanceBefore).minus(amount).toFixed(0)
      ),
    async () =>
      expect(
        new BigNumber(
          new BigNumber(await getTokenBalanceInBigUnits(token, to)).toFixed(0)
        ).toFixed(0),
        `${actionPrefix}. Invalid recipient token balance after transfer of ${amount} tokens`
      ).to.be.equal(
        new BigNumber(recipientBalanceBefore).plus(amount).toFixed(0)
      )
  ];
};

const mintTokensPreconditions = async (
  amount: tStringCurrencyUnits,
  context: iMintTokensContext
): Promise<tChaiAssertionGenerator[]> => {
  const { senderAddress, token } = context;
  return [
    async () =>
      expect(
        new BigNumber(ethers.utils.parseEther(amount).toString()).isGreaterThan(
          0
        ),
        "The amount to mint is 0"
      ).to.be.true,

    async () =>
      expect(
        await token.isMinter(senderAddress),
        "The account trying to mint is not a minter"
      ).to.be.true
  ];
};

const mintTokensPostconditions = async (
  amount: tStringCurrencyUnits,
  to: tEthereumAddress,
  context: iMintTokensContext
): Promise<tChaiAssertionGenerator[]> => {
  const { recipientBalance: recipientBalanceBefore, token } = context;
  const actionPrefix = eActionPrefix.MINT_TOKEN;

  return [
    async () =>
      expect(
        new BigNumber(
          new BigNumber(await getTokenBalanceInBigUnits(token, to)).toFixed(0)
        ).toFixed(0),
        `${actionPrefix}. Invalid recipient token balance after transfer of ${amount} tokens`
      ).to.be.equal(
        new BigNumber(recipientBalanceBefore).plus(amount).toFixed(0)
      )
  ];
};

const tryToMoveToValidatingPreconditions = async (
  proposalId: number,
  context: iTryToMoveToValidatingContext
): Promise<tChaiAssertionGenerator[]> => {
  const { aaveProtoGovernance } = context;
  return [
    async () =>
      await expectProposalStatus(
        proposalId,
        aaveProtoGovernance,
        eProposalStatus.Voting
      )
  ];
};

const tryToMoveToValidatingPostconditions = async (
  proposalId: number,
  context: iTryToMoveToValidatingContext
): Promise<tChaiAssertionGenerator[]> => {
  const { aaveProtoGovernance } = context;
  const actionPrefix = eActionPrefix.TRY_TO_MOVE_TO_VALIDATING;

  return [
    async () => {
      const proposalStatus = (
        await aaveProtoGovernance.getProposalBasicData(proposalId)
      )._proposalStatus.toString();

      return expect(
        proposalStatus,
        `${actionPrefix}. Proposal status is not correct`
      ).to.be.equal(
        !(await isVotingPeriodPassed(proposalId, aaveProtoGovernance))
          ? eProposalStatus.Voting
          : (await didAnyChoicePassThreshold(proposalId, aaveProtoGovernance))
          ? eProposalStatus.Validating
          : eProposalStatus.Voting
      );
    }
  ];
};

const challengeVotersPreconditions = async (
  proposalId: number,
  voters: tEthereumAddress[],
  context: iChallengeVotersContext
): Promise<tChaiAssertionGenerator[]> => {
  const { aaveProtoGovernance } = context;
  return [
    async () =>
      await expectProposalStatus(
        proposalId,
        aaveProtoGovernance,
        eProposalStatus.Validating
      )
  ];
};

const resolveProposalPreconditions = async (
  proposalId: number,
  context: iResolveProposalContext
): Promise<tChaiAssertionGenerator[]> => {
  const { aaveProtoGovernance, blockLimitOfProposal } = context;

  return [
    async () =>
      await expectProposalStatus(
        proposalId,
        aaveProtoGovernance,
        eProposalStatus.Validating
      ),
    async () =>
      expect(
        await isValidatingPeriodPassed(proposalId, aaveProtoGovernance),
        "The validating period didn't pass in order to resolve the proposal"
      ).to.be.true,
    async () =>
      expect(
        new BigNumber(blockLimitOfProposal).isGreaterThan(
          await getCurrentBlock()
        )
      ).to.be.true
  ];
};

const challengeVotersPostconditions = async (
  proposalId: number,
  context: iChallengeVotersContext
): Promise<tChaiAssertionGenerator[]> => {
  const actionPrefix = eActionPrefix.CHALLENGE_VOTERS;

  return [
    async () =>
      expect(
        await expectCorrectVoteAccumAfterChallenge(
          proposalId,
          context,
          actionPrefix
        )
      )
  ];
};

// TODO add tests to check the choiceAccumVotes are not affected by the resolution
const resolveProposalPostconditions = async (
  proposalId: number,
  context: iResolveProposalContext,
  actionExecutorTxsReceipts: ContractReceipt[]
): Promise<tChaiAssertionGenerator[]> => {
  const { targetAddressBeforeChange, aaveProtoGovernance } = context;
  const actionPrefix = eActionPrefix.RESOLVE_PROPOSAL;

  const [resolveProposalReceipt] = actionExecutorTxsReceipts;

  return [
    async () => {
      const leadingOption = (
        await aaveProtoGovernance.getLeadingChoice(proposalId)
      ).toNumber();

      switch (leadingOption.toString()) {
        case eVote.Yes:
          return expect(
            (
              await (
                await getLendingPoolAddressesProvider()
              ).getLendingPoolManager()
            ).toUpperCase(),
            `${actionPrefix}. The address to replace was not changed properly`
          ).to.be.equal(ONE_ADDRESS.toUpperCase());

        default:
          return expect(
            (
              await (
                await getLendingPoolAddressesProvider()
              ).getLendingPoolManager()
            ).toUpperCase(),
            `${actionPrefix}. The address to replace was not changed properly`
          ).to.be.equal(targetAddressBeforeChange.toUpperCase());
      }
    },

    async () =>
      await expectProposalStatus(
        proposalId,
        aaveProtoGovernance,
        eProposalStatus.Executed
      ),
    async () => {
      const leadingOption = (
        await aaveProtoGovernance.getLeadingChoice(proposalId)
      ).toNumber();

      switch (leadingOption.toString()) {
        case eVote.Yes:
          return expect(
            _.some(resolveProposalReceipt.events, {
              event: "YesWins"
            })
          );
        case eVote.No:
          return expect(
            _.some(resolveProposalReceipt.events, {
              event: "NoWins"
            })
          );
        case eVote.Abstain:
          return expect(
            _.some(resolveProposalReceipt.events, {
              event: "AbstainWins"
            })
          );
        default:
          return expect(
            true,
            "Resolution event not emmited. Maybe a new option for a voting choice was forgotten?"
          ).to.be.false;
      }
    },
    async () =>
      expect(
        _.some(resolveProposalReceipt.events, {
          event: "StatusChangeToExecuted"
        })
      )
  ];
};

const fastForwardBlockPostconditions = async (
  numberOfBlocks: number,
  context: iFastForwardBlockContext
): Promise<tChaiAssertionGenerator[]> => {
  const { blockNumber: previousBlock } = context;
  const actionPrefix = eActionPrefix.FAST_FORWARD_BLOCK;
  const currentBlock = await getCurrentBlock();

  return [
    async () =>
      expect(
        currentBlock,
        `${actionPrefix}. Invalid ${numberOfBlocks} block interval on fast-forward of blocks`
      ).to.be.equal(previousBlock + numberOfBlocks)
  ];
};

const submitVoteByVoterActionExecutor = async (
  params: iSubmitVoteByVoterTestParams,
  mustRevert: boolean
) => {
  const { proposalId, voter, vote, votingAsset } = params;
  const actionPrefix = eActionPrefix.SUBMIT_VOTE;

  try {
    await BRE.run("action-submitVoteByVoter", {
      proposalId,
      vote: Number(vote),
      votingAsset: votingAsset.address,
      voter
    });
  } catch (error) {
    if (!mustRevert) {
      throw error;
    }
    return;
  }
  if (mustRevert) {
    throw new Error(
      `${actionPrefix}. The action should have reverted, but didn't`
    );
  }
};

const submitVoteByRelayerActionExecutor = async (
  params: iSubmitVoteByRelayerTestParams,
  mustRevert: boolean
) => {
  const { proposalId, voter, vote, votingAsset, relayer } = params;
  const actionPrefix = eActionPrefix.SUBMIT_VOTE;

  try {
    await BRE.run("action-submitVoteByRelayer", {
      proposalId,
      vote: Number(vote),
      votingAsset: votingAsset.address,
      voter,
      relayer
    });
  } catch (error) {
    if (!mustRevert) {
      throw error;
    }
    return;
  }
  if (mustRevert) {
    throw new Error(
      `${actionPrefix}. The action should have reverted, but didn't`
    );
  }
};

const cancelVoteByVoterActionExecutor = async (
  params: iCancelVoteByVoterTestParams,
  mustRevert: boolean
) => {
  const { proposalId, voter } = params;
  const actionPrefix = eActionPrefix.CANCEL_VOTE;

  try {
    await BRE.run("action-cancelVoteByVoter", { proposalId, voter });
  } catch (error) {
    if (!mustRevert) {
      throw error;
    }
    return;
  }
  if (mustRevert) {
    throw new Error(
      `${actionPrefix}. The action should have reverted, but didn't`
    );
  }
};

const transferTokenActionExecutor = async (
  params: iTransferTokensTestParams,
  mustRevert: boolean
) => {
  const { from, to, amount, token } = params;
  const actionPrefix = eActionPrefix.TRANSFER_TOKEN;

  try {
    await BRE.run("action-transferTokensByAddress", {
      from,
      to,
      amount,
      token
    });
  } catch (error) {
    if (!mustRevert) {
      throw error;
    }
    return;
  }
  if (mustRevert) {
    throw new Error(
      `${actionPrefix}. The action should have reverted, but didn't`
    );
  }
};

const mintTokensActionExecutor = async (
  params: iMintTokensTestParams,
  mustRevert: boolean
) => {
  const { to, amount } = params;
  const actionPrefix = eActionPrefix.MINT_TOKEN;

  try {
    await BRE.run("action-mintTestVotingAsset", {
      to,
      amount
    });
  } catch (error) {
    if (!mustRevert) {
      throw error;
    }
    return;
  }
  if (mustRevert) {
    throw new Error(
      `${actionPrefix}. The action should have reverted, but didn't`
    );
  }
};

const tryToMoveToValidatingActionExecutor = async (
  params: iTryToMoveToValidatingTestParams,
  mustRevert: boolean
) => {
  const { proposalId, signer } = params;
  const actionPrefix = eActionPrefix.TRY_TO_MOVE_TO_VALIDATING;

  try {
    await BRE.run("action-tryToMoveToValidating", { proposalId, signer });
  } catch (error) {
    if (!mustRevert) {
      throw error;
    }
    return;
  }
  if (mustRevert) {
    throw new Error(
      `${actionPrefix}. The action should have reverted, but didn't`
    );
  }
};

const challengeVotersActionExecutor = async (
  params: iChallengeVotersTestParams,
  mustRevert: boolean
) => {
  const { proposalId, voters, signer } = params;
  const actionPrefix = eActionPrefix.CHALLENGE_VOTERS;

  try {
    await BRE.run("action-challengeVoters", { proposalId, voters, signer });
  } catch (error) {
    if (!mustRevert) {
      throw error;
    }
    return;
  }
  if (mustRevert) {
    throw new Error(
      `${actionPrefix}. The action should have reverted, but didn't`
    );
  }
};

const resolveProposalActionExecutor = async (
  params: iResolveProposalTestParams,
  mustRevert: boolean
): Promise<ContractReceipt[]> => {
  const { proposalId, signer } = params;
  const actionPrefix = eActionPrefix.RESOLVE_PROPOSAL;

  let txsReceipts: ContractReceipt[] = [];
  try {
    txsReceipts = await BRE.run("action-resolveProposal", {
      proposalId,
      signer
    });
  } catch (error) {
    if (!mustRevert) {
      throw error;
    }
    return txsReceipts;
  }
  if (mustRevert) {
    throw new Error(
      `${actionPrefix}. The action should have reverted, but didn't`
    );
  }
  return txsReceipts;
};

const cancelVoteByRelayerActionExecutor = async (
  params: iCancelVoteByRelayerTestParams,
  mustRevert: boolean
) => {
  const { proposalId, voter, relayer } = params;
  const actionPrefix = eActionPrefix.CANCEL_VOTE;

  try {
    await BRE.run("action-cancelVoteByRelayer", { proposalId, voter, relayer });
  } catch (error) {
    if (!mustRevert) {
      throw error;
    }
    return;
  }
  if (mustRevert) {
    throw new Error(
      `${actionPrefix}. The action should have reverted, but didn't`
    );
  }
};

export const submitVoteByVoterTestGenerator = async function(
  params: iSubmitVoteByVoterTestParams
) {
  const { proposalId, voter, vote, votingAsset, aaveProtoGovernance } = params;
  const context = await getSubmitVoteContext(proposalId, voter);
  const mustRevert = await execPreconditions(
    await submitVotePreconditions(vote, votingAsset, voter, context)
  );

  await submitVoteByVoterActionExecutor(params, mustRevert);

  if (!mustRevert) {
    await execPostconditions(
      await submitVotePostconditions(
        proposalId,
        vote,
        votingAsset,
        voter,
        aaveProtoGovernance,
        context
      )
    );
  }
};

export const submitVoteByRelayerTestGenerator = async function(
  params: iSubmitVoteByRelayerTestParams
) {
  const { proposalId, voter, vote, votingAsset, aaveProtoGovernance } = params;
  const context = await getSubmitVoteContext(proposalId, voter);
  const mustRevert = await execPreconditions(
    await submitVotePreconditions(vote, votingAsset, voter, context)
  );

  await submitVoteByRelayerActionExecutor(params, mustRevert);

  if (!mustRevert) {
    await execPostconditions(
      await submitVotePostconditions(
        proposalId,
        vote,
        votingAsset,
        voter,
        aaveProtoGovernance,
        context
      )
    );
  }
};

export const cancelVoteByVoterTestGenerator = async function(
  params: iCancelVoteByVoterTestParams
) {
  const { proposalId, voter, aaveProtoGovernance } = params;
  const context = await getCancelVoteContext(proposalId, voter);
  const mustRevert = await execPreconditions(
    await cancelVotePreconditions(voter, context)
  );

  await cancelVoteByVoterActionExecutor(params, mustRevert);

  if (!mustRevert) {
    await execPostconditions(
      await cancelVotePostconditions(
        proposalId,
        voter,
        aaveProtoGovernance,
        context
      )
    );
  }
};

export const cancelVoteByRelayerTestGenerator = async function(
  params: iCancelVoteByRelayerTestParams
) {
  const { proposalId, voter, aaveProtoGovernance } = params;
  const context = await getCancelVoteContext(proposalId, voter);
  const mustRevert = await execPreconditions(
    await cancelVotePreconditions(voter, context)
  );

  await cancelVoteByRelayerActionExecutor(params, mustRevert);

  if (!mustRevert) {
    await execPostconditions(
      await cancelVotePostconditions(
        proposalId,
        voter,
        aaveProtoGovernance,
        context
      )
    );
  }
};

export const transferTokensTestGenerator = async function(
  params: iTransferTokensTestParams
) {
  const { from, to, token, amount } = params;
  const context = await getTransferTokenContext(from, to, token);
  const mustRevert = await execPreconditions(
    await transferTokenPreconditions(amount, context)
  );

  await transferTokenActionExecutor(params, mustRevert);

  if (!mustRevert) {
    await execPostconditions(
      await transferTokenPostconditions(amount, from, to, context)
    );
  }
};

export const mintTokensTestGenerator = async function(
  params: iMintTokensTestParams
) {
  const { to, token, amount } = params;
  const context = await getMintTokensContext(to, token);
  const mustRevert = await execPreconditions(
    await mintTokensPreconditions(amount, context)
  );

  await mintTokensActionExecutor(params, mustRevert);

  if (!mustRevert) {
    await execPostconditions(
      await mintTokensPostconditions(amount, to, context)
    );
  }
};

export const fastForwardBlockTestGenerator = async function(
  params: iFastForwardBlockParams
) {
  const { numberOfBlocks } = params;
  const context = await getFastForwardBlockContext();
  await fastForwardBlocks(numberOfBlocks);
  await execPostconditions(
    await fastForwardBlockPostconditions(numberOfBlocks, context)
  );
};

export const tryToMoveToValidatingTestGenerator = async function(
  params: iTryToMoveToValidatingTestParams
) {
  const { proposalId } = params;
  const context = await getTryToMoveToValidatingContext(proposalId);

  const mustRevert = await execPreconditions(
    await tryToMoveToValidatingPreconditions(proposalId, context)
  );

  await tryToMoveToValidatingActionExecutor(params, mustRevert);

  if (!mustRevert) {
    await execPostconditions(
      await tryToMoveToValidatingPostconditions(proposalId, context)
    );
  }
};

export const challengeVotersTestGenerator = async function(
  params: iChallengeVotersTestParams
) {
  const { proposalId, voters } = params;
  const context = await getChallengeVotersContext(proposalId, voters);

  const mustRevert = await execPreconditions(
    await challengeVotersPreconditions(proposalId, voters, context)
  );

  await challengeVotersActionExecutor(params, mustRevert);

  if (!mustRevert) {
    await execPostconditions(
      await challengeVotersPostconditions(proposalId, context)
    );
  }
};

export const resolveProposalTestGenerator = async function(
  params: iResolveProposalTestParams
) {
  const { proposalId } = params;
  const context = await getResolveProposalContext(proposalId);

  const mustRevert = await execPreconditions(
    await resolveProposalPreconditions(proposalId, context)
  );

  const txReceipts = await resolveProposalActionExecutor(params, mustRevert);

  if (!mustRevert) {
    await execPostconditions(
      await resolveProposalPostconditions(proposalId, context, txReceipts)
    );
  }
};
