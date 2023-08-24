// Siguiendo el order of layout de solidity style guide
// SPDX-License-Identifier: MIT
// 1- Pragma
pragma solidity ^0.8.8;

// 2- Imports
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol"; // yarn add --dev @chainlink/contracts
import "./PriceConverter.sol";
import "hardhat/console.sol"; // Para poder usar console.log() en solidity. Hasta podrías hacer cosas tipo: console.log("Sending tokens to:" msg.sender)

// Despues de los imports, errors
error FundMe__NotOwner(); // Primero ponemos de que contrato es el error para saber justamente de que contrato viene el error. Es solo una good practice, sino sería: error NotOwner();

// Con los errores podés optimizar gas, en ves de poner require(..., "El mensaje de error"), ponés  if (...) revert FundMe__NotOwner();. Así no tenés que storear toda esa string larga en la chain. Abajo hay un if con revert

// 3- Interfaces
// 4- Libraries
// 5- Contracts

// Esto de acá abajo es de natspec, tmb podés hacerlo con 3 barritas, de esa forma, te cubre solo esa línea. Es importante agregar estos tags porque, de esta forma, podés usar natspec para crear documentación automaticamente por/para nosotros(es for us). Si instalás solc, podés runear solc --userdoc --devdoc fileName.sol, to automatically generate documentation. En este curso, como no vamos a hacer documentación, solo vamos a hacer esto si creemos que alguna función o alguna parte del código es medio complicada. (Creo que dijo most of us en vez de refiriendose al curso, como que nosotros seguro no lo vamos a tener que hacer en general para cualquier contrato que escribamos pq seguro no vamos a hacer documentation). Minuto 11:03:00 aprox.

/** @title A contract for crowd funding. // Here we explain what this contract is.
 * @author Ignacio.Solidity
 * @notice This contract is to demo a sample funding contract. // This is like a note to people.
 * @dev This implements price feeds as our library. // Is a note specifically for developers.
 */
contract FundMe {
    // 1- Type declarations
    using PriceConverter for uint256;

    // 2- State variables
    mapping(address => uint256) private s_addressToAmountFunded; // The s stands for storage. This is to make sure we know that we are working with a storage variable and we are about to spend a lot of gas. Si toco control + f y despues toco la flechita que apunta a la derecha, puedo reemplazar todas las palabras o números que busque con lo que yo quiera
    address[] private s_funders;

    // Could we make this constant?  /* hint: no! We should make it immutable! */
    address private immutable i_owner; // owner is not a storage variable, is immutable. Las privates e internals tmb son más baratas que las public asi que si no es necesario hacerla public, mejor no hacerla, total, se puede acceder a las variables igual. Abajo despues le creamos una función getter. Changing the visibility can save us some gas in the long run because, we are gonna be calling from private variables or internal variables which are cheaper gas wise
    uint256 public constant MINIMUM_USD = 1 * 10 ** 15; // constant are also not storage variables so we write them with capitals
    AggregatorV3Interface private s_priceFeed;

    // 3- Events
    // 4- Modifiers
    modifier onlyOwner() {
        // require(msg.sender == i_owner);
        if (msg.sender != i_owner) revert FundMe__NotOwner();
        _;
    }

    // 5- Functions

    /* Functions order:
    constructor
    recieve
    fallback
    external
    public
    internal
    private
    view/pure
*/

    constructor(address priceFeedAddress) {
        // Para no tener que estar cambiando el contrato del priceFeed cada vez que switcheamos de chain (ya que por cada chain, el contrato es distinto)
        s_priceFeed = AggregatorV3Interface(priceFeedAddress); // So now, with the s, we know we are spending a lot of gas storing this
        i_owner = msg.sender;
    }

    /* 
    Explainer from: https://solidity-by-example.org/fallback/
       Ether is sent to contract
            is msg.data empty?
                /   \ 
               yes  no
               /     \
          receive()?  fallback() 
           /   \ 
         yes   no
        /        \
      receive()  fallback()
    

    receive() external payable {
        fund();
    }

    fallback() external payable {
        fund();
    }
*/

    /**
     * @notice This function funds this contract
     * @dev xx
     */
    // @param...
    // @return ...
    function fund() public payable {
        require(
            msg.value.getConversionRate(s_priceFeed) >= MINIMUM_USD,
            "You need to spend more ETH!"
        );
        // require(PriceConverter.getConversionRate(msg.value) >= MINIMUM_USD, "You need to spend more ETH!");
        s_addressToAmountFunded[msg.sender] += msg.value;
        s_funders.push(msg.sender);
    }

    function withdraw() public onlyOwner {
        for (
            uint256 funderIndex = 0;
            funderIndex < s_funders.length;
            funderIndex++
        ) {
            address funder = s_funders[funderIndex];
            s_addressToAmountFunded[funder] = 0;
        }
        s_funders = new address[](0);
        /*
         transfer
         payable(msg.sender).transfer(address(this).balance);
         send
         bool sendSuccess = payable(msg.sender).send(address(this).balance);
         require(sendSuccess, "Send failed");
         call
        */
        (bool callSuccess, ) = payable(msg.sender).call{
            value: address(this).balance
        }("");
        require(callSuccess, "Call failed");
    }

    function cheaperWithdraw() public payable onlyOwner {
        address[] memory funders = s_funders; // We copy the storage array into a memory array so we don't have to constantly read from storage. Mappings can't be in memory
        for (uint256 funderIndex; funderIndex < funders.length; funderIndex++) {
            address funder = funders[funderIndex];
            s_addressToAmountFunded[funder] = 0;
        }
        s_funders = new address[](0);
        (bool success, ) = i_owner.call{value: address(this).balance}("");
        require(success);
    }

    // Estas funciones getter de acá abajo las hacemos para poner el s_ o el i_ en las variables y que las otras personas que quieren interactuar con el código no tengan que lidiar con esas s_ y i_ en cambio, les das funciones que sean fácil de leer y entender. Lo de lidiar seria: don't have to deal with the s_ and i_.
    function getOwner() public view returns (address) {
        return i_owner;
    }

    function getFunder(uint256 index) public view returns (address) {
        return s_funders[index];
    }

    function getAddressToAmountFunded(
        address funder
    ) public view returns (uint256) {
        return s_addressToAmountFunded[funder];
    }

    function getPriceFeed() public view returns (AggregatorV3Interface) {
        return s_priceFeed;
    }
}

//solhint 'contracts/**/*.sol' en la consola para analizar todos los contratos y:
//solhint contracts/MyToken.sol para un contrato específico
// "@nomiclabs/hardhat-ethers": "npm:hardhat-deploy-ethers" en package.json significa que the hardhat ethers package is now overwritten by the hardhat deploy ethers package
