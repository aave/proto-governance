import { task } from "@nomiclabs/buidler/config";
import {
  setBRE,
  registerContractInJsonDb,
  deployLendingPoolAddressesProvider
} from "../../helpers/helpers";
import { eContractid } from "../../helpers/types";

const { LendingPoolAddressesProvider } = eContractid;

task(
  `deploy-${LendingPoolAddressesProvider}`,
  `Deploys the ${LendingPoolAddressesProvider}`
).setAction(async (_, BRE) => {
  setBRE(BRE);

  const lendingPoolAddressesProvider = await deployLendingPoolAddressesProvider();

  await registerContractInJsonDb(
    LendingPoolAddressesProvider,
    lendingPoolAddressesProvider
  );
});
