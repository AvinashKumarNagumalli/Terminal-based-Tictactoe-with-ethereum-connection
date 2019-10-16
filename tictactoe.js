var prompt = require("prompt-sync").prompt;
const ethereumjs = require('ethereumjs-abi')
var Web3 = require('web3')
api = "https://ropsten.infura.io/v3/c1584ead480946cc81d312327bc68ad8"
web3 = new Web3(new Web3.providers.HttpProvider(api));

const ethereumjsUtil = require('ethereumjs-util')
var contract1 = require('./contractData');
web3.eth.defaultAccount = "0xda2DC8c85249F3607229e5FFc19E85401204f7FB";

var player1 = null;
var player2 = null;
var giveUp = false;
var counter = 0;
var bigCounter = 0;
var currentPlayer = null;
var currentMove = null;
var goodMove = false;
var winner = false;
var noWinner = false;
var rowWinner = false;
var colWinner = false;
var diagWinner = false;
var repeatPlay = false;
var playAgain = null;
var gameBoard = [
    [" ", " ", " "],
    [" ", " ", " "],
    [" ", " ", " "]
];

let Contract
let game = {
    contractAddress: '',
    addressPlayer1: '',
    addressPlayer2: '',
    escrowPlayer1: 0,
    escrowPlayer2: 0,
    balancePlayer1: 0,
    balancePlayer2: 0
}

let isThisPlayer1 = false
let isThisPlayer2 = false

let contractInstance

var currentMove = [];
var move = [];
var bet1;
var bet2;
var contractaddress;

var blankBoard = function () {
    console.log("          1   2   3  ");
    console.log("        ~~~~~~~~~~~~~");
    console.log("      1 |   |   |   |");
    console.log("        ~~~~~~~~~~~~~");
    console.log("      2 |   |   |   |");
    console.log("        ~~~~~~~~~~~~~");
    console.log("      3 |   |   |   |");
    console.log("        ~~~~~~~~~~~~~");
    console.log("                                         ");
    console.log("- - - - - - - - - - - - - - - - - - - - - - -");
    console.log("                                         ");
};

var gameintro = function () {
    console.log("- - - - - - - - - - - - - - - - - - - - - - -");
    console.log("");
    console.log("Player 1 is X");
    console.log("Player 2 is O");
    console.log("Player 1 goes first.");
    console.log("");
    console.log("Tell me your desired position by column then row.");
    console.log("For example, entering \"1 2\" will make your mark in the 1st column & 2nd row.");
    console.log("");
    console.log("Any player can type the word forfeit to stop game.");
    console.log("");
}

var verifyContarct = function (bet, caddress) {
    const valueSelected = bet;
    const addressSelected = caddress;
    Contract = web3.eth.contract(contract1.abi)
    // If this is the first player set his escrow and balance
    if (addressSelected.length === 0) {
        game.escrowPlayer1 = web3.toWei(valueSelected)
        game.balancePlayer1 = game.escrowPlayer1
        game.addressPlayer1 = web3.eth.defaultAccount
        game.socketPlayer1 = "01"
        contractInstance = Contract.new({
            value: web3.toWei(valueSelected),
            data: bytecode.object,
            gas: 7e6
        }, (err, result) => {
            console.log(result, "result")
            console.log(err, "err")
            // This callback will be called twice, the second time includes the contract address
            if (!result.address) {
                console.log("The transaction is being processed, wait until the block is mined to see the address here...");
            } else {
                console.log("Contract address: " + result.address + ' waiting for second player')
                game.contractAddress = result.address
            }
        })
        // If this is the second player set his escrow and balance
    } else {
        let interval
        contractInstance = Contract.at(addressSelected)
        game.contractAddress = addressSelected
        game.escrowPlayer2 = web3.toWei(valueSelected)
        game.balancePlayer2 = game.escrowPlayer2
        game.addressPlayer2 = web3.eth.defaultAccount
        game.socketPlayer2 = "02"
        contractInstance.setupPlayer2({
            value: web3.toWei(valueSelected),
            gas: 4e6
        }, (err, result) => {
            console.log("The transaction is being processed, wait until the block is mined to start the game");
            interval = setInterval(() => {
                web3.eth.getTransaction(result, (err, result) => {
                    if (result.blockNumber != null) {
                        console.log("Game ready")
                        clearInterval(interval)
                    }
                })
            }, 1e3)
        })
    }
}

