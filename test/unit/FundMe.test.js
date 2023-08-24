/*

 Con el unit testing, testeás una parte del código. Ese testing lo hacés localmente. Después cuando las pequeñas partes funcionan, hacés un staging test. Ahí ya quizás querés runear todo el código en una testnet. El staging test sería el last stop before you deploy to a mainnet.

 Unit tests can be donde with:
 - local hardhat network
 - forked harhat network
*/

// Chequear que el test funciona con un MINIMUM_USD de 50 eth y yo mandando in 1 eth, será por el precio que le puse a eth en PriceConverter.sol?

const { deployments, ethers, getNamedAccounts } = require("hardhat");
const { assert, expect } = require("chai");
const {
    TASK_FLATTEN_GET_FLATTENED_SOURCE_AND_METADATA,
} = require("hardhat/builtin-tasks/task-names");
const { developmentChains } = require("../../helper-hardhat-config");

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("FundMe", function () {
          let fundMe;
          let deployer;
          let mockV3Aggregator;
          const sendValue = ethers.parseEther("0.001"); // 1 ETH. Es lo mismo que hacer lo de abajo pero más fácil de leer. Esa función te convierte ese 1 en el número de abajo que es 1 + 18 ceros. De esta forma, es mucho más fácil de leer, entender y escribir. También hay una parseUnits() function que es muy útil
          //const sendValue = "1000000000000000000"; // 1 ETH
          beforeEach(async function () {
              deployer = (await getNamedAccounts()).deployer; // Here you extract the deployer from getNamedAccounts(). Lo de abajo es lo mismo pero solo serviría para este beforeEach()
              // const { deployer } = await getNamedAccounts(); // Lo de abajo es otra forma
              /*
        const accounts = await ethers.getSigners(); // This function returns whatever is in the accounts section in the network you are using in hardhat.config.js
        const accountZero = accounts[0];
        */
              await deployments.fixture(["all"]); // Fixture allows as to run our entire deploy folder with as many tags as we want. With the "all" tag (que ese "all" tag está puesto manualmente en cada contrato) you will deploy "all" the contracts in the local network. Con solo esta línea, deployearías todos los scripts que están adentro de la deploy folder
              fundMe = await ethers.getContract("FundMe", deployer); // getContract() gets the most recent deployment of whatever contract you tell it. Now whenever we call a function with FundMe it automaticcly be from that deployer account. Acá escribí lo de ethers antes de importarlo arriba y se importó solo (se escribió solo ethers en donde importé hardhat), ya estaba puesto el de deployments. Lo de deployer es para decirle a ethers que cuenta querés conectar a FundMe. Ahora cada vez que llamás a una función con FundMe, va a ser from the deployer account
              mockV3Aggregator = await ethers.getContract(
                  "MockV3Aggregator",
                  deployer,
              );
          });
          describe("constructor", async function () {
              it("sets the aggregator addresses correctly", async function () {
                  const response = await fundMe.getPriceFeed();
                  assert.equal(response, mockV3Aggregator.target); // To make sure priceFeed is the same as our mockV3Aggregator. Since we are running this tests locally
                  // Tuve que hacer mockV3Aggregator.target en vez de mockV3Aggregator.address pq sino no me accedía a la address, no se por qué, si hacés console.log(mockV3Aggregator) ves que la address está adentro de target: y en otra parte está en address: pero hay que acceder de otra forma, no solo haciendo .address. Según chatgpt se puede hacer lo de address con getContractFactory() en vez de getContract() y que debería funcionar con .address pero: 1- mis configuracoines tienen algo distinto y 2- se actualizó algo pero chatgpt solo tiene acceso a información hasta 2021. Conversación con chatgpt al final del documento.
              });
          });

          describe("fund", async function () {
              it("Fails if you don't send enough ETH", async function () {
                  await expect(fundMe.fund()).to.be.revertedWith(
                      "You need to spend more ETH!",
                  );
              });
              it("Updates the amount funded data structure", async function () {
                  await fundMe.fund({ value: sendValue });
                  const response = await fundMe.getAddressToAmountFunded(
                      deployer,
                  );
                  assert.equal(response.toString(), sendValue.toString());
                  // Con este comando runeás solo este test: yarn hardhat test --grep "amount funded"
                  // Con yarn hardhat coverage podés ir viendo cuánto te queda por cubrir
                  /*
            console.log("Response:", response);
            console.log("Response:", sendValue);
            console.log("Response:", response.toString());
            console.log("Response:", sendValue.toString());
            */
              });
              it("Adds funder to array of funders", async function () {
                  await fundMe.fund({ value: sendValue });
                  const funder = await fundMe.getFunder(0);
                  assert.equal(funder, deployer);
              });
          });
          describe("withdraw", async function () {
              beforeEach(async function () {
                  await fundMe.fund({ value: sendValue }); // So before each test, the contract is already funded and with money in it
              });
              it("Withdraw ETH from a single founder", async function () {
                  // .Arrange the test. Cuando pongo .target, debería ser .address pero a mi me funciona con target
                  const startingFundMeBalance =
                      await ethers.provider.getBalance(fundMe.target);
                  const startingDeployerBalance =
                      await ethers.provider.getBalance(deployer);
                  // .Act
                  const transactionResponse = await fundMe.withdraw();
                  const transactionReceipt = await transactionResponse.wait(1); // Por lo que veo, solo llamando a la función, solo te dice el gasPrice y el gasLimit, despues cuando esperás un bloque, ahí te dice cuanto te salió, por eso seguramente patrick lo hizo asi
                  // The breakpoint (puntito rojo a la izquierda) stops the script at this line and allows us to drop it to the debug console and see all the variables that are happening at this time. Now we can see the transactionReceipt and see if the total gast cost is in there. Ahora podemos ir a run and debug y tocar donde dice JavaScript Debug Terminal. Y en esa terminal si ponés: yarn hardhat deploy, se runea todo hasta el breakpoint. Para en el breakpoint. Y te da bastante info de las cosas. Despues en la debug console podés poner transactionReceipt por ejemplo y vez toda la información de ese transactionReceipt object. Tmb se puede ver en la parte arriba a la izquierda donde dice variables. Ahí podemos ver que hay un gasUsed y un gasPrice. Esto tmb se puede ver en la documentación de ethers. Sería una forma diferente de hacer console.log(transactionReceipt). Tmb, si veo más, en transactionReceipt hay una parte que dice fee, ahí está lo que costó la transacción osea, ahí está el gasUsed + gasPrice. Patrick creo que no lo tenía y por eso hizo la multiplicación manualmente
                  const { gasUsed, gasPrice } = transactionReceipt; // Los sacamos de transactionReceipt para usarlos. Tmb podrías hacer:
                  //const gasUsed = transactionReceipt.gasUsed;
                  //const gasPrice = transactionReceipt.gasPrice;

                  const gasCost = gasUsed * gasPrice; // gasUsed.mul(gasPrice). Pero como son big numbers usamos mul(). Al final, no me deja con .mul(), me dice que no es big number. Tmb, en el video de patrick, adentro de transactionReceipt, donde esta effectiveGasPrice y gasUsed, le dice que son big numbers, en mi variable no dice nada de eso

                  const endingFundMeBalance = await ethers.provider.getBalance(
                      fundMe.target,
                  );
                  const endingDeployerBalance =
                      await ethers.provider.getBalance(deployer);

                  // .Assert
                  assert.equal(endingFundMeBalance, 0);
                  assert.equal(
                      endingDeployerBalance + gasCost,
                      startingFundMeBalance + startingDeployerBalance,
                  ); // Ver en calculo.txt
                  /*
            Tmb podría ser así:
            assert.equal(
                endingDeployerBalance,
                (startingFundMeBalance + startingDeployerBalance) - gasCost,
            );
            Así es más fácil de entender, no se si es mejor o no
            */
                  // Es startingDeployerBalance + startingFundMeBalance pero como startingFundMeBalance is calling from the blockchain, it's gonna be of type big number. Por eso usamos: BigNumber.add(otherValue) en vez de el signo +. Despues cual de los dos va primero es lo mismo pero como startingFundMeBalance es un big number, lo pongo primero. Al final no me dejó usar el .add(), me dice que no es big number. Patrick lo hizo como:  startingFundMeBalance.add(startingDeployerBalance).toString() y endingDeployerBalance.add(gasCost).toString()
              });
              it("Allows us to withdraw with multiple funders", async function () {
                  const accounts = await ethers.getSigners();
                  for (let i = 1; i < 6; i++) {
                      // En let i = 1, empezamos con 1 pq el 0 es el deployer
                      // Arrange:
                      const fundMeConnectedContract = await fundMe.connect(
                          accounts[i],
                      ); // Conectamos las accounts ya que, solo deployer estaba conectada a fundMe
                      await fundMeConnectedContract.fund({ value: sendValue });
                      // await fundMe.withdraw({ from: accounts[i], value: sendValue }); la que hice yo antes de ver como lo hacía el
                  }
                  const startingFundMeBalance =
                      await ethers.provider.getBalance(fundMe.target);
                  const startingDeployerBalance =
                      await ethers.provider.getBalance(deployer);
                  // Act:
                  const transactionResponse = await fundMe.withdraw();
                  const transactionReceipt = await transactionResponse.wait(1);
                  const { fee } = transactionReceipt;
                  // Assert:
                  const endingFundMeBalance = await ethers.provider.getBalance(
                      fundMe.target,
                  );
                  const endingDeployerBalance =
                      await ethers.provider.getBalance(deployer);
                  assert.equal(endingFundMeBalance, 0);
                  assert.equal(
                      endingDeployerBalance + fee,
                      startingFundMeBalance + startingDeployerBalance,
                  );
                  // Make sure the funders are reset properly:
                  await expect(fundMe.getFunder(0)).to.be.reverted; // Check if looking at the 0 index throws an error
                  for (i = 1; i < 6; i++) {
                      assert.equal(
                          await fundMe.getAddressToAmountFunded(
                              accounts[i].address,
                          ),
                          0,
                      );
                  }
              });

              it("Only allows the owner to withdraw", async function () {
                  const accounts = await ethers.getSigners();
                  const attacker = accounts[1];
                  const attackerConnectedContract = await fundMe.connect(
                      attacker,
                  ); // We connect the attacker to a new contract. We don't connect only the address, we connect the account, that's why we don't do attacker.address
                  await expect(attackerConnectedContract.withdraw()).to.be
                      .reverted; // Es await expect(attackerConnectedContract.withdraw()).to.be.revertedWith("FundMe__NotOwner"); Pero no me funciona así. Encima, si hago lo de la línea de abajo para ver que error devuelve, devuelve el error FundMe__NotOwner pero si le pongo el to be reverted with(FundMe_NotOwner) me dice que no es ese el error. Lo importante es que el test funciona, revertea por el motivo que esperabamos que es que el que no es el owner no puede llamar a withdraw y sabemos que no revertea por otra cosa como un error. Lo importante es que revertea con el custom error que queríamos que se trigerea cuando el que llama a la función no es el owner. Está bueno ser explícito pq quizas por ejemplo, si vos ponés solo el to be reverted, revertea por otra cosa como que no mandaron guita a la función por ejemplo o algo con el gas y entonces vos al no ser específico y tampoco chequear pq revertea, pensás que revertea por lo que vos pensás pero no es así. Chat gpt me lo explica en el chat: "Debugging Reverted Reason": When using the .revertedWith assertion, it appears to expect the old string format. To correctly check for the revert reason, you might need to use an updated version of the testing library or modify your assertion.
              }); // Analizar ultimos it desde "Allows us to withdraw...", ver scopes tmb
              /*
        try {
            await attackerConnectedContract.withdraw();
        } catch (error) {
            console.log(error.message);
        }
        */

              it("cheaperWithdraw testing...", async function () {
                  const accounts = await ethers.getSigners();
                  for (let i = 1; i < 6; i++) {
                      // En let i = 1, empezamos con 1 pq el 0 es el deployer
                      // Arrange:
                      const fundMeConnectedContract = await fundMe.connect(
                          accounts[i],
                      ); // Conectamos las accounts ya que, solo deployer estaba conectada a fundMe
                      await fundMeConnectedContract.fund({ value: sendValue });
                      // await fundMe.withdraw({ from: accounts[i], value: sendValue }); la que hice yo antes de ver como lo hacía el
                  }
                  const startingFundMeBalance =
                      await ethers.provider.getBalance(fundMe.target);
                  const startingDeployerBalance =
                      await ethers.provider.getBalance(deployer);
                  // Act:
                  const transactionResponse = await fundMe.cheaperWithdraw();
                  const transactionReceipt = await transactionResponse.wait(1);
                  const { fee } = transactionReceipt;
                  // Assert:
                  const endingFundMeBalance = await ethers.provider.getBalance(
                      fundMe.target,
                  );
                  const endingDeployerBalance =
                      await ethers.provider.getBalance(deployer);
                  assert.equal(endingFundMeBalance, 0);
                  assert.equal(
                      endingDeployerBalance + fee,
                      startingFundMeBalance + startingDeployerBalance,
                  );
                  // Make sure the funders are reset properly:
                  await expect(fundMe.getFunder(0)).to.be.reverted; // Check if looking at the 0 index throws an error
                  for (i = 1; i < 6; i++) {
                      assert.equal(
                          await fundMe.getAddressToAmountFunded(
                              accounts[i].address,
                          ),
                          0,
                      );
                  }
              });
          });
      });

