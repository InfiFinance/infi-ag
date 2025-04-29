require('dotenv').config();
require("@nomiclabs/hardhat-etherscan");
require("@nomiclabs/hardhat-waffle");
require('hardhat-contract-sizer');
require('hardhat-deploy-ethers');
require('hardhat-abi-exporter');
require("hardhat-gas-reporter");
require('hardhat-log-remover');
require("hardhat-tracer");
require('hardhat-deploy');


const PHAROSSCAN_API_KEY = getEnvValSafe('PHAROSSCAN_API_KEY', false)
const PHAROS_PK_DEPLOYER = getEnvValSafe('PHAROS_PK_DEPLOYER')
const PHAROS_RPC = getEnvValSafe('PHAROS_RPC')

function getEnvValSafe(key, required=true) {
  const endpoint = process.env[key];
  if (!endpoint && required)
      throw(`Missing env var ${key}`);
  return endpoint
}

module.exports = {
  mocha: {
    timeout: 1e6,
    recursive: true,
    spec: ['test/*.spec.js']
  },
  solidity: {
      version: "0.8.4", 
      settings: {
        optimizer: {
          enabled: true,
          runs: 999
        }  
      }
  },
  namedAccounts: {
    deployer: {
      default: 0,
    }
  },
  etherscan: {
    apiKey: PHAROSSCAN_API_KEY,
    customChains: [
      {
        network: "pharos",
        chainId: 50002,
        urls: {
          apiURL: "https://pharosscan.xyz/api",
          browserURL: "https://pharosscan.xyz"
        }
     }
    ]
  },
  defaultNetwork: 'pharos',
  networks: {
    pharos: {
      chainId: 50002,
      url: PHAROS_RPC,
      accounts: [ PHAROS_PK_DEPLOYER ],
    }
  },
  paths: {
    deployments: './src/deployments',
    artifacts: "./src/artifacts",
    sources: "./src/contracts",
    deploy: './src/deploy',
    cache: "./src/cache",
    tests: "./src/test"
  },
  abiExporter: {
    path: './abis',
    clear: true,
    flat: true
  },
  contractSizer: {
    disambiguatePaths: false,
    runOnCompile: false,
    alphaSort: false,
  },
  gasReporter: {
    showTimeSpent: true, 
    enabled: false,
    gasPrice: 225
  }
};