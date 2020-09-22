import BRE from "@nomiclabs/buidler";
import {
  getAavePropositionPower,
  getAssetVotingWeightProvider,
  getGovernanceParamsProvider
} from "../helpers/helpers";
import { expectNonNullAddress } from "../helpers/testHelpers";
import { expect } from "chai";
import { ONE_ADDRESS, getPropositionPowerThresholdByNetwork } from "../helpers/constants";
import { GovernanceParamsProvider } from "../types/GovernanceParamsProvider";
import { eEthereumNetwork } from "../helpers/types";

describe("GovernanceParamsProvider", () => {
  let governanceParamsProvider: GovernanceParamsProvider = {} as GovernanceParamsProvider;

  before(async () => {
    await BRE.run("dev-deploy");
    governanceParamsProvider = await getGovernanceParamsProvider();
  });

  after(async () => {
    await BRE.run("dev-deploy");
  });

  it("Has a non-null address after deployment", async function() {
    expectNonNullAddress(
      governanceParamsProvider.address,
      "Invalid GovernanceParamsProvider null address"
    );
  });

  it("Has the correct aavePropositionPower registered", async function() {
    expect(await governanceParamsProvider.getPropositionPower()).to.be.equal(
      (await getAavePropositionPower()).address
    );
  });

  it("Has the correct propositionPowerThreshold registered", async function() {
    expect(
      (await governanceParamsProvider.getPropositionPowerThreshold()).toNumber()
    ).to.be.equal(getPropositionPowerThresholdByNetwork(eEthereumNetwork.buidlerevm));
  });

  it("Has the correct assetVotingWeightProvider registered", async function() {
    expect(
      await governanceParamsProvider.getAssetVotingWeightProvider()
    ).to.be.equal((await getAssetVotingWeightProvider()).address);
  });

  it("Sets correctly the aavePropositionPower registered", async function() {
    const newPropositionPower = ONE_ADDRESS;
    await governanceParamsProvider.setPropositionPower(newPropositionPower);
    expect(await governanceParamsProvider.getPropositionPower()).to.be.equal(
      newPropositionPower
    );
  });

  it("Sets correctly the propositionPowerThreshold registered", async function() {
    const newPropositionPowerThreshold = 3;
    await governanceParamsProvider.setPropositionPowerThreshold(
      newPropositionPowerThreshold
    );
    expect(
      (await governanceParamsProvider.getPropositionPowerThreshold()).toNumber()
    ).to.be.equal(newPropositionPowerThreshold);
  });

  it("Sets correctly the assetVotingWeightProvider registered", async function() {
    const newAssetVotingWeightProvider = ONE_ADDRESS;
    await governanceParamsProvider.setAssetVotingWeightProvider(
      newAssetVotingWeightProvider
    );
    expect(
      await governanceParamsProvider.getAssetVotingWeightProvider()
    ).to.be.equal(newAssetVotingWeightProvider);
  });
});
