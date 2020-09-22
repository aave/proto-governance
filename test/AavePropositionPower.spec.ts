import BRE from "@nomiclabs/buidler";
import {
  getAavePropositionPower,
  getEthersSignersAddresses,
  getDevCouncil
} from "../helpers/helpers";
import { expectNonNullAddress, expectRevert } from "../helpers/testHelpers";
import { expect } from "chai";
import { tEthereumAddress, eEthereumNetwork } from "../helpers/types";
import {
  initialPropositionPowerForDeployer,
  aavePropositionPowerName,
  aavePropositionPowerSymbol,
  aavePropositionPowerDecimals,
  ONE_ETHER,
  getPropositionPowerThresholdByNetwork
} from "../helpers/constants";
import { AavePropositionPower } from "../types/AavePropositionPower";
import BigNumber from "bignumber.js";

describe("AavePropositionPower", () => {
  let signers: tEthereumAddress[] = [];
  let aavePropositionPower: AavePropositionPower = {} as AavePropositionPower;

  before(async () => {
    await BRE.run("dev-deploy");
    aavePropositionPower = await getAavePropositionPower();
    signers = <string[]>await getEthersSignersAddresses();
  });

  after(async () => {
    await BRE.run("dev-deploy");
  });

  it("Has a non-null address after deployment", async function() {
    await expectNonNullAddress(
      aavePropositionPower.address,
      "Invalid AavePropositionPower null address"
    );
  });

  it("Has correct metadata", async function() {
    expect(await aavePropositionPower.name()).to.equal(aavePropositionPowerName);
    expect(await aavePropositionPower.symbol()).to.equal(aavePropositionPowerSymbol);
    expect(await aavePropositionPower.decimals()).to.equal(
      aavePropositionPowerDecimals
    );
  });

  it("It's not possible to mint more tokens because of the cap", async function() {
    await expectRevert(
      "ERC20Capped: cap exceeded",
      aavePropositionPower.mint(
        signers[0],
        initialPropositionPowerForDeployer
      )
    );
  });

  it("The cap of the AavePropositionPower is correct", async function() {
    // TODO adapt for other networks
    expect((await aavePropositionPower.cap()).toString()).to.be.equal(
      new BigNumber(getPropositionPowerThresholdByNetwork(eEthereumNetwork.buidlerevm)).multipliedBy(ONE_ETHER).toFixed(0)
    );
  });

  it("The Council members have 1000000000000000000 AavePropositionPower each", async function() {
    // TODO adapt for other networks
    for (const councilMember of await getDevCouncil()) {
      expect(
        (await aavePropositionPower.balanceOf(councilMember)).toString(),
        "The Council member address needs to have 1 AavePropositionPower token"
      ).to.be.equal(ONE_ETHER.toFixed(0));
    }
  });

  it("Try to deploy a PropositionPower with inconsistent cap and council length", async function() {
    await expectRevert(
      "INCONSISTENT_CAP_AND_COUNCIL_SIZE",
      BRE.run("deploy-AavePropositionPower", {
        cap: "10"
      })
    );
  });
});