/*
Conversación con chatgpt acerca de lo de .address:

User
Why is it in "target:" and not in "address:"?
ChatGPT
In a standard usage of ethers.js, when you obtain a contract instance using the ethers.getContractFactory() method and then deploy it or attach it to an existing contract, the resulting object directly has an .address field.

However, when using hardhat-ethers, especially in conjunction with the hardhat-deploy plugin and its helpers, some changes are introduced to the way contracts are handled and returned. When you do ethers.getContract(), it may be wrapping the actual contract object with additional metadata or helpers. In this wrapping process, it appears that the contract's address is stored under the target key, rather than the conventional address key.

This is somewhat unique behavior associated with hardhat-deploy and its integration with hardhat-ethers. If you are strictly following a tutorial or documentation, sometimes there can be subtle differences in versions or setups that can introduce such nuances.

In practical terms, you'll have to adapt to these nuances when working with these tools. If it's causing confusion, you might consider checking the versions of the plugins you're using and looking into their respective documentation or changelogs to see if any significant changes or notes are mentioned about this behavior.


User
So it should work with .address but something in my setup is different? or could it be and update that you don't know because you have acces only to information till 2021?
ChatGPT
Both scenarios are possible:

Your Setup: It could be something unique about your setup. Given that Hardhat and its associated plugins are modular and have many configurations, sometimes subtle variations in setup or versions can introduce differences in behavior.

Post-2021 Updates: As of my last update in September 2021, the standard behavior for ethers.js was to have the .address property on the contract object. If there have been significant updates or changes in either hardhat, hardhat-ethers, or hardhat-deploy after 2021, I wouldn't be aware of them. The ecosystem around Ethereum development tools is active and rapidly evolving, so changes can occur.

What you can do:

Documentation & Changelogs: Check the documentation for the versions of hardhat, hardhat-ethers, and hardhat-deploy you're using. The changelogs can also offer insights if there have been any significant modifications.

Community & GitHub: The Hardhat community, including their Discord or forum, can be a good place to ask such questions. Similarly, GitHub issues can sometimes provide insights if others have encountered similar concerns.

Experiment: As a temporary measure, if mockV3Aggregator.target gives you the address and mockV3Aggregator.address doesn't, you can use the target property in your tests. Just be sure to leave a comment in your code explaining why, so future readers (or yourself) aren't confused.

Remember that while tools and plugins evolve, the core principles remain consistent. As you continue working with Hardhat and other tools, you'll become more adept at navigating these nuances.
*/
