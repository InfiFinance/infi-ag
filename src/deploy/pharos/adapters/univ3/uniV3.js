const { deployAdapter, addresses } = require("../../../utils");
const { factory, quoter } = addresses.pharos.uniV3;

const networkName = "pharos";
const contractName = "UniswapV3Adapter";
const tags = ["uniswapV3"];
const name = contractName;
const gasEstimate = 5_000_000;
const quoterGasLimit = 20_000_000;
const defaultFees = [100, 500, 3_000, 10_000];
const args = [name, gasEstimate, quoterGasLimit, quoter, factory, defaultFees];

module.exports = deployAdapter(networkName, tags, contractName, contractName, args);