var continueGame = function (bet, caddress) {
    console.log("Would you like to continue the game? [y or n]")
    var continue1 = prompt().toLowerCase();
    if (continue1 === "n" || continue1 === "no") {
        console.log("");
        console.log("Yup, have a good day.");
        repeatPlay = false;
    }
    else if (continue1 === "y" || continue1 === "yes") {
        repeatPlay = true;
        verifyContarct(bet, caddress);
    }
    else {
        console.log("");
        console.log("Buh-bye!");
        repeatPlay = false;
    }
}

var askMove = function () {
    console.log("Enter your move in the format: # #");
    currentMove = prompt();
    if (currentMove === "forfeit") {
        giveUp = true;
        console.log("Game ended.");

        if (currentPlayer === player1)
            console.log("Player 2 WINS! NOICE!");
        else
            console.log("Player 1 WINS! YEAH!");
    }
};

var validMove = function () {
    if (currentMove.length !== 3) {
        console.log("Invalid input: you must enter the x and y coordinates separated by a space");
    }
    else if (currentMove.length === 3) {

        var x = currentMove.substr(0, 1);
        var y = currentMove.substr(2, 1);

        if (currentMove.substr(1, 1) !== " ") {
            console.log("Invalid input: you must enter the x and y coordinates separated by a space");
        }

        else if (((x < 1) || (x > 3)) || ((y < 1) || (y > 3))) {
            console.log("Invalid input: those coordinates are outside the playable area");
        }
        else if ((gameBoard[y - 1][x - 1] === "X") || (gameBoard[y - 1][x - 1] === "O")) {
            console.log("Invalid input: that space is already taken");
        }
        else {
            goodMove = true;
        }
    }
};

var printBoard = function () {
    console.log("                                         ");
    console.log("          1   2   3  ");
    console.log("        ~~~~~~~~~~~~~");
    console.log("      1 | " + gameBoard[0][0] + " | " + gameBoard[0][1] + " | " + gameBoard[0][2] + " |");
    console.log("        ~~~~~~~~~~~~~");
    console.log("      2 | " + gameBoard[1][0] + " | " + gameBoard[1][1] + " | " + gameBoard[1][2] + " |");
    console.log("        ~~~~~~~~~~~~~");
    console.log("      3 | " + gameBoard[2][0] + " | " + gameBoard[2][1] + " | " + gameBoard[2][2] + " |");
    console.log("        ~~~~~~~~~~~~~");
    console.log("                                         ");
    console.log("- - - - - - - - - - - - - - - - - - - - - - -");
    console.log("                                         ");
};

