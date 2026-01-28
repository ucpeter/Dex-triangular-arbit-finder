// server.js - Fixed Arbitrage Scanner
// Real-time Uniswap V3 Arbitrage Scanner with Proper Token Amount Handling

const express = require('express');
const cors = require('cors');
const { ethers } = require('ethers');
const axios = require('axios'); // For fetching token prices
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Serve static frontend files
app.use(express.static('public'));
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

// Configuration
const NETWORKS = {
  arbitrum: {
    name: 'Arbitrum',
    chainId: 42161,
    rpc: process.env.ARBITRUM_RPC || 'https://arb1.arbitrum.io/rpc',
    quoter: '0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6',
    factory: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
    nativeToken: 'ETH',
    wrappedNative: 'WETH',
    explorer: 'https://arbiscan.io',
    tokens: {
      'WETH': { address: '0x82af49447d8a07e3bd95bd0d56f35241523fbab1', decimals: 18 },
      'USDC': { address: '0xaf88d065e77c8cc2239327c5edb3a432268e5831', decimals: 6 },
      'USDT': { address: '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9', decimals: 6 },
      'DAI': { address: '0xda10009cbd5d07dd0cecc66161fc93d7c9000da1', decimals: 18 },
      'WBTC': { address: '0x2f2a2543b76a4166549f7aab2e75bef0aefc5b0f', decimals: 8 },
      'ARB': { address: '0x912ce59144191c1204e64559fe8253a0e49e6548', decimals: 18 },
      'LINK': { address: '0xf97f4df75117a78c1a5a0dbb814af92458539fb4', decimals: 18 },
      'UNI': { address: '0xfa7f8980b0f1e64a2062791cc3b0871572f1f7f0', decimals: 18 },
      'GMX': { address: '0xfc5a1a6eb076a2c7ad06ed22c90d7e710e35ad0a', decimals: 18 },
      'CRV': { address: '0x11cdb42b0eb46d95f990bedd4695a6e3fa034978', decimals: 18 },
      'MAGIC': { address: '0x539bde0d4d63320772d99f2d1be671a7c23e7e4c', decimals: 18 },
      'SUSHI': { address: '0xd4d42f0b6def4ce0383636770ef773390d85c61a', decimals: 18 },
      'FRAX': { address: '0x17fc002b466eec40dae837fc4be5c67993ddbd6f', decimals: 18 },
      'FXS': { address: '0x9d2f299715d94d8a7e6f5eaa8e654e8c74a988a7', decimals: 18 },
      'AAVE': { address: '0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9', decimals: 18 },
      'SNX': { address: '0x8700daec35af8ff88c16bdf0418774cb3d7599b4', decimals: 18 },
      'COMP': { address: '0x354a6da4a1c414131c964d7c0b50c373e9c1a845', decimals: 18 },
      'BAL': { address: '0x040d1edc9569d4bab2d15287dc5a4f10f56a56b8', decimals: 18 },
      'LDO': { address: '0x13ad51ed4f1b7e9dc168d8a00cb3f91e71e6e8d0', decimals: 18 },
      'PEPE': { address: '0x7069e91f2e19f862c21453d753e70afeb1914318', decimals: 18 },
      'RNDR': { address: '0x2e14bf0409894809d5e2e733707698d38c400a62', decimals: 18 }
    }
  },
  polygon: {
    name: 'Polygon',
    chainId: 137,
    rpc: process.env.POLYGON_RPC || 'https://polygon-rpc.com',
    quoter: '0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6',
    factory: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
    nativeToken: 'MATIC',
    wrappedNative: 'WMATIC',
    explorer: 'https://polygonscan.com',
    tokens: {
      'WMATIC': { address: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270', decimals: 18 },
      'WETH': { address: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619', decimals: 18 },
      'USDC': { address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', decimals: 6 },
      'USDT': { address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', decimals: 6 },
      'DAI': { address: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063', decimals: 18 },
      'WBTC': { address: '0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6', decimals: 8 },
      'AAVE': { address: '0xd6df932a45c0f255f85145f286ea0b292b21c90b', decimals: 18 },
      'LINK': { address: '0xb33EaAd8d922B1083446DC23f610c2567fB5180f', decimals: 18 },
      'UNI': { address: '0x4c19596f5aaff459fa38b0f7ed92f11ae6543784', decimals: 18 },
      'CRV': { address: '0x172370d5Cd63279eFa6d502DAB29171933a610AF', decimals: 18 },
      'SUSHI': { address: '0x0b3F868E0BE5597D5DB7fB1f246656A3173BdD50', decimals: 18 },
      'QUICK': { address: '0xB5C0642510a044dA1431547651885E2599891180', decimals: 18 },
      'FRAX': { address: '0x45c32fA6DF82ead1e2EF74d17b76547EDdFfE206', decimals: 18 },
      'FXS': { address: '0x3e121107F6F22Da4911079845a470733ACFe4CA5', decimals: 18 },
      'SNX': { address: '0x50B728D8D964fd00C2d0AAD81718b71311feF68a', decimals: 18 },
      'COMP': { address: '0x8505b9d2254a7ae468c0e9dd10ccea3a837aef5c', decimals: 18 },
      'BAL': { address: '0x9a71012b13ca4d3d0cdc72a177df3ef03b0e76a3', decimals: 18 },
      'MANA': { address: '0xA1c57f48F0Deb89f569dFbe6E2B7f46D33606fD4', decimals: 18 },
      'SAND': { address: '0x3E708Fdb6E7483814C99559E224D2c41a0538E00', decimals: 18 }
    }
  }
};

// Fee tiers (0.01%, 0.05%, 0.3%, 1%)
const POOL_FEES = [100, 500, 3000, 10000];

// Contract ABIs
const QUOTER_ABI = [
  'function quoteExactInputSingle(address tokenIn, address tokenOut, uint24 fee, uint256 amountIn, uint160 sqrtPriceLimitX96) external returns (uint256 amountOut)',
  'function quoteExactInput(bytes memory path, uint256 amountIn) external returns (uint256 amountOut, uint160[] memory sqrtPriceX96AfterList)'
];

const POOL_ABI = [
  'function liquidity() external view returns (uint128)',
  'function slot0() external view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)',
  'function token0() external view returns (address)',
  'function token1() external view returns (address)',
  'function fee() external view returns (uint24)'
];

const FACTORY_ABI = [
  'function getPool(address tokenA, address tokenB, uint24 fee) external view returns (address pool)'
];

// Gas estimates (optimized)
const GAS_ESTIMATES = {
  arbitrum: {
    swapGasLimit: 60000,  // Realistic for Uniswap V3 swaps
    multicallGasLimit: 120000, // For batch quotes
    gasPriceMultiplier: 1.2, // 20% buffer
    averageGasPrice: 0.1 // Gwei
  },
  polygon: {
    swapGasLimit: 80000,
    multicallGasLimit: 150000,
    gasPriceMultiplier: 1.2,
    averageGasPrice: 50 // Gwei
  }
};

// Price cache for tokens
const priceCache = {
  data: new Map(),
  lastUpdated: 0,
  TTL: 30000 // 30 seconds
};

// Initialize providers - USE THIS CORRECTED CODE
const providers = {};
for (const [network, config] of Object.entries(NETWORKS)) {
  providers[network] = new ethers.JsonRpcProvider(
    config.rpc,           // First argument: RPC URL
    undefined,            // Second argument: Network (undefined = auto-detect)
    {                     // Third argument: Options object
      batchMaxCount: 100,
      staticNetwork: true
    }
  );
}

// Helper function to get contract instances
function getQuoter(network) {
  return new ethers.Contract(NETWORKS[network].quoter, QUOTER_ABI, providers[network]);
}

function getFactory(network) {
  return new ethers.Contract(NETWORKS[network].factory, FACTORY_ABI, providers[network]);
}

function getPool(network, poolAddress) {
  return new ethers.Contract(poolAddress, POOL_ABI, providers[network]);
}

// Price fetching with cache
async function getTokenPriceUSD(network, tokenSymbol) {
  const cacheKey = `${network}:${tokenSymbol}`;
  const now = Date.now();
  
  // Return cached price if valid
  if (priceCache.data.has(cacheKey)) {
    const cached = priceCache.data.get(cacheKey);
    if (now - cached.timestamp < priceCache.TTL) {
      return cached.price;
    }
  }
  
  try {
    let price = null;
    
    // Native token prices (simplified - in production use oracle or DEX price)
    if (tokenSymbol === NETWORKS[network].wrappedNative || tokenSymbol === NETWORKS[network].nativeToken) {
      // For native tokens, use fixed prices (should be from oracle in production)
      price = tokenSymbol.includes('ETH') ? 3200 : 0.4;
    } 
    // Stablecoins
    else if (['USDC', 'USDT', 'DAI', 'FRAX'].includes(tokenSymbol)) {
      price = 1.0;
    }
    // Other tokens - approximate pricing (in production, use Chainlink or similar)
    else {
      // Simplified: Use Uniswap pool to get price relative to USDC
      const usdcToken = NETWORKS[network].tokens['USDC'];
      const targetToken = NETWORKS[network].tokens[tokenSymbol];
      
      if (usdcToken && targetToken) {
        // Get quote for 1 token to USDC
        const quoter = getQuoter(network);
        const oneToken = ethers.parseUnits('1', targetToken.decimals);
        
        for (const fee of POOL_FEES) {
          try {
            const amountOut = await quoter.quoteExactInputSingle.staticCall(
              targetToken.address,
              usdcToken.address,
              fee,
              oneToken,
              0
            );
            
            const priceInUSDC = parseFloat(ethers.formatUnits(amountOut, usdcToken.decimals));
            if (priceInUSDC > 0) {
              price = priceInUSDC;
              break;
            }
          } catch (e) {
            continue;
          }
        }
      }
    }
    
    // Fallback prices for common tokens
    if (!price) {
      const fallbackPrices = {
        'WBTC': 65000,
        'WETH': 3200,
        'WMATIC': 0.4,
        'ARB': 0.1,
        'LINK': 15,
        'UNI': 6,
        'AAVE': 100,
        'CRV': 0.5,
        'SNX': 3,
        'COMP': 50,
        'GMX': 40,
        'MAGIC': 0.7,
        'SUSHI': 1.2,
        'FXS': 6,
        'LDO': 2.5,
        'PEPE': 0.000001,
        'RNDR': 8
      };
      
      price = fallbackPrices[tokenSymbol] || 1.0;
    }
    
    // Update cache
    priceCache.data.set(cacheKey, { price, timestamp: now });
    
    return price;
  } catch (error) {
    console.log(`Price fetch error for ${tokenSymbol}:`, error.message);
    return 1.0; // Safe fallback
  }
}

// Convert USD amount to token amount
async function convertUSDToTokenAmount(network, tokenSymbol, usdAmount) {
  try {
    const tokenPrice = await getTokenPriceUSD(network, tokenSymbol);
    
    if (!tokenPrice || tokenPrice <= 0) {
      throw new Error(`Invalid price for ${tokenSymbol}: ${tokenPrice}`);
    }
    
    const tokenAmount = usdAmount / tokenPrice;
    const tokenData = NETWORKS[network].tokens[tokenSymbol];
    
    if (!tokenData) {
      throw new Error(`Token ${tokenSymbol} not found in ${network}`);
    }
    
    // Validate amount is reasonable
    if (tokenAmount <= 0 || tokenAmount > 1000000) { // Max 1M tokens
      throw new Error(`Unrealistic token amount: ${tokenAmount}`);
    }
    
    return {
      tokenAmount,
      tokenPrice,
      tokenAmountWei: ethers.parseUnits(tokenAmount.toString(), tokenData.decimals)
    };
  } catch (error) {
    console.error(`USD conversion error for ${tokenSymbol}:`, error.message);
    return null;
  }
}

// Gas cost calculation
async function calculateGasCost(network, numSwaps = 3) {
  try {
    const feeData = await providers[network].getFeeData();
    const gasPriceWei = feeData.gasPrice || ethers.parseUnits(GAS_ESTIMATES[network].averageGasPrice.toString(), 'gwei');
    const gasPriceGwei = parseFloat(ethers.formatUnits(gasPriceWei, 'gwei'));
    
    const gasLimit = GAS_ESTIMATES[network].swapGasLimit * numSwaps;
    const gasLimitWithBuffer = Math.floor(gasLimit * GAS_ESTIMATES[network].gasPriceMultiplier);
    
    // Get native token price
    const nativeTokenPrice = await getTokenPriceUSD(network, NETWORKS[network].wrappedNative);
    
    const gasCostNative = (gasLimitWithBuffer * gasPriceGwei) / 1e9; // Convert to native token
    const gasCostUSD = gasCostNative * nativeTokenPrice;
    
    return {
      gasPriceGwei,
      gasPriceWei: gasPriceWei.toString(),
      gasLimit: gasLimitWithBuffer,
      gasCostNative,
      gasCostUSD,
      nativeToken: NETWORKS[network].nativeToken,
      nativeTokenPrice
    };
  } catch (error) {
    console.log(`Gas calculation error, using defaults:`, error.message);
    
    // Fallback to defaults
    const gasPriceGwei = GAS_ESTIMATES[network].averageGasPrice;
    const gasLimit = GAS_ESTIMATES[network].swapGasLimit * 3;
    const nativeTokenPrice = await getTokenPriceUSD(network, NETWORKS[network].wrappedNative);
    const gasCostNative = (gasLimit * gasPriceGwei) / 1e9;
    const gasCostUSD = gasCostNative * nativeTokenPrice;
    
    return {
      gasPriceGwei,
      gasPriceWei: ethers.parseUnits(gasPriceGwei.toString(), 'gwei').toString(),
      gasLimit,
      gasCostNative,
      gasCostUSD,
      nativeToken: NETWORKS[network].nativeToken,
      nativeTokenPrice
    };
  }
}

// Check pool liquidity and existence
async function checkPoolLiquidity(network, tokenIn, tokenOut, fee) {
  try {
    const factory = getFactory(network);
    const tokenInData = NETWORKS[network].tokens[tokenIn];
    const tokenOutData = NETWORKS[network].tokens[tokenOut];
    
    if (!tokenInData || !tokenOutData) {
      return { exists: false, error: 'Token not found' };
    }
    
    const poolAddress = await factory.getPool(tokenInData.address, tokenOutData.address, fee);
    
    if (!poolAddress || poolAddress === ethers.ZeroAddress) {
      return { exists: false, liquidity: 0 };
    }
    
    const pool = getPool(network, poolAddress);
    const [liquidity, slot0] = await Promise.all([
      pool.liquidity(),
      pool.slot0()
    ]);
    
    const liquidityNum = Number(liquidity);
    const sqrtPriceX96 = slot0.sqrtPriceX96;
    
    // Minimum liquidity check (adjust based on network)
    const minLiquidity = network === 'arbitrum' ? 1000000 : 500000; // ~$1k-$2k
    
    return {
      exists: true,
      liquidity: liquidityNum,
      poolAddress,
      sqrtPriceX96,
      tick: slot0.tick,
      meetsMinimum: liquidityNum >= minLiquidity
    };
  } catch (error) {
    return { exists: false, liquidity: 0, error: error.message };
  }
}

// Get quote with validation
async function getQuote(network, tokenIn, tokenOut, amountInTokens, fee, checkLiquidity = true) {
  try {
    const tokenInData = NETWORKS[network].tokens[tokenIn];
    const tokenOutData = NETWORKS[network].tokens[tokenOut];
    
    if (!tokenInData || !tokenOutData) {
      throw new Error(`Token not found: ${tokenIn} or ${tokenOut}`);
    }
    
    if (checkLiquidity) {
      const liquidityCheck = await checkPoolLiquidity(network, tokenIn, tokenOut, fee);
      if (!liquidityCheck.exists || !liquidityCheck.meetsMinimum) {
        return null;
      }
    }
    
    const quoter = getQuoter(network);
    const amountInWei = ethers.parseUnits(amountInTokens.toString(), tokenInData.decimals);
    
    // Validate amount is reasonable
    if (amountInWei <= 0n || amountInWei > ethers.parseUnits('1000000', tokenInData.decimals)) {
      return null;
    }
    
    const amountOut = await quoter.quoteExactInputSingle.staticCall(
      tokenInData.address,
      tokenOutData.address,
      fee,
      amountInWei,
      0
    );
    
    if (amountOut <= 0n) {
      return null;
    }
    
    const amountOutTokens = parseFloat(ethers.formatUnits(amountOut, tokenOutData.decimals));
    return amountOutTokens;
  } catch (error) {
    // Don't log expected errors (no liquidity, etc.)
    if (!error.message.includes('revert') && !error.message.includes('insufficient liquidity')) {
      console.log(`Quote error ${tokenIn}->${tokenOut} fee ${fee}:`, error.message);
    }
    return null;
  }
}

// Generate optimized paths
function generateOptimizedPaths(network, baseToken, maxPaths = 1000) {
  const tokens = Object.keys(NETWORKS[network].tokens);
  const paths = [];
  
  if (!tokens.includes(baseToken)) {
    throw new Error(`Base token ${baseToken} not found in ${network}`);
  }
  
  // Priority tokens (high liquidity)
  const priorityTokens = ['WETH', 'USDC', 'USDT', 'DAI', 'WBTC', NETWORKS[network].wrappedNative];
  
  // Filter tokens, prioritizing high liquidity ones
  const availableTokens = tokens.filter(t => t !== baseToken);
  const sortedTokens = availableTokens.sort((a, b) => {
    const aPriority = priorityTokens.includes(a) ? 1 : 0;
    const bPriority = priorityTokens.includes(b) ? 1 : 0;
    return bPriority - aPriority;
  }).slice(0, 20); // Limit to top 20 tokens for efficiency
  
  // Generate triangular paths
  for (let i = 0; i < sortedTokens.length; i++) {
    for (let j = 0; j < sortedTokens.length; j++) {
      if (i === j) continue;
      paths.push([baseToken, sortedTokens[i], sortedTokens[j]]);
      
      if (paths.length >= maxPaths) {
        return paths;
      }
    }
  }
  
  return paths;
}

// Path tracking state
const pathTracking = {
  arbitrum: {
    allPaths: [],
    scannedPaths: new Set(),
    currentBatchIndex: 0,
    totalScanned: 0
  },
  polygon: {
    allPaths: [],
    scannedPaths: new Set(),
    currentBatchIndex: 0,
    totalScanned: 0
  }
};

function getNextBatch(network, baseToken, batchSize = 50) {
  // Create unique tracking key for this network + baseToken
  const trackingKey = `${network}:${baseToken}`;
  
  // Initialize tracking for this specific baseToken
  if (!pathTracking[trackingKey]) {
    pathTracking[trackingKey] = {
      allPaths: [],
      scannedPaths: new Set(),
      currentBatchIndex: 0,
      totalScanned: 0
    };
  }
  
  const tracking = pathTracking[trackingKey];
  
  // Generate paths if needed
  if (tracking.allPaths.length === 0) {
    tracking.allPaths = generateOptimizedPaths(network, baseToken, 500);
    console.log(`Generated ${tracking.allPaths.length} paths for ${baseToken} on ${network}`);
  }
  
  // Reset if all scanned
  if (tracking.totalScanned >= tracking.allPaths.length) {
    tracking.scannedPaths.clear();
    tracking.currentBatchIndex = 0;
    tracking.totalScanned = 0;
    console.log(`Reset tracking for ${baseToken} on ${network} - all paths scanned`);
  }
  
  // Get next batch
  const batch = [];
  let index = tracking.currentBatchIndex;
  
  while (batch.length < batchSize && index < tracking.allPaths.length) {
    const path = tracking.allPaths[index];
    const pathKey = path.join('-');
    
    if (!tracking.scannedPaths.has(pathKey)) {
      batch.push(path);
      tracking.scannedPaths.add(pathKey);
    }
    
    index++;
  }
  
  tracking.currentBatchIndex = index;
  tracking.totalScanned += batch.length;
  
  return batch;
}

async function calculateArbitrage(network, path, amountTokens, gasCost, minProfitPercent = 0.1) {
  const [tokenA, tokenB, tokenC] = path;
  
  // OPTIMIZATION: Only check common fee tiers
  const FEES_TO_CHECK = [500, 3000]; // 0.05% and 0.3% only
  let bestResult = null;
  let bestProfit = -Infinity;
  
  // Quick check: Skip if tokens don't exist
  if (!NETWORKS[network].tokens[tokenA] || 
      !NETWORKS[network].tokens[tokenB] || 
      !NETWORKS[network].tokens[tokenC]) {
    return null;
  }
  
  // Try each fee combination (now only 8 instead of 64)
  for (const fee1 of FEES_TO_CHECK) {
    const amountB = await getQuote(network, tokenA, tokenB, amountTokens, fee1, true);
    if (!amountB) continue;
    
    for (const fee2 of FEES_TO_CHECK) {
      const amountC = await getQuote(network, tokenB, tokenC, amountB, fee2, true);
      if (!amountC) continue;
      
      for (const fee3 of FEES_TO_CHECK) {
        const amountFinal = await getQuote(network, tokenC, tokenA, amountC, fee3, true);
        if (!amountFinal) continue;
        
        const profitPercent = ((amountFinal - amountTokens) / amountTokens) * 100;
        
        if (profitPercent > bestProfit && profitPercent >= minProfitPercent) {
          bestProfit = profitPercent;
          
          // Calculate USD values (ONCE at the end, not during loop)
          const tokenPrice = await getTokenPriceUSD(network, tokenA);
          const profitUSD = (amountFinal - amountTokens) * tokenPrice;
          const netProfitUSD = profitUSD - (gasCost?.gasCostUSD || 0);
          
          if (netProfitUSD > 0) { // Only keep if actually profitable after gas
            bestResult = {
              path: `${tokenA} → ${tokenB} → ${tokenC} → ${tokenA}`,
              inputAmount: amountTokens,
              outputAmount: amountFinal,
              profit: profitUSD,
              profitPercent: profitPercent,
              gasCost: gasCost?.gasCostUSD || 0,
              netProfit: netProfitUSD,
              netProfitPercent: (netProfitUSD / (amountTokens * tokenPrice)) * 100,
              fees: [fee1, fee2, fee3],
              feesPercent: [(fee1/10000), (fee2/10000), (fee3/10000)],
              network: network,
              pathArray: [tokenA, tokenB, tokenC],
              timestamp: new Date().toISOString()
            };
          }
        }
      }
    }
  }
  
  return bestResult;
}

// API Endpoints
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    networks: Object.keys(NETWORKS).map(n => ({
      name: n,
      tokens: Object.keys(NETWORKS[n].tokens).length
    }))
  });
});

app.get('/tokens/:network', (req, res) => {
  const { network } = req.params;
  
  if (!NETWORKS[network]) {
    return res.status(400).json({ error: 'Invalid network' });
  }
  
  res.json({
    network: NETWORKS[network].name,
    tokens: NETWORKS[network].tokens
  });
});

app.get('/price/:network/:token', async (req, res) => {
  const { network, token } = req.params;
  
  if (!NETWORKS[network]) {
    return res.status(400).json({ error: 'Invalid network' });
  }
  
  try {
    const price = await getTokenPriceUSD(network, token);
    res.json({ token, price, network });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/scan', async (req, res) => {
  const { network, baseToken, amountUSD, minProfitPercent = 0.1, checkLiquidity = true } = req.body;
  
  if (!NETWORKS[network]) {
    return res.status(400).json({ error: 'Invalid network' });
  }
  
  if (!NETWORKS[network].tokens[baseToken]) {
    return res.status(400).json({ error: `Base token ${baseToken} not found on ${network}` });
  }
  
  if (amountUSD <= 0 || amountUSD > 1000000) {
    return res.status(400).json({ error: 'Amount must be between 0 and 1,000,000 USD' });
  }
  
  try {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`🚀 STARTING ARBITRAGE SCAN`);
    console.log(`${'='.repeat(70)}`);
    console.log(`Network: ${NETWORKS[network].name}`);
    console.log(`Base Token: ${baseToken}`);
    console.log(`USD Amount: $${amountUSD}`);
    console.log(`Min Profit: ${minProfitPercent}%`);
    console.log(`${'='.repeat(70)}`);
    
    // Step 1: Convert USD to token amount
    console.log('\n💰 Converting USD to token amount...');
    const conversion = await convertUSDToTokenAmount(network, baseToken, amountUSD);
    
    if (!conversion) {
      return res.status(400).json({ error: `Failed to convert USD to ${baseToken} amount` });
    }
    
    const { tokenAmount, tokenPrice } = conversion;
    console.log(`   Token Price: $${tokenPrice.toFixed(2)}`);
    console.log(`   Token Amount: ${tokenAmount.toFixed(6)} ${baseToken}`);
    console.log(`   Value: $${(tokenAmount * tokenPrice).toFixed(2)}`);
    
    // Step 2: Calculate gas cost
    console.log('\n⛽ Calculating gas costs...');
    const gasCost = await calculateGasCost(network);
    console.log(`   Gas Price: ${gasCost.gasPriceGwei.toFixed(2)} GWEI`);
    console.log(`   Gas Cost: $${gasCost.gasCostUSD.toFixed(2)} (${gasCost.gasCostNative.toFixed(6)} ${gasCost.nativeToken})`);
    
    // Step 3: Get next batch of paths
    console.log('\n🔄 Getting next batch of paths...');
    const batch = getNextBatch(network, baseToken, 50);
    const trackingKey = `${network}:${baseToken}`;
    
    console.log(`   Batch Size: ${batch.length} paths`);
    console.log(`   Total Scanned So Far: ${pathTracking[trackingKey]?.totalScanned || 0}`);
    console.log(`   Total Paths Available: ${pathTracking[trackingKey]?.allPaths?.length || 0}`);
    
    // Step 4: Scan paths
    const opportunities = [];
    console.log('\n🔍 Scanning for arbitrage opportunities...');
    
    for (let i = 0; i < batch.length; i++) {
      const path = batch[i];
      
      console.log(`   Checking: ${path[0]} → ${path[1]} → ${path[2]} → ${path[0]}`);
      
      const result = await calculateArbitrage(network, path, tokenAmount, gasCost, minProfitPercent);
      
      if (result) {
        opportunities.push(result);
        console.log(`\n   ✅ PROFITABLE OPPORTUNITY!`);
        console.log(`   Path: ${result.path}`);
        console.log(`   Net Profit: $${result.netProfit.toFixed(2)} (+${result.netProfitPercent.toFixed(3)}%)`);
      }
    }
    
    // Step 5: Sort and filter results
    opportunities.sort((a, b) => b.netProfitPercent - a.netProfitPercent);
    
    console.log(`\n${'='.repeat(70)}`);
    console.log(`✨ SCAN COMPLETE`);
    console.log(`${'='.repeat(70)}`);
    console.log(`Paths Scanned: ${batch.length}`);
    console.log(`Opportunities Found: ${opportunities.length}`);
    
    if (opportunities.length > 0) {
      console.log(`\n🎯 Top Opportunities:`);
      opportunities.slice(0, 5).forEach((opp, idx) => {
        console.log(`  ${idx + 1}. ${opp.path}`);
        console.log(`     Input: ${opp.inputAmount.toFixed(6)} ${baseToken}`);
        console.log(`     Output: ${opp.outputAmount.toFixed(6)} ${baseToken}`);
        console.log(`     Net Profit: $${opp.netProfit.toFixed(2)} (+${opp.netProfitPercent.toFixed(3)}%)`);
        console.log(`     Gas Cost: $${opp.gasCost.toFixed(2)}`);
        console.log();
      });
    }
    
    console.log(`${'='.repeat(70)}\n`);
    
    // ✅ CORRECT RESPONSE (ONLY ONE res.json()!)
    res.json({
      success: true,
      network: NETWORKS[network].name,
      baseToken: baseToken,
      conversion: {
        usdAmount: amountUSD,
        tokenAmount: tokenAmount,
        tokenPrice: tokenPrice,
        tokenValueUSD: tokenAmount * tokenPrice
      },
      gasCost: {
        gasPriceGwei: gasCost.gasPriceGwei.toFixed(2),
        gasCostUSD: gasCost.gasCostUSD.toFixed(2),
        gasCostNative: gasCost.gasCostNative.toFixed(6),
        nativeToken: gasCost.nativeToken
      },
      scanStats: {
        pathsScanned: batch.length,
        opportunitiesFound: opportunities.length,
        totalScannedSoFar: pathTracking[trackingKey]?.totalScanned || 0,
        totalPaths: pathTracking[trackingKey]?.allPaths?.length || 0,
        percentComplete: pathTracking[trackingKey]?.allPaths?.length > 0 
          ? ((pathTracking[trackingKey].totalScanned / pathTracking[trackingKey].allPaths.length) * 100).toFixed(2)
          : "0.00"
      },
      opportunities: opportunities.slice(0, 20)
    });
    
  } catch (error) {
    console.error('❌ Scan error:', error);
    res.status(500).json({ 
      error: error.message,
      details: 'Check console for more information'
    });
  }
});

app.post('/check-liquidity', async (req, res) => {
  const { network, tokenIn, tokenOut, fee } = req.body;
  
  if (!NETWORKS[network]) {
    return res.status(400).json({ error: 'Invalid network' });
  }
  
  try {
    const liquidityInfo = await checkPoolLiquidity(network, tokenIn, tokenOut, fee);
    res.json(liquidityInfo);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/reset-tracking', (req, res) => {
  const { network, baseToken } = req.body;
  
  if (!NETWORKS[network]) {
    return res.status(400).json({ error: 'Invalid network' });
  }
  
  const trackingKey = `${network}:${baseToken}`;
  
  if (pathTracking[trackingKey]) {
    pathTracking[trackingKey].scannedPaths.clear();
    pathTracking[trackingKey].currentBatchIndex = 0;
    pathTracking[trackingKey].totalScanned = 0;
    pathTracking[trackingKey].allPaths = [];
  }
  
  console.log(`🔄 Reset path tracking for ${network}:${baseToken}`);
  
  res.json({
    success: true,
    message: `Path tracking reset for ${network}:${baseToken}`
  });
});

// WebSocket for real-time updates
const server = require('http').createServer(app);
const io = require('socket.io')(server, {
  cors: { origin: '*' }
});

const activeScans = new Map();

io.on('connection', (socket) => {
  console.log('🔌 Client connected:', socket.id);
  
  socket.on('startScan', async (config) => {
    const { network, baseToken, amountUSD, minProfitPercent = 0.1 } = config;
    
    if (activeScans.has(socket.id)) {
      activeScans.get(socket.id).stop = true;
    }
    
    const scanState = { stop: false };
    activeScans.set(socket.id, scanState);
    
    console.log(`🔄 Starting continuous scan for ${socket.id} on ${network} with ${baseToken}`);
    
    const runScan = async () => {
      if (scanState.stop) {
        console.log(`⏹️ Scan stopped for ${socket.id}`);
        return;
      }
      
      try {
        const conversion = await convertUSDToTokenAmount(network, baseToken, amountUSD);
        if (!conversion) {
          socket.emit('error', { message: `Failed to convert USD to ${baseToken}` });
          return;
        }
        
        const gasCost = await calculateGasCost(network);
        const batch = getNextBatch(network, baseToken, 25);
        const trackingKey = `${network}:${baseToken}`;
        
        if (batch.length === 0) {
          socket.emit('info', { 
            message: 'All paths scanned. Restarting...',
            totalScanned: pathTracking[trackingKey]?.totalScanned || 0
          });
          setTimeout(runScan, 2000);
          return;
        }
        
        for (let i = 0; i < batch.length && !scanState.stop; i++) {
          const path = batch[i];
          const result = await calculateArbitrage(network, path, conversion.tokenAmount, gasCost, minProfitPercent);
          
          if (result) {
            socket.emit('opportunity', result);
          }
          
          if (i % 5 === 0) {
            socket.emit('progress', {
              scanned: i + 1,
              batchTotal: batch.length,
              totalScanned: pathTracking[trackingKey]?.totalScanned || 0,
              totalPaths: pathTracking[trackingKey]?.allPaths?.length || 0,
              percentComplete: pathTracking[trackingKey]?.allPaths?.length > 0 
                ? ((pathTracking[trackingKey].totalScanned / pathTracking[trackingKey].allPaths.length) * 100).toFixed(2)
                : "0.00"
            });
          }
          
          await new Promise(resolve => setTimeout(resolve, 50));
        }
        
        socket.emit('batchComplete', {
          scanned: batch.length,
          totalScanned: pathTracking[trackingKey]?.totalScanned || 0
        });
        
        if (!scanState.stop) {
          setTimeout(runScan, 1000);
        }
        
      } catch (error) {
        console.error(`Scan error for ${socket.id}:`, error);
        socket.emit('error', { message: error.message });
        scanState.stop = true;
      }
    };
    
    runScan();
  });
  
  socket.on('stopScan', () => {
    if (activeScans.has(socket.id)) {
      activeScans.get(socket.id).stop = true;
      activeScans.delete(socket.id);
      console.log(`⏹️  Stopped scan for ${socket.id}`);
      socket.emit('stopped', { message: 'Scan stopped' });
    }
  });
  
  socket.on('disconnect', () => {
    if (activeScans.has(socket.id)) {
      activeScans.get(socket.id).stop = true;
      activeScans.delete(socket.id);
    }
    console.log('🔌 Client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║   🚀 Uniswap V3 Triangular Arbitrage Scanner                  ║
║   💎 Fixed USD to Token Conversion & Gas Calculation          ║
║                                                                ║
║   Running on port ${PORT}                                        ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝

📊 Networks Available:
   • Arbitrum (${Object.keys(NETWORKS.arbitrum.tokens).length} tokens) - Gas: ${NETWORKS.arbitrum.nativeToken}
   • Polygon (${Object.keys(NETWORKS.polygon.tokens).length} tokens) - Gas: ${NETWORKS.polygon.nativeToken}

💰 Fee Tiers: 0.01%, 0.05%, 0.3%, 1%

📡 API Endpoints:
   GET  /health              - Server health check
   GET  /tokens/:network     - Get token list
   GET  /price/:network/:token - Get token price
   POST /scan                - Scan for arbitrage (requires baseToken and amountUSD)
   POST /check-liquidity     - Check pool liquidity
   POST /reset-tracking      - Reset path tracking

🌐 Frontend: http://localhost:${PORT}

✅ Ready to scan!
  `);
});
