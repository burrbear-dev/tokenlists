import { Configs, Network } from '../types'
import arbitrum from './arbitrum'
import artio from './artio'
import avalanche from './avalanche'
import base from './base'
import ethereum from './ethereum'
import fantom from './fantom'
import gnosis from './gnosis'
import optimism from './optimism'
import polygon from './polygon'
import sepolia from './sepolia'
import zkevm from './zkevm'

const config: Configs = {
  [Network.Arbitrum]: arbitrum,
  [Network.Avalanche]: avalanche,
  [Network.Base]: base,
  [Network.Gnosis]: gnosis,
  [Network.Ethereum]: ethereum,
  [Network.Optimism]: optimism,
  [Network.Polygon]: polygon,
  [Network.Sepolia]: sepolia,
  [Network.Zkevm]: zkevm,
  [Network.Fantom]: fantom,
  [Network.Artio]: artio,
}

export default config
