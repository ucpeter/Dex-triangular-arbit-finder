// server.js - Part 1 of 2 (UPDATED VERSION)
// Real-time Uniswap V3 Arbitrage Scanner with Progressive Path Scanning

const express = require('express');
const cors = require('cors');
const { ethers } = require('ethers');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Serve static frontend files
app.use(express.static('public'));
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

const NETWORKS = {
  arbitrum: {
    name: 'Arbitrum',
    chainId: 42161,
    rpc: process.env.ARBITRUM_RPC || 'https://arb1.arbitrum.io/rpc',
    quoter: '0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6',
    factory: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
    nativeToken: 'ETH',
    nativeTokenPrice: 3200, // USD price of ETH
    tokens: {
      '1INCH': { address: '0x5438107231c501f4929a5e2e3155e2665a9a8f7b', decimals: 18 },
      'AAVE': { address: '0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9', decimals: 18 },
      'AEVO': { address: '0x385eeac5cb85a38a9a07a70c73e0a3271cfb54a7', decimals: 18 },
      'AGLD': { address: '0x3e97808d9ef9a7d7ed98312e3fe9f070b94269de', decimals: 18 },
      'ALPHA': { address: '0xc854e43631a66032b4a37b6c96d8a7fb8c5d6e9e', decimals: 18 },
      'Ankr': { address: '0xe05a08244e5c6e65edea2cce6a4ec8fd3ba915c4', decimals: 18 },
      'APE': { address: '0x2d3bd680c6a1994e25fa22716b653e3d7a8c74dc', decimals: 18 },
      'API3': { address: '0x43448ca009a397316b4e566e714eb8217e12e152', decimals: 18 },
      'ARB': { address: '0x912ce59144191c1204e64559fe8253a0e49e6548', decimals: 18 },
      'ARKM': { address: '0x5c54e69e08849145065638863172a61a2b57497e', decimals: 18 },
      'AXL': { address: '0x8ff33111786bf5e56a56d603df6a8116b5a9174a', decimals: 18 },
      'AXS': { address: '0x2be31b290b855e80d4c61b2cd0b45b5e961483a5', decimals: 18 },
      'BAL': { address: '0x040d1edc9569d4bab2d15287dc5a4f10f56a56b8', decimals: 18 },
      'BAT': { address: '0x1fe622e247605caa74864bb598084a053d8db3e3', decimals: 18 },
      'BICO': { address: '0x5f016b336c804d52a39e96f44b4f5e265a8a7f3d', decimals: 18 },
      'COMP': { address: '0x354a6da4a1c414131c964d7c0b50c373e9c1a845', decimals: 18 },
      'COW': { address: '0xdef1ca1fb7fbcdc777520aa7f396b4e015f497ab', decimals: 18 },
      'CRV': { address: '0x11cdb42b0eb46d95f990bedd4695a6e3fa034978', decimals: 18 },
      'DAI': { address: '0xda10009cbd5d07dd0cecc66161fc93d7c9000da1', decimals: 18 },
      'ETHFI': { address: '0x9a6ae5622990ba5ec98225a455c56f4d5a8a0b1c', decimals: 18 },
      'FRAX': { address: '0x17fc002b466eec40dae837fc4be5c67993ddbd6f', decimals: 18 },
      'FXS': { address: '0x9d2f299715d94d8a7e6f5eaa8e654e8c74a988a7', decimals: 18 },
      'GMX': { address: '0xfc5a1a6eb076a2c7ad06ed22c90d7e710e35ad0a', decimals: 18 },
      'GRT': { address: '0x230d620a2c47e252e6c3f75a94971f15bffb8e72', decimals: 18 },
      'IMX': { address: '0x3a4f40631a4f906c2bad353ed06de7a5d3fcb430', decimals: 18 },
      'LDO': { address: '0x13ad51ed4f1b7e9dc168d8a00cb3f91e71e6e8d0', decimals: 18 },
      'LINK': { address: '0xf97f4df75117a78c1a5a0dbb814af92458539fb4', decimals: 18 },
      'LUSD': { address: '0x93b346b6bc25483a79a3e517304e2b5c1de2e47c', decimals: 18 },
      'MAGIC': { address: '0x539bde0d4d63320772d99f2d1be671a7c23e7e4c', decimals: 18 },
      'MANA': { address: '0x3b484b82567a09e2588a13d54d032153f0c0aee0', decimals: 18 },
      'MATIC': { address: '0x6f14c025c4eb8cf9499c7dd3e82517a67c09c2cd', decimals: 18 },
      'METIS': { address: '0x2e14bf0409894809d5e2e733707698d38c400a62', decimals: 18 },
      'MIM': { address: '0xfea7a6a0b346362bf88a9e4a88416b77a57d6c2a', decimals: 18 },
      'MOG': { address: '0x3c753b1a9e9a1e9e9f0a1b2c3d4e5f6a7b8c9d0e', decimals: 18 },
      'MORPHO': { address: '0x57a2f53c8f1d6e8e9f0a1b2c3d4e5f6a7b8c9d0e', decimals: 18 },
      'ONDO': { address: '0x9f39e5a0a9a9b8c7d6e5f4c3b2a1908f7e6d5c4b', decimals: 18 },
      'PENDLE': { address: '0x0c880f6761f1af8d9aa9c466984b80dab9a8c9e8', decimals: 18 },
      'PEPE': { address: '0x7069e91f2e19f862c21453d753e70afeb1914318', decimals: 18 },
      'PERP': { address: '0x67c597624b17b16fb7b6d89c9e87a83d3da07f1b', decimals: 18 },
      'POL': { address: '0x4200000000000000000000000000000000000042', decimals: 18 },
      'RNDR': { address: '0xa45e36133a1e79d62f99e4f4c6c9e8e9f0a1b2c3', decimals: 18 },
      'RPL': { address: '0xb766039cc6db368759c1e56b79affe831d0cc507', decimals: 18 },
      'SD': { address: '0x3432b6a60d23ca0dfca7761b7ab56459d9c964d0', decimals: 18 },
      'SNX': { address: '0x8700daec35af8ff88c16bdf0418774cb3d7599b4', decimals: 18 },
      'SPELL': { address: '0x3e6648c5a70a150a88bce65f4ad4d506fe15d2af', decimals: 18 },
      'SUSHI': { address: '0xd4d42f0b6def4ce0383636770ef773390d85c61a', decimals: 18 },
      'SYN': { address: '0x9988843262134637195981eaaa8858da39236c3e', decimals: 18 },
      'TURBO': { address: '0x1a8e39ae59e5556b56b76fcba98d22c9ae557396', decimals: 18 },
      'UMA': { address: '0x07c654634b5d52a2f295a4911f8f1987a6e56a33', decimals: 18 },
      'UNI': { address: '0xfa7f8980b0f1e64a2062791cc3b0871572f1f7f0', decimals: 18 },
      'USDC': { address: '0xaf88d065e77c8cc2239327c5edb3a432268e5831', decimals: 6 },
      'USDC.e': { address: '0xff970a61a04b1ca14834a43f5de4533ebddb5cc8', decimals: 6 },
      'USDT': { address: '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9', decimals: 6 },
      'WBTC': { address: '0x2f2a2543b76a4166549f7aab2e75bef0aefc5b0f', decimals: 8 },
      'WETH': { address: '0x82af49447d8a07e3bd95bd0d56f35241523fbab1', decimals: 18 },
      'YFI': { address: '0x92a4e761d63a5e554a252e735463e97a7a3db93a', decimals: 18 },
      'ZRO': { address: '0x957c9c64f7c2ce091e54af275d4ef8e72e434d5e', decimals: 18 },
      'cbBTC': { address: '0x28fe63565e51ceaf7e3b686d6cd7ba24fb4a8558', decimals: 8 },
      'cbETH': { address: '0x1debd73e752beaf79865fd6446b0c970eae7732f', decimals: 18 },
      'tBTC': { address: '0x6c84a8f1c29108f47a79964b5fe888d4f4d0de40', decimals: 18 }
    }
  },
  polygon: {
    name: 'Polygon',
    chainId: 137,
    rpc: process.env.POLYGON_RPC || 'https://polygon-rpc.com',
    quoter: '0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6',
    factory: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
    nativeToken: 'MATIC',
    nativeTokenPrice: 0.40, // USD price of MATIC
    tokens: {
      '1INCH': { address: '0x111111111117dc0aa78b770fa6a738034120c302', decimals: 18 },
      'AAVE': { address: '0xd6df932a45c0f255f85145f286ea0b292b21c90b', decimals: 18 },
      'AGLD': { address: '0x5592ec0cfb3d079665e877c5a623c1f78190fa36', decimals: 18 },
      'ALCX': { address: '0x765277eebeca2e31912c9946eae1021199b39c61', decimals: 18 },
      'ALICE': { address: '0x3402a719021e1e8b1d14e6d78c2815419f1e37c1', decimals: 18 },
      'ALPHA': { address: '0x2675609F6C2A62aE1BD2dB28B19d51331C212B5F', decimals: 18 },
      'AMP': { address: '0xb99e247c1a39f7dcfd6e3b8fc9ab24eef7eb6e33', decimals: 18 },
      'ANT': { address: '0x960b236A07cf122663c4303350609A66A7B288C0', decimals: 18 },
      'APE': { address: '0x4791396604512f8584f15bb54ef5e38b12e1b31a', decimals: 18 },
      'ARPA': { address: '0x8F1E15bc8cA9215F6BA3428AE5249359d0252713', decimals: 18 },
      'AUDIO': { address: '0x0b38210ea11411557c13457D4dA7dC6ea731B88a', decimals: 18 },
      'AXS': { address: '0x3323916121E777F8E923091B7e4781656c51CC39', decimals: 18 },
      'BAND': { address: '0x4136e91140a0e4C36D2C3189E91C1A128247117D', decimals: 18 },
      'BICO': { address: '0x5f016b336c804d52a39e96f44b4f5e265a8a7f3d', decimals: 18 },
      'BLZ': { address: '0x26c8AFBBFE1EBaca03C2bB082E69D0476Bffe099', decimals: 18 },
      'BNT': { address: '0x31f4904F6d16190DB594171b75908201f476AfF9', decimals: 18 },
      'BUSD': { address: '0xdAb529f40E671A1D4bF91361c21bf9f0C9712ab7', decimals: 18 },
      'CRV': { address: '0x172370d5Cd63279eFa6d502DAB29171933a610AF', decimals: 18 },
      'CTSI': { address: '0x6A6C605700f477E3848932a7c272432546421080', decimals: 18 },
      'DAI': { address: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063', decimals: 18 },
      'ENJ': { address: '0x2C78F1b70Cc349542c83269d9b3289e36d38261d', decimals: 18 },
      'ERN': { address: '0x1dF34a1A33b3911803b15B344CD1c18F5E923691', decimals: 18 },
      'FRAX': { address: '0x45c32fA6DF82ead1e2EF74d17b76547EDdFfE206', decimals: 18 },
      'FXS': { address: '0x3e121107F6F22Da4911079845a470733ACFe4CA5', decimals: 18 },
      'GNO': { address: '0x5FFD62D3C3eE2E867574c26A2F7C14122aD33123', decimals: 18 },
      'GRT': { address: '0x5fe2B58c013d7601147DcdD68C143A77499f5531', decimals: 18 },
      'GTC': { address: '0x0cEC1A9154Ff802e7934Fc916Ed7Ca50bDE6844e', decimals: 18 },
      'GUSD': { address: '0x62359Ed7505Efc61FF1D56fEF82158CcaffA23D7', decimals: 2 },
      'GYEN': { address: '0xB2987753D1561570913920401E43C5A4106B6161', decimals: 6 },
      'HOPR': { address: '0xfE1C248349220150673F7d8929d2255d99F22d31', decimals: 18 },
      'IMX': { address: '0x607a9f2d98A1a5E43E44B1f19Ae962543b38C421', decimals: 18 },
      'INDEX': { address: '0x72355A56D50831481d5e1ef3712359E025212024', decimals: 18 },
      'JASMY': { address: '0x7B9C2f68F16c3613e8b6c93Ef67d37E5d8c0A944', decimals: 18 },
      'LDO': { address: '0xC3C7d4228098520355d85941A481512E6b31E154', decimals: 18 },
      'LINK': { address: '0xb33EaAd8d922B1083446DC23f610c2567fB5180f', decimals: 18 },
      'LOKA': { address: '0x5a33492d5db4474e72c6b3e61266a7f2a01e5f2a', decimals: 18 },
      'LRC': { address: '0x24D39324C3693956463d28cB23431964D515D3a5', decimals: 18 },
      'LUSD': { address: '0x93b346b6bc25483a79a3e517304e2b5c1de2e47c', decimals: 18 },
      'MANA': { address: '0xA1c57f48F0Deb89f569dFbe6E2B7f46D33606fD4', decimals: 18 },
      'WMATIC': { address: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270', decimals: 18 },
      'MIM': { address: '0x49a0421f7631145e138491c1e3C6631541182e91', decimals: 18 },
      'MKR': { address: '0x6f7C932e7684666C9fd1d445277654365bc1011c', decimals: 18 },
      'PENDLE': { address: '0x0C880f6761F1af8d9aA9C466984b80DAb9a8c9e8', decimals: 18 },
      'PERP': { address: '0x67c597624b17b16fb7b6d89c9e87a83d3da07f1b', decimals: 18 },
      'QUICK': { address: '0xB5C0642510a044dA1431547651885E2599891180', decimals: 18 },
      'RNDR': { address: '0x61299774020dA444Af8416062C8152f3Fc3fF201', decimals: 18 },
      'SAND': { address: '0x3E708Fdb6E7483814C99559E224D2c41a0538E00', decimals: 18 },
      'SNX': { address: '0x50B728D8D964fd00C2d0AAD81718b71311feF68a', decimals: 18 },
      'SUSHI': { address: '0x0b3F868E0BE5597D5DB7fB1f246656A3173BdD50', decimals: 18 },
      'UNI': { address: '0x4c19596f5aaff459fa38b0f7ed92f11ae6543784', decimals: 18 },
      'USDC': { address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', decimals: 6 },
      'USDT': { address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', decimals: 6 },
      'WBTC': { address: '0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6', decimals: 8 },
      'WETH': { address: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619', decimals: 18 }
    }
  }
};

const POOL_FEES = [100, 500, 3000, 10000];

const QUOTER_ABI = [
  'function quoteExactInputSingle(address tokenIn, address tokenOut, uint24 fee, uint256 amountIn, uint160 sqrtPriceLimitX96) external returns (uint256 amountOut)'
];

const POOL_ABI = [
  'function liquidity() external view returns (uint128)',
  'function slot0() external view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)'
];

const FACTORY_ABI = [
  'function getPool(address tokenA, address tokenB, uint24 fee) external view returns (address pool)'
];

const GAS_ESTIMATES = {
  arbitrum: {
    swapGasLimit: 180000,
    swapsPerArbitrage: 3,
    averageGasPrice: 0.1
  },
  polygon: {
    swapGasLimit: 180000,
    swapsPerArbitrage: 3,
    averageGasPrice: 30
  }
};

// Global path tracking state
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

const providers = {};
for (const [network, config] of Object.entries(NETWORKS)) {
  providers[network] = new ethers.JsonRpcProvider(config.rpc);
}

function getQuoter(network) {
  return new ethers.Contract(NETWORKS[network].quoter, QUOTER_ABI, providers[network]);
}

function getFactory(network) {
  return new ethers.Contract(NETWORKS[network].factory, FACTORY_ABI, providers[network]);
}

function getPool(network, poolAddress) {
  return new ethers.Contract(poolAddress, POOL_ABI, providers[network]);
}

async function getCurrentGasPrice(network) {
  try {
    const feeData = await providers[network].getFeeData();
    const gasPriceGwei = parseFloat(ethers.formatUnits(feeData.gasPrice || 0n, 'gwei'));
    return gasPriceGwei;
  } catch (error) {
    console.log(`Using default gas price for ${network}`);
    return GAS_ESTIMATES[network].averageGasPrice;
  }
}

async function calculateGasCost(network) {
  const gasPrice = await getCurrentGasPrice(network);
  const gasLimit = GAS_ESTIMATES[network].swapGasLimit * GAS_ESTIMATES[network].swapsPerArbitrage;
  const nativeTokenPrice = NETWORKS[network].nativeTokenPrice;
  const nativeToken = NETWORKS[network].nativeToken;
  
  const gasCostNative = (gasLimit * gasPrice) / 1e9;
  const gasCostUSD = gasCostNative * nativeTokenPrice;
  
  return {
    gasPrice: gasPrice,
    gasLimit: gasLimit,
    gasCostNative: gasCostNative,
    gasCostUSD: gasCostUSD,
    nativeToken: nativeToken
  };
}

// server.js - Part 2 of 2 (UPDATED VERSION)
// Continue from Part 1 - Add this after calculateGasCost function

async function checkPoolLiquidity(network, tokenIn, tokenOut, fee) {
  try {
    const factory = getFactory(network);
    const tokenInData = NETWORKS[network].tokens[tokenIn];
    const tokenOutData = NETWORKS[network].tokens[tokenOut];
    
    const poolAddress = await factory.getPool(tokenInData.address, tokenOutData.address, fee);
    
    if (poolAddress === ethers.ZeroAddress) {
      return { exists: false, liquidity: 0 };
    }
    
    const pool = getPool(network, poolAddress);
    const liquidity = await pool.liquidity();
    const liquidityNum = Number(liquidity);
    
    return {
      exists: true,
      liquidity: liquidityNum,
      poolAddress: poolAddress,
      meetsMinimum: liquidityNum > 0
    };
  } catch (error) {
    return { exists: false, liquidity: 0, error: error.message };
  }
}

async function getQuote(network, tokenIn, tokenOut, amountIn, fee, checkLiquidity = true) {
  try {
    if (checkLiquidity) {
      const liquidityCheck = await checkPoolLiquidity(network, tokenIn, tokenOut, fee);
      if (!liquidityCheck.exists || !liquidityCheck.meetsMinimum) {
        return null;
      }
    }
    
    const quoter = getQuoter(network);
    const tokenInData = NETWORKS[network].tokens[tokenIn];
    const tokenOutData = NETWORKS[network].tokens[tokenOut];
    
    const amountInWei = ethers.parseUnits(amountIn.toString(), tokenInData.decimals);
    
    const amountOut = await quoter.quoteExactInputSingle.staticCall(
      tokenInData.address,
      tokenOutData.address,
      fee,
      amountInWei,
      0
    );
    
    return parseFloat(ethers.formatUnits(amountOut, tokenOutData.decimals));
  } catch (error) {
    return null;
  }
}

async function calculateArbitrage(network, path, amount, minLiquidityCheck = true, gasCost = null) {
  const [tokenA, tokenB, tokenC] = path;
  
  console.log(`   Checking: ${tokenA} → ${tokenB} → ${tokenC} → ${tokenA}`);
  
  let bestProfit = -Infinity;
  let bestResult = null;
  
  for (const fee1 of POOL_FEES) {
    for (const fee2 of POOL_FEES) {
      for (const fee3 of POOL_FEES) {
        try {
          const amountB = await getQuote(network, tokenA, tokenB, amount, fee1, minLiquidityCheck);
          if (!amountB) continue;
          
          const amountC = await getQuote(network, tokenB, tokenC, amountB, fee2, minLiquidityCheck);
          if (!amountC) continue;
          
          const amountFinal = await getQuote(network, tokenC, tokenA, amountC, fee3, minLiquidityCheck);
          if (!amountFinal) continue;
          
          const profit = amountFinal - amount;
          const profitPercent = (profit / amount) * 100;
          
          const netProfit = gasCost ? profit - gasCost.gasCostUSD : profit;
          const netProfitPercent = gasCost ? (netProfit / amount) * 100 : profitPercent;
          
          if (profitPercent > bestProfit) {
            bestProfit = profitPercent;
            bestResult = {
              path: `${tokenA} → ${tokenB} → ${tokenC} → ${tokenA}`,
              inputAmount: amount,
              outputAmount: amountFinal,
              profit: profit,
              profitPercent: profitPercent,
              gasCost: gasCost ? gasCost.gasCostUSD : 0,
              netProfit: netProfit,
              netProfitPercent: netProfitPercent,
              gasDetails: gasCost ? {
                gasPrice: gasCost.gasPrice.toFixed(2),
                gasLimit: gasCost.gasLimit,
                gasCostNative: gasCost.gasCostNative.toFixed(6),
                gasCostUSD: gasCost.gasCostUSD.toFixed(2),
                nativeToken: gasCost.nativeToken
              } : null,
              fees: [fee1, fee2, fee3],
              feesPercent: [(fee1/10000), (fee2/10000), (fee3/10000)],
              network: network,
              pathArray: [tokenA, tokenB, tokenC],
              addresses: [
                NETWORKS[network].tokens[tokenA].address,
                NETWORKS[network].tokens[tokenB].address,
                NETWORKS[network].tokens[tokenC].address
              ],
              timestamp: new Date().toISOString()
            };
          }
        } catch (error) {
          continue;
        }
      }
    }
  }
  
  return bestResult;
}

// Generate ALL triangular paths (one-time generation)
function generateAllPaths(network) {
  if (pathTracking[network].allPaths.length > 0) {
    return pathTracking[network].allPaths;
  }
  
  const tokens = Object.keys(NETWORKS[network].tokens);
  const allPaths = [];
  
  for (let i = 0; i < tokens.length; i++) {
    for (let j = 0; j < tokens.length; j++) {
      if (i === j) continue;
      for (let k = 0; k < tokens.length; k++) {
        if (k === i || k === j) continue;
        allPaths.push([tokens[i], tokens[j], tokens[k]]);
      }
    }
  }
  
  // Shuffle for randomization
  for (let i = allPaths.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [allPaths[i], allPaths[j]] = [allPaths[j], allPaths[i]];
  }
  
  pathTracking[network].allPaths = allPaths;
  console.log(`Generated ${allPaths.length} total triangular paths for ${network}`);
  
  return allPaths;
}

// Get next batch of 50 unscanned paths
function getNextBatch(network, batchSize = 50) {
  const tracking = pathTracking[network];
  const allPaths = tracking.allPaths;
  const batch = [];
  
  // If we've scanned all paths, reset
  if (tracking.totalScanned >= allPaths.length) {
    console.log(`\n🔄 All ${allPaths.length} paths scanned! Resetting and starting over...\n`);
    tracking.scannedPaths.clear();
    tracking.currentBatchIndex = 0;
    tracking.totalScanned = 0;
  }
  
  // Get next unscanned paths
  let index = tracking.currentBatchIndex;
  while (batch.length < batchSize && index < allPaths.length) {
    const path = allPaths[index];
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

// API Endpoints
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    networks: Object.keys(NETWORKS),
    tokenCounts: {
      arbitrum: Object.keys(NETWORKS.arbitrum.tokens).length,
      polygon: Object.keys(NETWORKS.polygon.tokens).length
    },
    pathTracking: {
      arbitrum: {
        totalPaths: pathTracking.arbitrum.allPaths.length,
        scannedPaths: pathTracking.arbitrum.totalScanned
      },
      polygon: {
        totalPaths: pathTracking.polygon.allPaths.length,
        scannedPaths: pathTracking.polygon.totalScanned
      }
    }
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

app.post('/scan', async (req, res) => {
  const { network, amount, minProfit, checkLiquidity = true } = req.body;
  
  if (!NETWORKS[network]) {
    return res.status(400).json({ error: 'Invalid network' });
  }
  
  try {
    // Generate all paths once
    const allPaths = generateAllPaths(network);
    
    // Get next batch of 50 unscanned paths
    const batch = getNextBatch(network, 50);
    
    const opportunities = [];
    
    console.log(`\n${'='.repeat(70)}`);
    console.log(`🚀 STARTING ARBITRAGE SCAN`);
    console.log(`${'='.repeat(70)}`);
    console.log(`Network: ${NETWORKS[network].name}`);
    console.log(`Input Amount: $${amount}`);
    console.log(`Min Profit: ${minProfit}%`);
    console.log(`Liquidity Check: ${checkLiquidity ? 'Enabled ✓' : 'Disabled ✗'}`);
    console.log(`Paths to Scan: ${batch.length}`);
    console.log(`Progress: Scanned ${pathTracking[network].totalScanned} / ${allPaths.length} total paths so far`);
    console.log(`${'='.repeat(70)}\n`);
    
    console.log('⛽ Fetching current gas prices...');
    const gasCost = await calculateGasCost(network);
    console.log(`   Gas Price: ${gasCost.gasPrice.toFixed(2)} GWEI`);
    console.log(`   Gas Limit: ${gasCost.gasLimit.toLocaleString()} units`);
    console.log(`   Gas Cost: $${gasCost.gasCostUSD.toFixed(2)} (${gasCost.gasCostNative.toFixed(6)} ${gasCost.nativeToken})`);
    console.log(`${'='.repeat(70)}\n`);
    
    for (let i = 0; i < batch.length; i++) {
      const path = batch[i];
      
      console.log(`\n[${i + 1}/${batch.length}]`);
      
      const result = await calculateArbitrage(network, path, amount, checkLiquidity, gasCost);
      
      if (result && result.netProfitPercent >= minProfit) {
        opportunities.push(result);
        console.log(`\n   ✅ PROFITABLE OPPORTUNITY FOUND!`);
        console.log(`   ${'─'.repeat(66)}`);
        console.log(`   Path: ${result.path}`);
        console.log(`   Gross Profit: $${result.profit.toFixed(2)} (+${result.profitPercent.toFixed(3)}%)`);
        console.log(`   Gas Cost: -$${result.gasCost.toFixed(2)} (${result.gasDetails.gasCostNative} ${result.gasDetails.nativeToken})`);
        console.log(`   Net Profit: $${result.netProfit.toFixed(2)} (+${result.netProfitPercent.toFixed(3)}%)`);
        console.log(`   Pool Fees: ${result.feesPercent.map(f => f.toFixed(2) + '%').join(' → ')}`);
        console.log(`   ${'─'.repeat(66)}\n`);
      }
      
      if ((i + 1) % 10 === 0) {
        console.log(`\n${'─'.repeat(70)}`);
        console.log(`📊 Progress Update: ${i + 1}/${batch.length} paths in this batch`);
        console.log(`📊 Overall Progress: ${pathTracking[network].totalScanned} / ${allPaths.length} total paths`);
        console.log(`💰 Profitable Found: ${opportunities.length}`);
        if (opportunities.length > 0) {
          console.log(`🏆 Best Net Profit: +${Math.max(...opportunities.map(o => o.netProfitPercent)).toFixed(3)}%`);
        }
        console.log(`${'─'.repeat(70)}\n`);
      }
    }
    
    opportunities.sort((a, b) => b.netProfitPercent - a.netProfitPercent);
    
    console.log(`\n${'='.repeat(70)}`);
    console.log(`✨ SCAN COMPLETE`);
    console.log(`${'='.repeat(70)}`);
    console.log(`Paths Scanned in This Batch: ${batch.length}`);
    console.log(`Total Paths Scanned So Far: ${pathTracking[network].totalScanned} / ${allPaths.length}`);
    console.log(`Profitable Opportunities: ${opportunities.length}`);
    if (opportunities.length > 0) {
      console.log(`Best Gross Profit: +${opportunities[0].profitPercent.toFixed(3)}%`);
      console.log(`Best Net Profit: +${opportunities[0].netProfitPercent.toFixed(3)}%`);
      console.log(`\n🎯 Top 5 Opportunities:`);
      opportunities.slice(0, 5).forEach((opp, idx) => {
        console.log(`  ${idx + 1}. ${opp.path}`);
        console.log(`     Gross: $${opp.profit.toFixed(2)} (+${opp.profitPercent.toFixed(3)}%)`);
        console.log(`     Gas: -$${opp.gasCost.toFixed(2)} (${opp.gasDetails.gasCostNative} ${opp.gasDetails.nativeToken})`);
        console.log(`     Net: $${opp.netProfit.toFixed(2)} (+${opp.netProfitPercent.toFixed(3)}%)`);
      });
    } else {
      console.log(`No profitable opportunities found in this batch.`);
    }
    
    // Show if all paths have been scanned
    if (pathTracking[network].totalScanned >= allPaths.length) {
      console.log(`\n🎉 ALL PATHS SCANNED! Next scan will start from the beginning.`);
    }
    
    console.log(`${'='.repeat(70)}\n`);
    
    res.json({
      success: true,
      network: NETWORKS[network].name,
      scanned: batch.length,
      opportunities: opportunities.slice(0, 20),
      gasCost: {
        gasPrice: gasCost.gasPrice.toFixed(2),
        gasCostUSD: gasCost.gasCostUSD.toFixed(2),
        gasCostNative: gasCost.gasCostNative.toFixed(6),
        nativeToken: gasCost.nativeToken
      },
      stats: {
        total: opportunities.length,
        bestProfit: opportunities[0]?.profitPercent || 0,
        bestNetProfit: opportunities[0]?.netProfitPercent || 0,
        totalPaths: allPaths.length,
        scannedSoFar: pathTracking[network].totalScanned,
        percentComplete: ((pathTracking[network].totalScanned / allPaths.length) * 100).toFixed(2)
      }
    });
    
  } catch (error) {
    console.error('❌ Scan error:', error);
    res.status(500).json({ error: error.message });
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
  const { network } = req.body;
  
  if (!NETWORKS[network]) {
    return res.status(400).json({ error: 'Invalid network' });
  }
  
  pathTracking[network].scannedPaths.clear();
  pathTracking[network].currentBatchIndex = 0;
  pathTracking[network].totalScanned = 0;
  
  console.log(`🔄 Reset path tracking for ${network}`);
  
  res.json({
    success: true,
    message: `Path tracking reset for ${network}`,
    totalPaths: pathTracking[network].allPaths.length
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
    const { network, amount, minProfit, checkLiquidity = true } = config;
    
    if (activeScans.has(socket.id)) {
      activeScans.get(socket.id).stop = true;
    }
    
    const scanState = { stop: false };
    activeScans.set(socket.id, scanState);
    
    console.log(`🔄 Starting continuous scan for ${socket.id} on ${network}`);
    
    const runScan = async () => {
      if (scanState.stop) return;
      
      try {
        const allPaths = generateAllPaths(network);
        const gasCost = await calculateGasCost(network);
        
        // Get next batch
        const batch = getNextBatch(network, 50);
        
        if (batch.length === 0) {
          socket.emit('scanComplete', { 
            message: 'All paths scanned. Restarting...',
            totalScanned: pathTracking[network].totalScanned,
            totalPaths: allPaths.length
          });
          setTimeout(runScan, 2000);
          return;
        }
        
        for (let i = 0; i < batch.length && !scanState.stop; i++) {
          const path = batch[i];
          const result = await calculateArbitrage(network, path, amount, checkLiquidity, gasCost);
          
          if (result && result.netProfitPercent >= minProfit) {
            socket.emit('opportunity', result);
          }
          
          socket.emit('progress', {
            scanned: i + 1,
            batchTotal: batch.length,
            totalScanned: pathTracking[network].totalScanned,
            totalPaths: allPaths.length,
            percentComplete: ((pathTracking[network].totalScanned / allPaths.length) * 100).toFixed(2)
          });
          
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        socket.emit('batchComplete', {
          message: 'Batch complete',
          totalScanned: pathTracking[network].totalScanned,
          totalPaths: allPaths.length
        });
        
        setTimeout(runScan, 1000);
        
      } catch (error) {
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
║   💎 Progressive Path Scanning with Gas Calculation           ║
║                                                                ║
║   Running on port ${PORT}                                        ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝

📊 Networks Available:
   • Arbitrum (${Object.keys(NETWORKS.arbitrum.tokens).length} tokens) - Gas: ${NETWORKS.arbitrum.nativeToken}
   • Polygon (${Object.keys(NETWORKS.polygon.tokens).length} tokens) - Gas: ${NETWORKS.polygon.nativeToken}

💰 Fee Tiers: ${POOL_FEES.map(f => (f/10000) + '%').join(', ')}

📡 API Endpoints:
   GET  /health              - Server health check
   GET  /tokens/:network     - Get token list
   POST /scan                - Scan next batch of 50 paths
   POST /check-liquidity     - Check pool liquidity
   POST /reset-tracking      - Reset path tracking

🔌 WebSocket: ws://localhost:${PORT}

🌐 Frontend: http://localhost:${PORT}

✅ Ready to scan! Each scan processes 50 new paths.
✨ Tracks progress and resets after all paths scanned!
  `);
});
