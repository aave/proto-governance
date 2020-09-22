import { task } from "@nomiclabs/buidler/config";
import { setBRE } from "../../helpers/helpers";

task(
  `set-bre`,
  `Inits the BRE, to have access to all the plugins' objects`
).setAction(async (_, _BRE) => {
  await setBRE(_BRE);
  return _BRE;
});
