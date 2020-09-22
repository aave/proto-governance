import BRE from "@nomiclabs/buidler";
import {
  getAssetVotingWeightProvider,
  getTestVotingAssetA,
  getTestVotingAssetB
} from "../helpers/helpers";
import { expectNonNullAddress, expectRevert } from "../helpers/testHelpers";
import { expect } from "chai";
import { eContractid } from "../helpers/types";
import { testAssetWeights, ONE_ADDRESS } from "../helpers/constants";
import { AssetVotingWeightProvider } from "../types/AssetVotingWeightProvider";
import { TestVotingAssetA } from "../types/TestVotingAssetA";
import { TestVotingAssetB } from "../types/TestVotingAssetB";

describe("AssetVotingWeightProvider", () => {
  let assetVotingWeightProvider: AssetVotingWeightProvider = {} as AssetVotingWeightProvider;
  let testVotingAssetA: TestVotingAssetA = {} as TestVotingAssetA;
  let testVotingAssetB: TestVotingAssetB = {} as TestVotingAssetB;

  before(async () => {
    await BRE.run("dev-deploy");
    assetVotingWeightProvider = await getAssetVotingWeightProvider();
    testVotingAssetA = await getTestVotingAssetA();
    testVotingAssetB = await getTestVotingAssetB();
  });

  after(async () => {
    await BRE.run("dev-deploy");
  });

  it("Has a non-null address after deployment", async function() {
    expectNonNullAddress(
      assetVotingWeightProvider.address,
      "Invalid AssetVotingWeightProvider null address"
    );
  });

  it("Has correct voting weights for the test voting assets", async function() {
    expect(
      (
        await assetVotingWeightProvider.getVotingWeight(
          testVotingAssetA.address
        )
      ).toNumber()
    ).to.be.equal(testAssetWeights[eContractid.TestVotingAssetA]);
    expect(
      (
        await assetVotingWeightProvider.getVotingWeight(
          testVotingAssetB.address
        )
      ).toNumber()
    ).to.be.equal(testAssetWeights[eContractid.TestVotingAssetB]);
  });

  it("Set correctly the weight of an asset", async function() {
    const newWeight = "50";
    await assetVotingWeightProvider.setVotingWeight(
      testVotingAssetA.address,
      newWeight
    );
    expect(
      (
        await assetVotingWeightProvider.getVotingWeight(
          testVotingAssetA.address
        )
      ).toString()
    ).to.be.equal(newWeight);
  });

  it("Try to deploy an AssetVotingWeightProvider with inconsistent assets and weights length", async function() {
    await expectRevert(
      "INCONSISTENT_ASSETS_WEIGHTS_LENGTHS",
      BRE.run("deploy-AssetVotingWeightProvider", {
        assets: [ONE_ADDRESS],
        weights: ["2", "3"]
      })
    );
  });
});
