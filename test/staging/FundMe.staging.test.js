// The staging test is the last step before deploying to mainnet
const { getNamedAccounts, ethers, network } = require("hardhat");
const { developmentChains } = require("../../helper-hardhat-config");
const { assert } = require("chai");

// Only run this code if you are on a testnet. Only run this code if you are not in a developer chain
/*
let variable = true;
let someVar = variable ? "yes" : "no"
// someVar will be "yes" because variable is true, if variable is false, someVar will be "no"
// if (variable) {
    someVar = "yes";
} else {
    someVar = "no";
}
*/
// This is like: if developmentChains.includes(network.name) we are gonna skip. The ? is like a one liner if statement, is like a special type of if. If our network is a development chain, then we are gonna do describe.skip and this tells our test to skip this hold describe. Arriba un ejemplo.
developmentChains.includes(network.name)
    ? describe.skip
    : describe("FundMe", async function () {
          let fundMe;
          let deployer;
          const sendValue = ethers.parseEther("0.001");
          beforeEach(async function () {
              deployer = (await getNamedAccounts()).deployer;
              fundMe = await ethers.getContract("FundMe", deployer);
              // We don't do any deploying or fixtures because in our staging test we are assuming that the contract is already deployed
          });

          it("Allows people to fund and withdraw", async function () {
              await fundMe.fund({ value: sendValue });
              await fundMe.withdraw();
              const endingBalance = await ethers.provider.getBalance(
                  fundMe.target,
              );
              assert.equal(endingBalance.toString(), "0");
          });
      });

// yarn hardhat test --network sepolia
