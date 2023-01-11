export const ETHER_ADDRESS = '0x0000000000000000000000000000000000000000'




export const EVM_REVERT = 'VM Exception while processing transaction: revert'
// error message

export const ether = (n) => {
	return new web3.utils.BN(
	web3.utils.toWei(n.toString(), 'ether')
	// same decimals like ether e.g 18
	)
}


// same as ether
export const tokens = (n) => ether(n)
