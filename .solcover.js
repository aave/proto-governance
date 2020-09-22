const accounts = require(`./testAccounts.js`).accounts;

module.exports = {
  client: require("ganache-cli"),
  skipFiles: ["mocks/", "libraries/"],
  mocha: {
    enableTimeouts: false 
  },
  providerOptions: {
    accounts
  }
};
