const { getNamedAccounts, ethers } = require("hardhat");
// If you want to fund one of your contracts quickly, you can run this

async function main() {
    const { deployer } = await getNamedAccounts();
    const fundMe = await ethers.getContract("FundMe", deployer);
    console.log("Funding Contract...");
    const transactionResponse = await fundMe.fund({
        value: ethers.parseEther("0.001"),
    });
    await transactionResponse.wait(1);
    console.log("Funded!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.log(error);
        process.exit(1);
    });

// yarn hardhat node
// We run a local node with all our contracts deployed
// yarn hardhat run scripts/fund.js --network localhost (en otra terminal)
