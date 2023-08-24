const { network } = require("hardhat");
const {
    developmentChains,
    DECIMALS,
    INITIAL_ANSWER,
} = require("../helper-hardhat-config");
const { log } = require("ethers");

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments; // We pull the deploy and log function out of deployments
    const { deployer } = await getNamedAccounts(); // We grab this deployer account from getNamedAccounts. getNamedAccounts es para que puedas nombrar las wallets y no tener que recordar cual es cual teniendo wallet 0, wallet 1, etc. namedAccounts lo ponés en hardhat.config.js
    // Sobre la línea de abajo: includes is a function that checks if some variable(chainId) is inside an array(developmentChains). La modifiqué y ahora network.name sería la variable
    if (developmentChains.includes(network.name)) {
        log("Local network detected! Deploying mocks..."); // log lo sacás de deployments más arriba, es como un console.log()
        await deploy("MockV3Aggregator", {
            contract: "MockV3Aggregator",
            from: deployer,
            log: true, // lo que hace esto es que te muestra los logs en la consola al deployear, por ejemplo, te muestra toda esta info adicional: deploying "MockV3Aggregator" (tx: 0x3d732abdeda8235691578f5eae48ec57c18e6860c18196ab7b211ca8f74dce2b)...: deployed at 0x5FbDB2315678afecb367f032d93F642f64180aa3 with 569759 gas.
            args: [DECIMALS, INITIAL_ANSWER],
        });
        log("Mocks deployed!");
        log("---------------------------------------------------"); // Para marcar el final de este deploy script
    }
};

module.exports.tags = ["all", "mocks"]; // Ahora podemos hacer yarn hardhat deploy --tags mocks, y así, solo se deployea este script. Con el comando de este caso, solo se runean los scripts que tienen el "mocks" tag
