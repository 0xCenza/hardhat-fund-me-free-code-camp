// Todos los scripts que están adentro de la carpeta deploy se van a runear al hacer yarn hardhat deploy
/*
Antes se hacía:
Imports
Main function
Calling main function
Ahora no va a haber main function ni la vamos a llamar. Ahora, cuando runeamos hardhat deploy, hardhat deploy va a llamar a una función que especificamos en este script
Esta es la forma que más se entiende:
Creás una función y la exportás como la default function para que hardhat deploy la ejecute. Para ver esto ir a module.exports, todo empieza a partir de la comentada async function deployFunc(hre)
*/

const { network } = require("hardhat");
const {
    networkConfig,
    developmentChains,
} = require("../helper-hardhat-config"); // Importamos networkConfig.
/* 
Tmb se puede hacer así:
const helperConfig = require("../helper-hardhat-config");
const networkConfig = helperConfig.networkConfig;
*/
const { verify } = require("../utils/verify");

/*
async function deployFunc(hre) {
    console.log("Hi!");
}

module.exports.default = deployFunc;

Después, runeás yarn hardhat deploy y se imprime Hi!


//Esto de acá abajo es lo mismo, en vez de definir la función antes y llamarla despues, definís una anonymus function de una. hre: Hardhat running environment que sería lo mismo que hardhat

module.exports = async (hre) => {
    const { getNamedAccounts, deployments } = hre; //We only use 2 variables from hre. Esto es lo mismo que hacer: hre.getNamedAccounts y hre.deployments pero, haciendo lo que no comenté, no tenés que hacer más hre.getNamedAccounts todo el tiempo, solo tenés que hacer getNamedAccounts. Tmb, en la primer función que definí, tmb podrías usar estas 2 haciendo: hre.getNamedAccounts() y hre.deployments
};
*/

// Pero, esto de arriba se puede hacer en 1 sola línea así:

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments; // We pull the deploy and log function out of deployments
    const { deployer } = await getNamedAccounts(); // We grab this deployer account from getNamedAccounts. getNamedAccounts es para que puedas nombrar las wallets y no tener que recordar cual es cual teniendo wallet 0, wallet 1, etc. namedAccounts lo ponés en hardhat.config.js
    const chainId = network.config.chainId; // We grab the chainId

    // If chainId is X use address Y
    // If chainId is Z use address A

    //const ethUsdPriceFeedAddress = networkConfig[chainId]["ethUsdPriceFeed"]; // Ahora si runeás yarn hardhat deploy --network sepolia, deployea usando sepolia y usa la priceFeedAddress de sepolia
    let ethUsdPriceFeedAddress; // La hacemos let para poder modificarla
    if (developmentChains.includes(network.name)) {
        const ethUsdAggregator = await deployments.get("MockV3Aggregator"); // With get(), you can get the most recent deployment. Tmb podés hacer solo get("MockV3Aggregator") pero primero tenés que poner get en donde importás deploy y log de deployments.
        ethUsdPriceFeedAddress = ethUsdAggregator.address;
    } else {
        ethUsdPriceFeedAddress = networkConfig[chainId]["ethUsdPriceFeed"];
    }
    // If the contract of priceFeed doesn't exist because we are using a local network, we deploy a minimal version of it for our local testing
    const args = [ethUsdPriceFeedAddress];
    // When going for localhost or hardhat network we want to use a mock for, for example, to make a fake priceFeed contract that we can use and control when working localy, if not, you can't access to it as you are working localy
    const fundMe = await deploy("FundMe", {
        from: deployer,
        args: args, // Se lo pasás al constructor
        log: true, // Para no tener que hacer console.log()
        waitConfirmations: network.config.blockConfirmations || 1, // || es or, por si no especificaste block confirmations antes. Esto lo que hace es esperar las block confirmations que especificaste en hardhat.config.js por cada network, si no especificaste ninguna, espera 1 solo bloque
    });
    // If network isn't a development chain and process.env.ETHERSCAN_API_KEY exists...
    if (
        !developmentChains.includes(network.name) &&
        process.env.ETHERSCAN_API_KEY
    ) {
        await verify(fundMe.address, args);
    }
    log("---------------------------------------------------");
};
module.exports.tags = ["all", "fundme"];

// Una vez deployeado, ahora, cada vez que hacés yarn hardhat node para runear tu propio blockchain node, te meten en el node tus deployed scripts.