var checkWinner = function () {
    if ((gameBoard[0][0] + gameBoard[1][1] + gameBoard[2][2] === "XXX") || (gameBoard[0][0] + gameBoard[1][1] + gameBoard[2][2] === "OOO") || ((gameBoard[0][2] + gameBoard[1][1] + gameBoard[2][0] === "XXX") || (gameBoard[0][2] + gameBoard[1][1] + gameBoard[2][0] === "OOO"))) {
        diagWinner = true;
    }
    else if ((gameBoard[0][0] + gameBoard[0][1] + gameBoard[0][2] === "XXX") || (gameBoard[0][0] + gameBoard[0][1] + gameBoard[0][2] === "OOO") || (gameBoard[1][0] + gameBoard[1][1] + gameBoard[1][2] === "XXX") || (gameBoard[1][0] + gameBoard[1][1] + gameBoard[1][2] === "OOO") || (gameBoard[2][0] + gameBoard[2][1] + gameBoard[2][2] === "XXX") || (gameBoard[2][0] + gameBoard[2][1] + gameBoard[2][2] === "OOO")) {
        rowWinner = true;
    }
    else if ((gameBoard[0][0] + gameBoard[1][0] + gameBoard[2][0] === "XXX") || (gameBoard[0][0] + gameBoard[1][0] + gameBoard[2][0] === "OOO") || (gameBoard[0][1] + gameBoard[1][1] + gameBoard[2][1] === "XXX") || (gameBoard[0][1] + gameBoard[1][1] + gameBoard[2][1] === "OOO") || (gameBoard[0][2] + gameBoard[1][2] + gameBoard[2][2] === "XXX") || (gameBoard[0][2] + gameBoard[1][2] + gameBoard[2][2] === "OOO")) {
        colWinner = true;
    } else if (counter === 9) {
        noWinner = true;
        winner = true;
    }
};

var congrats = function () {
    if (diagWinner === true) {
        console.log("DEFINITELY DELIBARATELY DEMONSTRABLE DIAGNONAL!");
        console.log(currentPlayer + " is the winner!");
        winner = true;
        setListeners();
    } else if (rowWinner === true) {
        console.log("RI-DONK-U-LOUS ROW!");
        console.log(currentPlayer + " is the winner!");
        winner = true;
        setListeners();
    } else if (colWinner === true) {
        console.log("CRAY-CRAY COLUMN!");
        console.log(currentPlayer + " is the winner!");
        winner = true;
        setListeners();
    } else if (counter === 9) {
        console.log("          ");
        console.log("   C A T   ");
        console.log("          ");
        console.log("  /\\   /\\");
        console.log(" =  O.O  =");
        console.log("  \\__^__/   ");
        console.log("         ");
        winner = true;
        noWinner = true;
    }
};


console.log("firstly do you want to start new game or join the game?");
console.log("if you want to start the game enter: 'new game'");
console.log("if you want to join the game enter: 'join game'");
var gamestart = prompt();

if (gamestart === 'new game') {
    console.log("Player 1: What is your name?");
    player1 = prompt();
    console.log("Please enter your Bet:");
    bet = prompt();
    continueGame(bet, 0);
    gameintro();
} else {
    console.log("Player 2: What is your name?");
    player2 = prompt();
    if (player1 === player2) {
        console.log("Please enter different names");
    } else {
        console.log("Please enter your Bet:");
        bet = prompt();
        console.log("Please enter the contract address:");
        contractaddress = prompt();
        continueGame(bet, contractaddress);
        gameintro();
    }
}

bigBody:
do {
    bigCounter++;

    body:
    do {
        counter++;

        if (counter === 1) {
            blankBoard();
            currentPlayer = player1;
            console.log(player1 + ", you go first");
        }

        while (goodMove !== true && giveUp !== true) {
            askMove();
            if (giveUp === true)
                break body;
            validMove();
        }

        var space = " ";
        var move = currentMove.split(space);

        move[0] = parseInt(move[0], 10);
        move[1] = parseInt(move[1], 10);


        if (currentPlayer === player1) {
            gameBoard[move[1] - 1][move[0] - 1] = "X";
        }
        else {
            gameBoard[move[1] - 1][move[0] - 1] = "O";
        }

        printBoard();

        checkWinner();

        congrats();

        if (currentPlayer === player1 && winner !== true) {
            console.log(player2 + "\'s turn");
            currentPlayer = player2;
            goodMove = false;
        } else if (winner !== true) {
            console.log(player1 + "\'s turn");
            currentPlayer = player1;
            goodMove = false;
        }


    } while (winner !== true && noWinner !== true && giveUp !== true);

    if (repeatPlay === true) {

        break bigBody;
    }
} while (repeatPlay === true);

console.log("Thanks for playing!");

