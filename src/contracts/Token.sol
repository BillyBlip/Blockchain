pragma solidity^0.5.0;
// Version of Solidity

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
// Imports the zeppelin library for safeMath

contract Token {

    using SafeMath for uint;
    
    // Variables
    string public name = "Charity Token";
    // Token name
    string public symbol = "KU";
    // Symbol
    uint256 public decimals = 18;
    // Decimals that the token is divisable by
    uint256 public totalSupply;
    //Total Supply
    mapping(address => uint256) public balanceOf; 
    //Track Balances
    mapping(address => mapping(address => uint256)) public allowance;
    // First address is the deployer
    // Second address of the exchange and the amount they are allowed to spend

    // Events
    event Transfer(address indexed from, address indexed to, uint256 value);
     // Tells the person for transfers
     // "indexed" subscribe that only is meant for us => filtered

    event Approval(address indexed owner, address indexed spender, uint256 value);
    // Tells the approval event

    constructor() public {
        totalSupply = 1000000 * (10 ** decimals);
        
        balanceOf[msg.sender] = totalSupply;
        // msg.sender => who deployed the smart contract receieves all the tokens
    }

    function transfer(address _to, uint256 _value) public returns (bool success) {
        // bool = boolean
        
        require(balanceOf[msg.sender] >= _value);
        // true or false if the sender has sufficent funds
        // false will cause an error
        
        _transfer(msg.sender, _to, _value);
        return true;
    }

    // This function will only be called internally 
    function _transfer(address _from, address _to, uint256 _value) internal {
        
        require(_to != address(0));
        // Needs to be a valid address
        
        balanceOf[_from] = balanceOf[_from].sub(_value);
        // Subtracts the tokens from the person sending the tokens
        
        balanceOf[_to] = balanceOf[_to].add(_value);
        // Adding the tokens to the person it was supposed to be sent to
        
        emit Transfer(_from, _to, _value);
        // Calls the event
    }

    // Approve Token Function
    function approve(address _spender, uint256 _value) public returns (bool success) {
        require(_spender != address(0));
        // Needs to be a valid address

        allowance[msg.sender][_spender] = allowance[msg.sender][_spender].add(_value);
        emit Approval(msg.sender, _spender, _value);
        return true;
    }

    // Transfer From Function
    function transferFrom(address _from, address _to, uint256 _value) public returns (bool success) {
        require(_value <= balanceOf[_from]);
        // Sender needs to have enough tokens to send 
        // Value needs to be less then the senders balance

        require(_value <= allowance[_from][msg.sender]);
        // Value must be less then the approved amount i.e allowance
        
        allowance[_from][msg.sender] = allowance[_from][msg.sender].sub(_value);
        _transfer(_from, _to, _value);
        return true;
    }	
}