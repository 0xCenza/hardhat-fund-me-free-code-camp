const networkConfig = {
    11155111: {
        name: "sepolia",
        ethUsdPriceFeed: "0x694AA1769357215DE4FAC081bf1f309aDC325306",
    },
};

const developmentChains = ["hardhat", "localhost"];
const DECIMALS = 8;
const INITIAL_ANSWER = 200000000000; // Como son 8 decimales hacés 2000 y le agregás 8 ceros

//Acá abajo exportamos networkConfig para que los otros scripts puedan trabajar con el. Y así es como en deploy-fund.me.js puedo hacer: const { networkConfig } = require("../helper-hardhat-config");
module.exports = {
    networkConfig,
    developmentChains,
    DECIMALS,
    INITIAL_ANSWER,
};