function setListeners() {
    // Who's this?
    if (game.addressPlayer1 == web3.eth.defaultAccount) isThisPlayer1 = true
    else isThisPlayer2 = true

    updateVisualData(game)

    if (isThisPlayer1 && game.winner == 1)
        status(`You win ${web3.fromWei(game.betPlayer1)} ether! The balances has been updated`)
    else if (isThisPlayer2 && game.winner == 2)
        status(`You win ${web3.fromWei(game.betPlayer2)} ether! The balances has been updated`)

    let contract = web3.eth.contract(contract1.abi).at(game.contractAddress)
    console.log(contract, "sample")
    if (bet == 0) return status('You must place a bet larger than zero')
    if (bet > getGameBalance()) return status("You can't bet higher than your current balance of " + web3.fromWei(getGameBalance()) + ' ether')
    if (bet > getGameEscrow()) return status("You can't bet higher than your escrow of " + web3.fromWei(getGameEscrow()) + ' ether')
    placeBet(web3.toWei(bet))
}

// Checks that the message given by the player is valid to continue playing and to reveal the results
function verifyMessage(signedMessage, nonce, call, bet, balance, sequence, playerAddress) {
    const hash = generateHash(nonce, call, bet, balance, sequence)
    const message = ethereumjs.soliditySHA3(
        ['string', 'bytes32'],
        ['\x19Ethereum Signed Message:\n32', hash]
    )
    const splitSignature = ethereumjsUtil.fromRpcSig(signedMessage)
    const publicKey = ethereumjsUtil.ecrecover(message, splitSignature.v, splitSignature.r, splitSignature.s)
    const signer = ethereumjsUtil.pubToAddress(publicKey).toString('hex')
    const isMessageValid = (signer.toLowerCase() == ethereumjsUtil.stripHexPrefix(playerAddress).toLowerCase())
    return isMessageValid
}

function generateHash(nonce, call, bet, balance, sequence) {
    const hash = '0x' + ethereumjs.soliditySHA3(
        ['uint256', 'uint256', 'uint256', 'uint256', 'uint256'],
        [String(nonce), String(call), String(bet), String(balance), String(sequence)]
    ).toString('hex')
    return hash
}

function signMessage(hash) {
    return new Promise((resolve, reject) => {
        web3.personal.sign(hash, web3.eth.defaultAccount, (err, result) => {
            if (err) return reject(err)
            resolve(result)
        })
    })
}

function status(message) {
    console.log(message);
}

function getGameBalance() {
    if (isThisPlayer1) return game.balancePlayer1
    else return game.balancePlayer2
}

function getGameEscrow() {
    if (isThisPlayer1) return game.escrowPlayer1
    else return game.escrowPlayer2
}

// This function takes care of generating the messages with the 'activeDice' and the bet used
async function placeBet(bet) {
    if (parseInt(bet) > parseInt(getGameBalance())) return status("You can't bet more than your current balance")
    if (parseInt(bet) > parseInt(getGameEscrow())) return status("You can't bet more than your escrow")

    const nonce = Math.floor(Math.random() * 1e16)
    const hash = generateHash(nonce, bet, getGameBalance())
    const signedMessage = await signMessage(hash)
    let data = {
        signedMessage: signedMessage,
        nonce: nonce,
        bet: bet,
        sequence: sequence,
        sender: web3.eth.defaultAccount
    }
    sequence++
}

function updateVisualData(game) {
    console.log("Contract:" + game.contractAddress);
    console.log("You are: " + (isThisPlayer1) ? 'player 1' : 'player 2');
    console.log("Address player 1:" + game.addressPlayer1);
    console.log("Address player 2:" + game.addressPlayer2);
    console.log("Balance player 1:" + web3.fromWei(game.balancePlayer1));
    console.log("Balance player 2:" + web3.fromWei(game.balancePlayer2));
    console.log("Escrow player 1:" + web3.fromWei(game.escrowPlayer1));
    console.log("Escrow player 1:" + web3.fromWei(game.escrowPlayer1));
}
