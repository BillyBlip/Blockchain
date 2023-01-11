pragma solidity^0.5.0;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import './Token.sol';
// imports my token


// Behaviour
// Deposit & Withdraw Funds
// Manage  Orders - Make or Cancel
// Do Trades - Charge fees

// TODO:
// [X] Set the fee account
// [X] Deposit Ether
// [X] Withdraw Ether
// [X] Deposit Tokens
// [X] Withdraw Tokens
// [X] Check Balances
// [X] Make Order
// [X] Cancel Order
// [X] Fill Order
// [X] Charge Fees

contract Exchange {

    using SafeMath for uint;

    // Variables
    address public feeAccount; // account that receives exchange fees
    uint256 public feePercent; // fee percentage
    address constant ETHER = address(0); // store Ether in tokens mapping with blank address
    uint256 public orderCount;
    // Keeps track of the id for our orders

    mapping(address => mapping(address => uint256)) public tokens;
    // address 1 is the tokens mapping
    // address 2 is the user that has deposited the tokens
    // actual number of tokens that the user has

    mapping(uint256 => _Order) public orders;
    // Store the order

    mapping(uint256 => bool) public orderCancelled;
    // Mapping for cancelled orders will give a true or false

    mapping(uint256 => bool) public orderFilled;
    // Mapping for orderFilled will give a true or false

    // Events
    event Deposit(address token, address user, uint256 amount, uint256 balance);
    event Withdraw(address token, address user, uint256 amount, uint256 balance);
    event Order(
        uint256 id,
        address user,
        address tokenGet,
        uint256 amountGet,
        address tokenGive,
        uint256 amountGive,
        uint256 timestamp
    );
    event Cancel(
        uint256 id,
        address user,
        address tokenGet,
        uint256 amountGet,
        address tokenGive,
        uint256 amountGive,
        uint256 timestamp
    );
    event Trade(
        uint256 id,
        address user,
        address tokenGet,
        uint256 amountGet,
        address tokenGive,
        uint256 amountGive,
        address userFill,
        uint256 timestamp
    );
    // Model the order
    // Struct => Allows you to create your own data type
    struct _Order {
        uint256 id;
        // ID of the order
        address user;
        // The person who made the order
        address tokenGet;
        // Address of the token they wanted
        uint256 amountGet;
        // Amount they want to get 
        address tokenGive;
        // Token they will use in the trade
        uint256 amountGive;
        // Amount they are going to give
        uint256 timestamp;
        // Time the order is created
    }

    // add the order to storage

    constructor(address _feeAccount, uint256 _feePercent) public {
        feeAccount = _feeAccount;
        feePercent = _feePercent;
    }
    
    // fallback - reverts if Ether sent directly to exchange
    function() external {
        revert();
    }
    
    // Deposit Ether Function
    function depositEther() payable public {
        tokens[ETHER][msg.sender] = tokens[ETHER][msg.sender].add(msg.value);
        emit Deposit(ETHER, msg.sender, msg.value, tokens[ETHER][msg.sender]);
    }

    function withdrawEther(uint _amount) public {
        require(tokens[ETHER][msg.sender] >= _amount);
        // makes sure that they cant take ether if there isnt any.
        // this will exit if so

        tokens[ETHER][msg.sender] = tokens[ETHER][msg.sender].sub(_amount);
        // Subtracting the ether from the account
        msg.sender.transfer(_amount);
        // Goes back to the sender
        emit Withdraw(ETHER, msg.sender, _amount, tokens[ETHER][msg.sender]);
    }

    function depositToken(address _token, uint256 _amount) public {
        require(_token != ETHER);
        // Dont Allow ether deposit 
        require(Token(_token).transferFrom(msg.sender, address(this), _amount));
        // Token() => will allow the instance of the token: any erc-20 token
        // Require() makes sure that this line occursfirst if not causes an error
        // address(this) => this exchange is this in the smart contract
        // Send token to this contract
        tokens[_token][msg.sender] = tokens[_token][msg.sender].add(_amount);
        // Manage Deposits - update balance
        emit Deposit(_token, msg.sender, _amount, tokens[_token][msg.sender]);
        // Emit event
    }

    function withdrawToken(address _token, uint256 _amount) public {
        require(_token != ETHER);
        require(tokens[_token][msg.sender] >= _amount);
        tokens[_token][msg.sender] = tokens[_token][msg.sender].sub(_amount);
        require(Token(_token).transfer(msg.sender, _amount));
        emit Withdraw(_token, msg.sender, _amount, tokens[_token][msg.sender]);
        // Token gets send back to the user
    }

    // View => means it is external and will return a value for us
    function balanceOf(address _token, address _user) public view returns(uint256 _balance) {
        return tokens[_token][_user];
        // Checks the balance
    }

    function makeOrder(address _tokenGet, uint256 _amountGet, address _tokenGive, uint256 _amountGive) public {
        orderCount = orderCount.add(1);
        orders[orderCount] = _Order(orderCount, msg.sender, _tokenGet, _amountGet, _tokenGive, _amountGive, now);
        // Now => timestamp with soldity feature
        // Expressed in unix epoch time
        emit Order(orderCount, msg.sender, _tokenGet, _amountGet, _tokenGive, _amountGive, now);
    }

    function cancelOrder(uint256 _id) public {
        _Order storage _order = orders[_id];
        // Fetching out of storage from the blockchian and then assigning it to a variable called '_order'
        // Must be "my" order *** Security ***
        require(address(_order.user) == msg.sender);
        // Must be a Valid order
        require(_order.id == _id);
        orderCancelled[_id] = true;
        emit Cancel(_id, msg.sender, _order.tokenGet, _order.amountGet, _order.tokenGive, _order.amountGive, now);
    }

    function fillOrder(uint256 _id) public {
        require(_id > 0 && _id <= orderCount);
        // Order id is more than 0 and that the id is less or equal to the order count
        require(!orderCancelled[_id]);
        // Fetch the order
        require(!orderFilled[_id]);
        // Makes sure that the orders are not in the order filled or cancelled
        _Order storage _order = orders[_id];
        _trade(_order.id, _order.user, _order.tokenGet, _order.amountGet, _order.tokenGive, _order.amountGive);
        // Mark order as filled
        orderFilled[_order.id] = true;
    }

    function _trade(uint256 _orderId, address _user, address _tokenGet, uint256 _amountGet, address _tokenGive, uint256 _amountGive) internal {
        // fee paid by the user that fills the order (msg.sender)
        uint256 _feeAmount = _amountGive.mul(feePercent).div(100);
        
        // Execute the trade
        tokens[_tokenGet][msg.sender] = tokens[_tokenGet][msg.sender].sub(_amountGet.add(_feeAmount));
        tokens[_tokenGet][_user] = tokens[_tokenGet][_user].add(_amountGet);
        tokens[_tokenGet][feeAccount] = tokens[_tokenGet][feeAccount].add(_feeAmount);
        tokens[_tokenGive][msg.sender] = tokens[_tokenGive][msg.sender].add(_amountGive);
        tokens[_tokenGive][_user] = tokens[_tokenGive][_user].sub(_amountGive);

        // Emit trade event 
        emit Trade(_orderId, _user, _tokenGet, _amountGet, _tokenGive, _amountGive, msg.sender, now);
    }
}