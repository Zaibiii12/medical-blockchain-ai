require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config(); 

module.exports = {
  solidity: "0.8.20", // (Keep whatever version was already in your file, likely 0.8.20 or 0.8.28)
  networks: {
    localhost: {
      url: "127.0.0.1:8545"
    },
    sepolia: {
      url: process.env.ALCHEMY_SEPOLIA_URL,
      accounts: [process.env.METAMASK_PRIVATE_KEY]
    }
  }
};