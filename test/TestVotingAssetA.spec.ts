import BRE from "@nomiclabs/buidler";
import {
  getEthersSignersAddresses,
  getTestVotingAssetA
} from "../helpers/helpers";
import {
  expectNonNullAddress,
  transferTokensTestGenerator
} from "../helpers/testHelpers";
import { expect } from "chai";
import { tEthereumAddress } from "../helpers/types";
import { TestVotingAssetA } from "../types/TestVotingAssetA";
import {
  testVotingAssetAName,
  testVotingAssetASymbol,
  testVotingAssetADecimals
} from "../helpers/constants";
import { currencyUnitsToDecimals } from "../helpers/calculationHelpers";
import BigNumber from "bignumber.js";

describe("TestVotingAssetA", () => {
  let signers: tEthereumAddress[] = [] as tEthereumAddress[];
  let testVotingAssetA: TestVotingAssetA = {} as TestVotingAssetA;

  before(async () => {
    await BRE.run("dev-deploy");
    testVotingAssetA = await getTestVotingAssetA();
    signers = <tEthereumAddress[]>await getEthersSignersAddresses();
  });

  after(async () => {
    await BRE.run("dev-deploy");
  });

  it("Has a non-null address after deployment", async function() {
    expectNonNullAddress(
      testVotingAssetA.address,
      "Invalid TestVotingAssetA null address"
    );
  });

  it("Has correct metadata", async function() {
    expect(await testVotingAssetA.name()).to.equal(testVotingAssetAName);
    expect(await testVotingAssetA.symbol()).to.equal(testVotingAssetASymbol);
    expect(await testVotingAssetA.decimals()).to.equal(
      testVotingAssetADecimals
    );
  });

  it("Mints tokens to 2 voters", async function() {
    const recipients = [signers[1], signers[2]];
    const amountsToMint = ["10", "6"];

    expect((await testVotingAssetA.balanceOf(signers[1])).toString()).to.equal(
      "0"
    );
    expect((await testVotingAssetA.balanceOf(signers[2])).toString()).to.equal(
      "0"
    );

    await BRE.run("action-mintTestVotingAsset", {
      to: recipients[0],
      amount: amountsToMint[0]
    });
    await BRE.run("action-mintTestVotingAsset", {
      to: recipients[1],
      amount: amountsToMint[1]
    });

    expect(
      (await testVotingAssetA.balanceOf(recipients[0])).toString()
    ).to.be.equal(currencyUnitsToDecimals(new BigNumber(amountsToMint[0]), 18));

    expect(
      (await testVotingAssetA.balanceOf(recipients[1])).toString()
    ).to.be.equal(currencyUnitsToDecimals(new BigNumber(amountsToMint[1]), 18));
  });

  it("Transfer tokens from voter 1 to voter 3", async function() {
    const sender = signers[1];
    const recipient = signers[3];
    const amount = "1";

    await transferTokensTestGenerator({
      from: sender,
      to: recipient,
      token: testVotingAssetA.address,
      amount
    });
  });
});
