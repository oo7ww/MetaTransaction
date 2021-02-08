/* eslint-env node, mocha */
/* global artifacts, contract, expect, web3 */
/* eslint no-underscore-dangle: 1 */
const BigNumber = web3.utils.BN

const ERC20 = artifacts.require('./Mocks/MockToken.sol')

contract('ERC20 with MetaTransaction', (accounts) => {
  const [signer] = accounts
  // will pay the blockchain fees in behalf of the signer
  const [,miner] = accounts
  // whoever as receiver for MockToken
  const [,,whoever] = accounts

  const tokenName = 'MockToken'
  const tokenSymbol = 'ERC20'
  const initialTotalSupply = web3.utils.toWei('10000000000000000000')
  const decimals = 18

  describe('Delegated calls', () => {
    let MockTokenInstance
    
    describe('send tx with a reward', async () => {
      beforeEach(async () => {
        // deploy mock token
        MockTokenInstance = await ERC20.new(
          tokenName,
          tokenSymbol,
          decimals,
          initialTotalSupply,
          { from: signer },
        )
        await MockTokenInstance.mint(signer, web3.utils.toWei('100'), { from: signer })
        await MockTokenInstance.mint(MockTokenInstance.address, web3.utils.toWei('100'), { from: signer })
      })
      describe('meta transaction', async () => {
        it('Should be possible to send ERC20 token without paying any fee by the signer', async () => {
          const REWARD = new BigNumber(web3.utils.toWei('10'))

          const initialSignerETHBalance = await web3.eth.getBalance(signer)
          
          // create the approve transaction

          // meta TX allowance VALUE FIELD
          const TransactionValue = new BigNumber('10')

          // meta TX NONCE FIELD (TAKEN FROM PROXY NONCE COUNTER)
          const signerNonce = new BigNumber(await MockTokenInstance.replayNonce.call(signer))

          const messageToBeHashed = [ 
            MockTokenInstance.address,
            whoever, 
            web3.utils.toTwosComplement(TransactionValue),
            web3.utils.toTwosComplement(signerNonce),
            web3.utils.toTwosComplement(REWARD),
          ]

          const messageHashed = web3.utils.soliditySha3(...messageToBeHashed)

          const messageHashedByContract = await MockTokenInstance.metaApproveHash.call(
            messageToBeHashed[1],
            messageToBeHashed[2],
            messageToBeHashed[3],
            messageToBeHashed[4],
          )

          expect(messageHashed).to.equal(messageHashedByContract)

          const messageSigned = await web3.eth.sign(messageHashed, signer)

          const GasEstimation = new BigNumber(
            await MockTokenInstance.metaApprove.estimateGas(
              whoever,
              TransactionValue.toString(),
              signerNonce.toString(),
              REWARD.toString(),
              messageSigned,
            ),
          )
          
          await MockTokenInstance.metaApprove(
            whoever,
            TransactionValue.toString(),
            signerNonce.toString(),
            REWARD.toString(),
            messageSigned,
            { from: miner},
          )

          const finalSignerETHBalance = await web3.eth.getBalance(signer)

          expect(finalSignerETHBalance).to.equal(initialSignerETHBalance)

          const allowance = await MockTokenInstance.allowance.call(signer, whoever);

          expect(allowance.toString()).to.equal(TransactionValue.toString())

          const finalMinerTokenBalance = await MockTokenInstance.balanceOf.call(miner, { from: whoever })

          expect(finalMinerTokenBalance.toString()).to.equal(REWARD.toString())

        })
      })
    })
  })
})
