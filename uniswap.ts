import { ethers, WebSocketCreator } from "ethers";
import * as dotenv from "dotenv";

// Load environment variables (e.g., Infura, Alchemy API key)
dotenv.config();

// Replace with your provider and wallet private key
const provider = new ethers.WebSocketProvider(process.env.ALCHEMY_WEBSOCKET_URL as string);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY as string, provider);

// ABI for Uniswap V3 Pool
const UNISWAP_V3_POOL_ABI = [
  // Swap event (used for listening to swaps)
  "event Swap(address indexed sender, address indexed recipient, int256 amount0, int256 amount1, uint160 sqrtPriceX96, uint128 liquidity, int24 tick)",
  // Other relevant functions/events can be added as needed
];

// Replace this with the actual Uniswap V3 pool address for the token pair you are tracking
const UNISWAP_V3_POOL_ADDRESS = '0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640';

// The contract object to interact with the Uniswap pool
const uniswapPoolContract = new ethers.Contract(UNISWAP_V3_POOL_ADDRESS, UNISWAP_V3_POOL_ABI, provider);

// Replace this with your own smart contract's address and ABI
const CONTRACT_ABI = [
    {
        constant: false,
        inputs: [],
        name: 'releaseAllowance',
        outputs: [],
        payable: false,
        stateMutability: 'nonpayable',
        type: 'function',
      },
  // ABI of your smart contract, including the function that triggers the sell
  "function sell() external",
];

const dealerContract = new ethers.Contract(process.env.CONTRACT_ADDRESS as string, CONTRACT_ABI, wallet);

// Listen for upcoming Uniswap swaps
uniswapPoolContract.on("Swap", async (sender: string, recipient: string, amount0: BigInt, amount1: BigInt, sqrtPriceX96: BigInt, liquidity: BigInt, tick: number) => {
  try {
   
    console.log(`Swap amount0:${amount0} amount1:${amount1} sqrtPriceX96:${sqrtPriceX96} liquidity:${liquidity} tick:${tick}`);

    // Fetch token prices or profit estimation logic (example logic, replace with your own strategy)
    const isProfitable = await checkIfProfitable(amount0, amount1);

    if (isProfitable) {
      console.log("Profit detected! Executing sell...");

      // Call your smart contract's sell function
      const tx = await dealerContract.sell();
      console.log("Sell transaction hash:", tx.hash);

      // Wait for the transaction to be confirmed
      await tx.wait();
      console.log("Sell executed successfully.");
    } else {
      console.log("Not profitable. Skipping sell.");
    }
  } catch (error) {
    console.error("Error processing the swap:", error);
  }
});

// Example profit check function
async function checkIfProfitable(amount0: BigInt, amount1: BigInt): Promise<boolean> {
  // Implement your own logic here, this could include checking current prices on-chain
  // or via an external oracle, e.g., Chainlink, or calculating the value of the swapped tokens.
  const currentPrice = await getCurrentPrice(); // Get the price of the token pair from an oracle
  const profitThreshold = 0.01; // Set a minimum profit threshold (1%)

  // For simplicity, assume amount0 is the token you're selling
  // const profit = amount0 * (currentPrice).sub(amount1); // Example profit calculation
  return false; // profit - (ethers.parseUnits(profitThreshold.toString(), 18)); // Replace 18 with appropriate decimals
}

// Fetch current price of token pair from Chainlink, Uniswap or another source
async function getCurrentPrice(): Promise<BigInt> {
  // Replace this with an actual price fetching mechanism
  return ethers.parseUnits("1.5", 18); // Example price
}