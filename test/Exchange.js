const { expect } = require('chai');
const { ethers } = require('hardhat');

const tokens = (n) => {
  return ethers.utils.parseUnits(n.toString(), 'ether')
}

describe('Exchange', () => {
  let deployer, feeAccount, exchange

  const feePercent = 10

  beforeEach(async () => {
    const Exchange = await ethers.getContractFactory('Exchange') //pass in the name of smart contract to get byte code (deployment prep)
    const Token = await ethers.getContractFactory('Token') //pass in the name of smart contract to get byte code (deployment prep)

    token1 = await Token.deploy('Cutie Token <3', 'QT', '1000000')

    accounts = await ethers.getSigners()
    deployer = accounts[0]
    feeAccount = accounts[1]
    user1 = accounts[2]

    let transaction = await token1.connect(deployer).transfer(user1.address, tokens(100))
    await transaction.wait()

    exchange = await Exchange.deploy(feeAccount.address, feePercent) //deploy the byte code
  })

  describe('Deployment', () => {

    it('tracks the fee account', async () => {
      expect(await exchange.feeAccount()).to.equal(feeAccount.address)
    })

    it('tracks the fee percent', async () => {
      expect(await exchange.feePercent()).to.equal(feePercent)
    })
  })

  describe('DEPOSITING TOKENS', () => {
    let transaction, result
    let amount = tokens(10)

    describe('Success', async () => {
      beforeEach(async () => {
        //approve token
        transaction = await token1.connect(user1).approve(exchange.address, amount)
        result = await transaction.wait()
        //deposit token
        transaction = await exchange.connect(user1).depositToken(token1.address,amount)
        result = await transaction.wait()
  
      })
      
        it('tracks the token deposit', async () => {
        expect(await token1.balanceOf(exchange.address)).to.be.equal(amount)
        expect(await exchange.tokens(token1.address, user1.address)).to.be.equal(amount)
        expect(await exchange.balanceOf(token1.address, user1.address)).to.be.equal(amount)
        })
      
  
      it('emits a Deposit event', async () => {
          const event = result.events[1]
          expect(await event.event).to.equal('Deposit')
  
          const args = event.args
          expect(args.token).to.equal(token1.address) 
          expect(args.user).to.equal(user1.address)
          expect(args.amount).to.equal(amount)
          expect(args.balance).to.equal(amount)
        })
      })
  
      describe('Failure', () => {
        it('fails when no tokens are approved', async () => {
          await expect(exchange.connect(user1).depositToken(token1.address, amount)).to.be.reverted
        })
      })
    })

  describe('WITHDRAWING TOKENS', () => {
    let transaction, result
    let amount = tokens(10)

    describe('Success', async () => {
      beforeEach(async () => {
        //DEPOSIT TOKENS BEFORE WITHDRAWING
        //approve token
        transaction = await token1.connect(user1).approve(exchange.address, amount)
        result = await transaction.wait()
        //deposit token
        transaction = await exchange.connect(user1).depositToken(token1.address,amount)
        result = await transaction.wait()

        //NOW WITHDRAW TOKENS
        transaction = await exchange.connect(user1).withdrawToken(token1.address,amount)
        result = await transaction.wait()
  
      })
      
        it('withdraws token funds', async () => {
        expect(await token1.balanceOf(exchange.address)).to.be.equal(0)
        expect(await exchange.tokens(token1.address, user1.address)).to.be.equal(0)
        expect(await exchange.balanceOf(token1.address, user1.address)).to.be.equal(0)
        })
      
  
      it('emits a Withdraw event', async () => {
          const event = result.events[1]
          expect(await event.event).to.equal('Withdraw')
  
          const args = event.args
          expect(args.token).to.equal(token1.address) 
          expect(args.user).to.equal(user1.address)
          expect(args.amount).to.equal(amount)
          expect(args.balance).to.equal(0)
      })
    })
  
    describe('Failure', () => {
      it('fails for insufficient balances', async () => {
        //attempt to withdraw tokens without depositing
        await expect(exchange.connect(user1).withdrawToken(token1.address, amount)).to.be.reverted
      })
    })
  })

  describe('CHECKING BALANCES', () => {
    let transaction, result
    let amount = tokens(1)

    beforeEach(async () => {
      //approve token
      transaction = await token1.connect(user1).approve(exchange.address, amount)
      result = await transaction.wait()
      //deposit token
      transaction = await exchange.connect(user1).depositToken(token1.address,amount)
      result = await transaction.wait()
    })

    it('returns user balance', async () => {
      expect(await exchange.balanceOf(token1.address, user1.address)).to.equal(amount)
    })    


  })
})
