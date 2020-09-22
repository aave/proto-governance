import BRE from "@nomiclabs/buidler";
import {
  getEthersSignersAddresses,
  getLendingPoolAddressesProvider
} from "../helpers/helpers";
import { expectNonNullAddress } from "../helpers/testHelpers";
import { expect } from "chai";
import { tEthereumAddress } from "../helpers/types";
import { LendingPoolAddressesProvider } from "../types/LendingPoolAddressesProvider";

describe("LendingPoolAddressesProvider", () => {
  let signers: tEthereumAddress[] = [] as tEthereumAddress[];
  let lendingPoolAddressesProvider: LendingPoolAddressesProvider = {} as LendingPoolAddressesProvider;

  before(async () => {
    await BRE.run("dev-deploy");
    lendingPoolAddressesProvider = await getLendingPoolAddressesProvider();
    signers = <tEthereumAddress[]>await getEthersSignersAddresses();
  });

  after(async () => {
    await BRE.run("dev-deploy");
  });

  it("Has a non-null address after deployment", async function() {
    expectNonNullAddress(
      lendingPoolAddressesProvider.address,
      "Invalid LendingPoolAddressesProvider null address"
    );
  });

  it("The owner is signers[0]", async function() {
    expect(await (await getLendingPoolAddressesProvider()).owner()).to.equal(signers[0]);
  });
});
