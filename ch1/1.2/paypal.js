const EthCrypto = require('eth-crypto');
const Client = require('./client.js');

// Our naive implementation of a centralized payment processor
class Paypal extends Client {
  constructor() {
    super();
    // the state of the network (accounts and balances)
    this.state = {
      [this.wallet.address]: {
        balance: 1000000,
      },
    };
    // the history of transactions
    this.txHistory = [];
  }

  // Checks that the sender of a transaction is the same as the signer
  checkTxSignature(tx) {
    // get the signature from the transaction
    const signature = tx.sig;
    const address_recovered = EthCrypto.recover(signature, EthCrypto.hash.keccak256(tx));
    if (!address_recovered || address_recovered !== tx.from) {
      // if the signature is invalid print an error to the console and return false
      console.error('Invalid transaction signature.');
      return false;
    }
    // return true if the transaction is valid
    return true;
  }

  // Checks if the user's address is already in the state, and if not, adds the user's address to the state
  checkUserAddress(tx) {
    let isSenderInState = false;
    let isReceiverInState = false;

    // check if the sender is in the state
    if (!this.state[tx.from]) {
      // if the sender is not in the state, create an account for them
      this.state[tx.from] = {
        balance: 0,
      };
      isSenderInState = true;
    }

    // check if the receiver is in the state
    if (!this.state[tx.to]) {
      // if the receiver is not in the state, create an account for them
      this.state[tx.to] = {
        balance: 0,
      };
      isReceiverInState = true;
    }

    // once the checks on both accounts pass (they're both in the state), return true
    return isSenderInState && isReceiverInState;
  }

  // Checks the transaction type and ensures that the transaction is valid based on that type
  checkTxType(tx) {
    let isValidTxType = false;
    let responseMessage = '';
    switch (tx.type) {
      // if the transaction type is 'mint'
      case 'mint':
        // check that the sender is PayPal
        if (tx.from == this.wallet.address) {
          isValidTxType = true;
        }
        break;
      // if the transaction type is 'check'
      case 'check':
        responseMessage = `Account balance: ${this.state[tx.from].balance}`;
        isValidTxType = true;
        break;
      // if the transaction type is 'send'
      case 'send':
        {
          responseMessage = 'Not enough balance';
          const currentBalance = this.state[tx.from].balance;
          // check that the transaction amount is positive and the sender has an account balance greater than or equal to the transaction amount
          if (currentBalance > 0 && currentBalance >= tx.amount) {
            isValidTxType = true;
          }
        }
        break;
      default:
        responseMessage = 'Invalid transaction type';
    }
    // if the check fails, print an error to the concole stating why and return false so that the transaction is not processed
    if (!isValidTxType) {
      console.error(responseMessage);
    } else if (responseMessage) {
      // print the balance of the sender to the console
      console.log(responseMessage);
    }
    return isValidTxType;
  }

  // Checks if a transaction is valid, adds it to the transaction history, and updates the state of accounts and balances
  checkTx(tx) {
    // check that the transaction signature is valid
    // check that the transaction sender and receiver are in the state
    // check that the transaction type is valid
    // if all checks pass return true
    // if any checks fail return false
    return this.checkTxSignature(tx) && this.checkUserAddress(tx) && this.checkTxType(tx);
  }

  // Updates account balances according to a transaction and adds the transaction to the history
  applyTx(tx) {
    // decrease the balance of the transaction sender/signer
    this.state[this.tx.from].balance -= tx.amount;
    // increase the balance of the transaction receiver
    this.state[this.tx.to].balance += tx.amount;
    // add the transaction to the transaction history
    this.txHistory.push(tx);
    // return true once the transaction is processed
    return true;
  }

  // Process a transaction
  processTx(tx) {
    // check the transaction is valid
    if (this.checkTx(tx)) {
      // apply the transaction to Paypal's state
      this.apply(tx);
    }
  }
}

module.exports = Paypal;
