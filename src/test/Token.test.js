import { tokens, EVM_REVERT } from './helpers'
//imports from the helpers file

const Token = artifacts.require('./Token')
//calls the token

require('chai')
	.use(require('chai-as-promised'))
	.should()



contract('Token', ([deployer, receiver, exchange]) => {
//call callback function that calls the account in our personal blockchain this is done through the network in truffle-config.js
	const name = 'Charity Token'
	const symbol = 'KU'
	const decimals = '18'
	const totalSupply = tokens(1000000).toString()
	let token

	beforeEach(async() => {
		token = await Token.new()
	})
	//Fetch token from blockchain

	describe('deployment', () =>{
		//Tracks the name	
		it('tracks the name', async () => {
			const result = await token.name()
			//Reads token name here...
			result.should.equal(name)
			//The token name is 'Bilaal'
		})
		
		//Tracks the symbol
		it('tracks the symbol', async () =>{
			const result = await token.symbol()
			result.should.equal(symbol)

		})

		//Tracks the decimal
		it('tracks the decimals', async () =>{
			const result = await token.decimals()
			result.toString().should.equal(decimals)

		})
		//Tracks the total supply
		it('tracks the total supply', async () =>{
			const result = await token.totalSupply()
			result.toString().should.equal(totalSupply.toString())

		})

		it('assigns the total supply to the deployer', async () => {
			const result = await token.balanceOf(deployer)
			result.toString().should.equal(totalSupply.toString())
		})
	})
	

	describe('sending tokens', () => {
		// Declare variable amount
		let amount
		// Declare variable result
		let result

		// if successful
		describe('success', async () => {
			
			beforeEach(async() => {
			amount = tokens(100)
			//transfer
			result = await token.transfer(receiver, amount, {from: deployer})	
		})

		it('transfers token balances', async() => {
			//After Transfer
			let balanceOf
			balanceOf = await token.balanceOf(deployer)
			balanceOf.toString().should.equal(tokens(999900).toString())
			balanceOf = await token.balanceOf(receiver)
			balanceOf.toString().should.equal(tokens(100).toString())
		})

		it('emits the Transfer event', async() => {
			const log = result.logs[0]
			//result for the before each statement above after "awaiting" for the transfer for to happen
			log.event.should.equal('Transfer')
			// To check that is correct
			const event = log.args
			event.from.toString().should.equal(deployer, 'from is correct')
			event.to.should.equal(receiver, 'to is correct')
			event.value.toString().should.equal(amount.toString(), 'value is correct')
		})
		// calls the event
		})
		// ^ success })

		describe('failure', async() => {

			it('rejects insufficient balances', async () => {
				// insufficient balance error
				let invalidAmount
				invalidAmount = tokens(100000000) // 100 million - greater then the total supply
				await token.transfer(receiver, invalidAmount, { from: deployer } ).should.be.rejectedWith(EVM_REVERT) // error message
				
				// Attempt transfer tokens, when you have none
				invalidAmount = tokens(10) // recipients has no tokens
				await token.transfer(deployer, invalidAmount, { from: receiver } ).should.be.rejectedWith(EVM_REVERT)
			})
			// ^ insufficient balances })

			it('rejects invalid recipients', async() =>{
				// invalid recipient error
				await token.transfer(0x0, amount, { from: deployer }).should.be.rejected
			})

		}) 
		// ^ failure })
	})
	// ^ sending token })	*/


	describe('approving tokens', () => {
		let result
		let amount

		beforeEach(async () => {
			amount = tokens(100)
			result = await token.approve(exchange, amount, { from: deployer })
		})

		describe('success', () => {
			it('allocates an allowance for token spending on exchange', async() => {
				const allowance = await token.allowance(deployer, exchange)
				// Want is the allowance for the exchange that we approve
				allowance.toString().should.equal(amount.toString())
			})

			it('emits an Approval event', async () => {
				const log = result.logs[0]
				log.event.should.equal('Approval')
				const event = log.args
				event.owner.toString().should.equal(deployer, 'owner is correct')
				event.spender.should.equal(exchange, 'spender is correct')
				event.value.toString().should.equal(amount.toString(), 'value is correct')
			})
		})

		describe('failure', () => {
			it('rejects invalid spenders', async() => {
				await token.approve(0x0, amount, { from: deployer }).should.be.rejected
			})
		})
	})
	// ^ approving tokens })


	describe('Authorised token transfers', () => {
		// Declare variable amount
		let amount
		// Declare variable result
		let result

		beforeEach(async () => {
			amount = tokens(100)
			// Approving the tokens
			await token.approve(exchange, amount, { from: deployer })
		})


		// if successful
		describe('success', async () => {
			
			beforeEach(async() => {
			amount = tokens(100)
			//transfer
			result = await token.transferFrom(deployer,receiver, amount, {from: exchange})	
		})

		it('transfers token balances', async() => {
			//After Transfer
			let balanceOf
			balanceOf = await token.balanceOf(deployer)
			balanceOf.toString().should.equal(tokens(999900).toString())
			balanceOf = await token.balanceOf(receiver)
			balanceOf.toString().should.equal(tokens(100).toString())
		})

		it('resets the allowance', async() => {
			const allowance = await token.allowance(deployer, exchange)
			allowance.toString().should.equal('0')
		})

		it('emits the Transfer event', async() => {
			const log = result.logs[0]
			//result for the before each statement above after "awaiting" for the transfer for to happen
			log.event.should.equal('Transfer')
			// To check that is correct
			const event = log.args
			event.from.toString().should.equal(deployer, 'from is correct')
			event.to.should.equal(receiver, 'to is correct')
			event.value.toString().should.equal(amount.toString(), 'value is correct')
		})
		// calls the event
		})
		// ^ success })

		describe('failure', async() => {
			it('rejects insufficient amounts', async() =>{
				// Attempt transfer too many tokens
				const invalidAmount = tokens(100000000)
				await token.transferFrom(deployer, receiver, invalidAmount, { from: exchange }).should.be.rejectedWith(EVM_REVERT)
			})
		})

			it('rejects invalid recipients', async() =>{
				// invalid recipient
				await token.transferFrom(deployer, 0x0, amount, { from: exchange }).should.be.rejected
			}) 
		
		// ^ failure })
	})
	// ^ sending token })	*/






})
// ^ contract })
