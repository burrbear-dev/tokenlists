export default {
  name: 'berachain',
  rpc: `https://rpc.berachain.com`,
  coingecko: {
    platformId: 'berachain',
  },
  // at the time of writing the trust wallet folder for berachain is not yet available
  // so we're using the ethereum folder for now
  // @see https://github.com/trustwallet/assets/tree/master/blockchains
  trustWalletNetwork: 'ethereum',
  addresses: {
    multicaller: '0xcA11bde05977b3631167028862bE2a173976CA11',
  },
}
