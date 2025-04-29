require('dotenv').config()
const { ethers, config } = require('hardhat')

const { assets } = require('./misc/addresses.json').pharos
const infiRouterAddress = require('./deployments/pharos/InfiRouter.json').address
const infiRouterAbi = require('./deployments/pharos/InfiRouter.json').abi
const provider = new ethers.providers.JsonRpcProvider(config.networks.pharos)
// Debug logging function
const InfiRouter = new ethers.Contract(
    infiRouterAddress, 
    infiRouterAbi, 
    provider
)

async function query(tknFrom, tknTo, amountIn) {
    const maxHops = 3
    const gasPrice = ethers.utils.parseUnits('225', 'gwei')
    return InfiRouter.findBestPathWithGas(
        amountIn, 
        tknFrom, 
        tknTo, 
        maxHops,
        gasPrice,
        { gasLimit: 1e9 }
    )
}
    
async function swap(signer, tknFrom, tknTo, amountIn) {
    try {
        const queryRes = await query(tknFrom, tknTo, amountIn)
        console.log("queryRes", queryRes)
        const amountOutMin = queryRes.amounts[queryRes.amounts.length-1]
        const fee = 0

        const tokenContract = new ethers.Contract(
            tknFrom, 
            [
                "function approve(address spender, uint256 amount) public returns (bool)",
                "function allowance(address owner, address spender) external view returns (uint256)"
            ],
            signer
        )
        
        const currentAllowance = await tokenContract.allowance(signer.address, infiRouterAddress);
        const tknFromSymbol = Object.keys(assets).find(key => assets[key].toLowerCase() === tknFrom.toLowerCase()) || 'TokenIn';
        console.log(`Current allowance for InfiRouter: ${ethers.utils.formatUnits(currentAllowance, 18)} ${tknFromSymbol}`);

        if (currentAllowance.lt(amountIn)) {
            console.log(`Approving InfiRouter to spend ${ethers.utils.formatUnits(amountIn, 18)} ${tknFromSymbol}...`);
            const approveTx = await tokenContract.approve(infiRouterAddress, amountIn, {
                 gasLimit: 100000,
                 gasPrice: ethers.utils.parseUnits("1", 'gwei')
            });
            await approveTx.wait();
            console.log("Approval successful, tx hash:", approveTx.hash);
        } else {
            console.log("Sufficient allowance already granted.");
        }

        console.log("Executing swap...");
        const swapTx = await InfiRouter.connect(signer).swapNoSplit(
            [
                amountIn, 
                amountOutMin,
                queryRes.path,
                queryRes.adapters
            ],
            signer.address, 
            fee,
            { gasLimit: 5000000, gasPrice: ethers.utils.parseUnits("1", 'gwei') } 
        );
        
        console.log("Swap transaction submitted, waiting for confirmation:", swapTx.hash);
        const receipt = await swapTx.wait();
        console.log("Swap transaction confirmed:", receipt);
        return receipt;
        
    } catch (error) {
        console.error("\nError during swap execution:");
        if (error.reason) {
            console.error("Reason:", error.reason);
        }
        if (error.receipt) {
            console.error("Receipt:", error.receipt);
        } else if (error.transactionHash) {
             console.error("Transaction Hash:", error.transactionHash);
        }
        console.error("Full Error:", error);
    }
}

async function exampleQuery() {
    const amountIn = ethers.utils.parseUnits('10', 18);
    const tknFrom = assets.DEVNET;
    const tknTo = assets.PIKACHU;
    const tokenOutDecimals = 18;

    console.log(`Querying best path for ${ethers.utils.formatUnits(amountIn, 18)} ${Object.keys(assets).find(key => assets[key].toLowerCase() === tknFrom.toLowerCase()) || 'TokenIn'} -> ${Object.keys(assets).find(key => assets[key].toLowerCase() === tknTo.toLowerCase()) || 'TokenOut'}...`);

    try {
        const r = await query(tknFrom, tknTo, amountIn);
        console.log("\nRaw Query Result:", r);

        if (r && r.amounts && r.amounts.length > 0) {
            const estimatedAmountOutWei = r.amounts[r.amounts.length - 1];
            const estimatedAmountOutFormatted = ethers.utils.formatUnits(estimatedAmountOutWei, tokenOutDecimals);
            const tknToSymbol = Object.keys(assets).find(key => assets[key].toLowerCase() === tknTo.toLowerCase()) || 'TokenOut';

            console.log(`\n---> Estimated amount out: ${estimatedAmountOutFormatted} ${tknToSymbol}`);
            console.log(`     Path found: ${r.path.join(' -> ')}`);
            console.log(`     Adapters used: ${r.adapters.join(', ')}`);
        } else {
            console.log("\nQuery did not return expected amounts.");
        }
    } catch (error) {
        console.error("\nError during query execution:", error);
    }
}

async function exampleSwap() {
    const signer = new ethers.Wallet(process.env.PHAROS_PK_DEPLOYER, provider)
    const amountIn = ethers.utils.parseUnits('10', 18)
    const tknFrom = assets.DEVNET
    const tknTo = assets.PIKACHU
    const r = await swap(signer, tknFrom, tknTo, amountIn)
    // Result of swap is just the receipt now, logged inside swap or its catch block
    // console.log(r) // Can optionally log the receipt here if needed
}

exampleQuery();
// exampleSwap()   