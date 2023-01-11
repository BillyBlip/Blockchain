import { tokens, EVM_REVERT, ETHER_ADDRESS, ether } from './helpers'
//imports from the helpers file

const Token = artifacts.require('./Token')
//calls the token

const Exchange = artifacts.require('./Exchange')
//calls the exchange

require('chai')
	.use(require('chai-as-promised'))
	.should()



contract('Exchange', ([deployer, feeAccount, user1, user2]) => {
//call callback function that calls the account in our personal blockchain this is done through the network in truffle-config.js
	let exchange
	let token
	const feePercent = 10

	beforeEach(async() => {
		token = await Token.new()
		// Deploy Token

		token.transfer(user1, tokens(100), { from: deployer })
		// Transfers Some Tokens to user1

		exchange = await Exchange.new(feeAccount, feePercent)
		// Deploy Exchange
	})

	describe('deployment', () =>{
		//Tracks the name	
		it('tracks the fee account', async () => {
			const result = await exchange.feeAccount()
			//Reads Exchange fee account...
			result.toString().should.equal(feeAccount)
		})

		it('tracks the fee percent', async () => {
			const result = await exchange.feePercent()
			//Reads Exchange fee percentage...
			result.toString().should.equal(feePercent.toString())
		})
	})

	describe('fallback', () => {
		it('reverts when Ether is sent', async () => {
			await exchange.sendTransaction({value: 1, from: user1}).should.be.rejectedWith(EVM_REVERT)
		})
	})

	describe('deposit Ether', async() => {
		let result
		let amount

		beforeEach(async () => {
			amount = ether(1)
			result = await exchange.depositEther({ from: user1, value: ether(1)})
		})

		it('tracks the ether deposit', async () => {
			const balance = await exchange.tokens(ETHER_ADDRESS, user1)
			balance.toString().should.equal(amount.toString())
		})

		it('emits the Deposit event', async() => {
		const log = result.logs[0]
		//result for the before each statement above after "awaiting" for the transfer for to happen
		log.event.should.equal('Deposit')
		// To check that is correct
		const event = log.args
		event.token.toString().should.equal(ETHER_ADDRESS, 'token is correct')
		event.user.should.equal(user1, 'user address is correct')
		event.amount.toString().should.equal(amount.toString(), 'value is correct')
		event.balance.toString().should.equal(amount.toString(), 'value is correct')
		})
	})

	describe('withdrawing Ether', async() => {

		let result
		let amount

		beforeEach(async() => {
			amount = ether(1)
			await exchange.depositEther({from: user1, value: amount})
		})

		describe('success', async() => {
			beforeEach(async() => {
				result = await exchange.withdrawEther(amount, {from: user1})

			})

			it('withdraws Ether funds', async() => {
				const balance = await exchange.tokens(ETHER_ADDRESS, user1)
				balance.toString().should.equal('0')
			})

			it('emits a Withdraw event', async() => {
				const log = result.logs[0]
				//result for the before each statement above after "awaiting" for the transfer for to happen
				log.event.should.equal('Withdraw')
				// To check that is correct
				const event = log.args
				event.token.toString().should.equal(ETHER_ADDRESS)
				event.user.should.equal(user1)
				event.amount.toString().should.equal(amount.toString())
				event.balance.toString().should.equal('0')
			})
		})

		describe('failure', async() => {
			it('rejects withdraws for insufficent balances', async() => {
				await exchange.withdrawEther(ether(100), { from: user1 }).should.be.rejectedWith(EVM_REVERT)
			})
		})
	})

	describe('depositing tokens', () => {
		let result
		let amount

		describe('success', () => {
			beforeEach(async() => {
			amount = tokens(10)
			await token.approve(exchange.address, amount, { from: user1})
			// approve tokens for us
			// allow exchange to send tokens on our behalf
			// ***** SECURITY ISSUE *****
			result = await exchange.depositToken(token.address, amount, { from: user1 })
			// deposit the tokens
		})
			it('tracks the token deposit', async() => {
				let balance 
				balance = await token.balanceOf(exchange.address)
				balance.toString().should.equal(amount.toString())
				// check tokens on exchange
				balance = await exchange.tokens(token.address, user1)
				balance.toString().should.equal(amount.toString())

			})

			it('emits the Deposit event', async() => {
				const log = result.logs[0]
				//result for the before each statement above after "awaiting" for the transfer for to happen
				log.event.should.equal('Deposit')
				// To check that is correct
				const event = log.args
				event.token.toString().should.equal(token.address, 'token is correct')
				event.user.should.equal(user1, 'user address is correct')
				event.amount.toString().should.equal(amount.toString(), 'value is correct')
				event.balance.toString().should.equal(amount.toString(), 'value is correct')
			})
		})


		describe('failure', () => {
			it('rejects Ether deposits', async () => {
				await exchange.depositToken(ETHER_ADDRESS, tokens(10), { from: user1 }).should.be.rejectedWith(EVM_REVERT);

			})

			it('fails when no tokens are approved', async() => {
				// Don't approve any tokens before depositing
				await exchange.depositToken(token.address, tokens(10), { from: user1 }).should.be.rejectedWith(EVM_REVERT)
			})
			
		})
	})

	describe('withdrawing tokens', async() => {

		let amount
		let result

		describe('success', async() => {
			beforeEach(async() => {
			
				//deposit tokens first
				amount = tokens(10);
				await token.approve(exchange.address, amount, {from: user1})
				await exchange.depositToken(token.address, amount, {from: user1})
			
				// withdraw tokens

				result = await exchange.withdrawToken(token.address, amount, {from: user1})
			})
			it('withdraws tokens', async() => {
				const balance = await exchange.tokens(token.address, user1)
				balance.toString().should.equal('0')
			})

			it('emits a Withdraw event', async() => {
				const log = result.logs[0]
				//result for the before each statement above after "awaiting" for the transfer for to happen
				log.event.should.equal('Withdraw')
				// To check that is correct
				const event = log.args
				event.token.toString().should.equal(token.address)
				event.user.should.equal(user1)
				event.amount.toString().should.equal(amount.toString())
				event.balance.toString().should.equal('0')
			})
		})

		describe('failure', async() => {
			it('rejects Ether withdraws', async() => {
				await exchange.withdrawToken(ETHER_ADDRESS, amount, { from: user1 }).should.be.rejectedWith(EVM_REVERT)
			})

			it('fails for insufficent funds', async() => {
				await exchange.withdrawToken(token.address, amount, { from: user1 }).should.be.rejectedWith(EVM_REVERT)
			})
		})
	})

	describe('checking balances', async() => {
		beforeEach(async() => {
			exchange.depositEther({ from: user1, value: ether(1)})
		})

		it('returns user balance', async() => {
			const result = await exchange.balanceOf(ETHER_ADDRESS, user1)
			result.toString().should.equal(ether(1).toString())
		})
	})

	describe('making orders', async() => {
		let result

		beforeEach(async() => {
			result = await exchange.makeOrder(token.address, tokens(1), ETHER_ADDRESS, ether(1), { from: user1 })
		})

		it('tracks the newly created order', async() => {
			const orderCount = await exchange.orderCount()
			orderCount.toString().should.equal('1')
			const order = await exchange.orders('1')
			order.id.toString().should.equal('1', 'is correct')
			order.user.should.equal(user1, 'user is correct')
			order.tokenGet.should.equal(token.address, 'tokenGet is correct')
			order.amountGet.toString().should.equal(tokens(1).toString(), 'amountGet is correct')
			order.tokenGive.should.equal(ETHER_ADDRESS, 'tokenGive is correct')
			order.amountGive.toString().should.equal(ether(1).toString(), 'amountGive is correct')
			order.timestamp.toString().length.should.be.at.least(1, 'timestamp is present')
		})

		it('emits an Order event', async() => {
			const log = result.logs[0]
			log.event.should.equal('Order')
			const event = log.args
			event.id.toString().should.equal('1', 'is correct')
			event.user.should.equal(user1, 'user is correct')
			event.tokenGet.should.equal(token.address, 'tokenGet is correct')
			event.amountGet.toString().should.equal(tokens(1).toString(), 'amountGet is correct')
			event.tokenGive.should.equal(ETHER_ADDRESS, 'tokenGive is correct')
			event.amountGive.toString().should.equal(ether(1).toString(), 'amountGive is correct')
			event.timestamp.toString().length.should.be.at.least(1, 'timestamp is present')

		})
	})	

	describe('order actions', async() => {

		beforeEach(async() => {
			// User deposits ether
			await exchange.depositEther({ from: user1, value: ether(1) })
			// give tokens to user2 
			await token.transfer(user2, tokens(100), { from: deployer })
			// user2 deposits tokens only
			await token.approve(exchange.address, tokens(2), { from: user2 })
			await exchange.depositToken(token.address, tokens(2), { from: user2})
			// user1 makes an order to buy tokens with Ether
			await exchange.makeOrder(token.address, tokens(1), ETHER_ADDRESS, ether(1), { from: user1 })
		})

		describe('filling orders', async() => {
			let result

			describe('success', async () => {
				beforeEach(async () => {
					// user2 fills order
					result = await exchange.fillOrder('1', { from: user2 })
				})

				it('executes the trade & charges fees', async () => {
					let balance
					balance = await exchange.balanceOf(token.address, user1)
					balance.toString().should.equal(tokens(1).toString(), 'user1 recieved tokens')
					balance = await exchange.balanceOf(ETHER_ADDRESS, user2)
					balance.toString().should.equal(ether(1).toString(), 'user2 recieved ether')
					balance = await exchange.balanceOf(ETHER_ADDRESS, user1)
					balance.toString().should.equal('0', 'user1 Ether deducted')
					balance = await exchange.balanceOf(token.address, user2)
					balance.toString().should.equal(tokens(0.9).toString(), 'user2 tokens deducted with fee applied')
					const feeAccount = await exchange.feeAccount()
					balance = await exchange.balanceOf(token.address, feeAccount)
					balance.toString().should.equal(tokens(0.1).toString(), 'feeAccount reveived fee')
				})

				it('updates filled orders', async() => {
					const orderFilled = await exchange.orderFilled(1)
					orderFilled.should.equal(true)
				})

				it('emits a Trade event', async() => {
					const log = result.logs[0]
					log.event.should.equal('Trade')
					const event = log.args
					event.id.toString().should.equal('1', 'id is correct')
					event.user.should.equal(user1, 'user is corrcet')
					event.tokenGet.should.equal(token.address, 'tokenGet is correct')
					event.amountGet.toString().should.equal(tokens(1).toString(), 'amountGet is correct')
					event.tokenGive.should.equal(ETHER_ADDRESS, 'tokenGive is correct')
					event.amountGive.toString().should.equal(ether(1).toString(), 'amountGive is correct')
					event.userFill.should.equal(user2, 'userFill is correct')
					event.timestamp.toString().length.should.be.at.least(1, 'timestamp is present')

				})
			})

			describe('failure', async() => {

				it('rejects invalid order ids', async() => {
					const invalidOrderId = 99999
					await exchange.fillOrder(invalidOrderId, {from: user2 }).should.be.rejectedWith(EVM_REVERT)
				})

				it('rejects already-filled orders', async() => {
					// Fill the order
					await exchange.fillOrder('1', { from: user2 }).should.be.fulfilled
					// Try to fill again
					await exchange.fillOrder('1', { from: user2 }).should.be.rejectedWith(EVM_REVERT)
				})

				it('rejects cancelled orders', async () => {
					// Cancel the order
					await exchange.cancelOrder('1', { from: user1 }).should.be.fulfilled
					// Try ro fill the order
					await exchange.fillOrder('1', { from: user2 }).should.be.rejectedWith(EVM_REVERT)
				})
			})

		})

		describe('cancelling orders', async() => {
			let result

			describe('success', async() => {
				beforeEach(async() => {
					result = await exchange.cancelOrder('1', { from: user1 })
				})

				it('updates cancelled orders', async() => {
					const orderCancelled = await exchange.orderCancelled(1)
					orderCancelled.should.equal(true)
				})

				it('emits an Cancel event', async() => {
					const log = result.logs[0]
					log.event.should.equal('Cancel')
					const event = log.args
					event.id.toString().should.equal('1', 'is correct')
					event.user.should.equal(user1, 'user is correct')
					event.tokenGet.should.equal(token.address, 'tokenGet is correct')
					event.amountGet.toString().should.equal(tokens(1).toString(), 'amountGet is correct')
					event.tokenGive.should.equal(ETHER_ADDRESS, 'tokenGive is correct')
					event.amountGive.toString().should.equal(ether(1).toString(), 'amountGive is correct')
					event.timestamp.toString().length.should.be.at.least(1, 'timestamp is present')

				})
			})

			describe('failure', async () => {
				it('rejects invalid order ids', async() => {
					const invalidOrderId = 99999
					await exchange.cancelOrder(invalidOrderId, { from: user1 }).should.be.rejectedWith(EVM_REVERT)
				})

				it('rejects unauthorized cancelations', async() => {
					// Trys to cancel the order from another user
					await exchange.cancelOrder('1', { from: user2 }).should.be.rejectedWith(EVM_REVERT)
				})

			})
		})
	})
})
