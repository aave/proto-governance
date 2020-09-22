import low from "lowdb";
import FileSync from "lowdb/adapters/FileSync";

const adapter = new FileSync("./deployed-contracts.json");
export const getDb = () => low(adapter);
