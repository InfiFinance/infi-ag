const { 
    pharos: pha
} = require('./addresses.json')

module.exports = {
    "pharos": {
        adapterWhitelist: [
            'UniswapV3Adapter'
        ],
        hopTokens: [
            pha.assets.GOCTO,
            pha.assets.PHAROS,
            pha.assets.USDC,
            pha.assets.INFI,
        ],
        wnative: pha.assets.WETH
    }
}