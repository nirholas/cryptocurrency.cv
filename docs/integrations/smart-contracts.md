# Smart Contracts

Solidity smart contracts for on-chain crypto news data.

## CryptoNewsOracle

The `CryptoNewsOracle` contract fetches crypto news sentiment data from the Free Crypto News API via Chainlink oracles.

### Features

- **Real-time sentiment** - On-chain market sentiment (0-100)
- **Fear & Greed Index** - Crypto market emotions
- **Breaking news count** - Number of current breaking stories
- **Data freshness checks** - Verify data recency
- **Packed data format** - Gas-efficient updates

---

## Contract Source

📁 Location: [contracts/CryptoNewsOracle.sol](../../contracts/CryptoNewsOracle.sol)

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@chainlink/contracts/src/v0.8/ChainlinkClient.sol";
import "@chainlink/contracts/src/v0.8/shared/access/ConfirmedOwner.sol";

contract CryptoNewsOracle is ChainlinkClient, ConfirmedOwner {
    using Chainlink for Chainlink.Request;

    // Oracle data
    uint256 public sentiment;        // 0-100 sentiment score
    uint256 public fearGreed;        // 0-100 fear & greed index
    uint256 public breakingCount;    // Number of breaking news
    uint256 public lastUpdate;       // Timestamp of last update

    string public oracleUrl = "https://cryptocurrency.cv/api/oracle/chainlink?format=standard";
    
    // ... (full source in contracts/)
}
```

---

## Deployment

### Prerequisites

1. **Chainlink LINK tokens** - Required for oracle requests
2. **Chainlink oracle address** - For your target network
3. **Job ID** - HTTP GET job specification

### Network Configuration

| Network | LINK Token | Oracle | Job ID |
|---------|------------|--------|--------|
| Ethereum Mainnet | 0x514910... | [Chainlink Market](https://market.link) | Node-specific |
| Sepolia | 0x779877... | 0x6090... | `ca98366c...` |
| Polygon | 0xb0897... | [Chainlink Market](https://market.link) | Node-specific |
| Arbitrum | 0xf97f4... | [Chainlink Market](https://market.link) | Node-specific |

### Deploy with Hardhat

```bash
npm install @chainlink/contracts @openzeppelin/contracts hardhat
```

**hardhat.config.js:**
```javascript
require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

module.exports = {
  solidity: "0.8.19",
  networks: {
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL,
      accounts: [process.env.PRIVATE_KEY]
    },
    polygon: {
      url: process.env.POLYGON_RPC_URL,
      accounts: [process.env.PRIVATE_KEY]
    }
  }
};
```

**Deploy script:**
```javascript
const hre = require("hardhat");

async function main() {
  // Sepolia configuration
  const linkToken = "0x779877A7B0D9E8603169DdbD7836e478b4624789";
  const oracle = "0x6090149792dAAeE9D1D568c9f9a6F6B46AA29eFD";
  const jobId = ethers.encodeBytes32String("ca98366cc7314957b8c012c72f05aeeb");
  const fee = ethers.parseEther("0.1");  // 0.1 LINK

  const CryptoNewsOracle = await hre.ethers.getContractFactory("CryptoNewsOracle");
  const oracle = await CryptoNewsOracle.deploy(linkToken, oracle, jobId, fee);
  
  await oracle.waitForDeployment();
  console.log("CryptoNewsOracle deployed to:", await oracle.getAddress());
}

main().catch(console.error);
```

**Deploy:**
```bash
npx hardhat run scripts/deploy.js --network sepolia
```

### Deploy with Foundry

```bash
forge install smartcontractkit/chainlink
```

```bash
forge create --rpc-url $SEPOLIA_RPC \
  --private-key $PRIVATE_KEY \
  --constructor-args \
    0x779877A7B0D9E8603169DdbD7836e478b4624789 \
    0x6090149792dAAeE9D1D568c9f9a6F6B46AA29eFD \
    0x6361393836366363373331343935376238633031326337326630356165656200 \
    100000000000000000 \
  src/CryptoNewsOracle.sol:CryptoNewsOracle
```

---

## Usage

### Request Sentiment Data

```solidity
// Request sentiment (requires LINK tokens)
bytes32 requestId = oracle.requestSentiment();

// Or request full packed data
bytes32 requestId = oracle.requestFullData();
```

### Read Oracle Data

```solidity
// Get individual values
uint256 sentiment = oracle.sentiment();
uint256 fearGreed = oracle.fearGreed();
uint256 breakingCount = oracle.breakingCount();

// Get all data at once
(
    uint256 sentiment,
    uint256 fearGreed,
    uint256 breaking,
    uint256 lastUpdate,
    bool isFresh
) = oracle.getOracleData();
```

### Market Conditions

```solidity
// Check market state
bool bullish = oracle.isBullish();      // sentiment > 60
bool bearish = oracle.isBearish();      // sentiment < 40
bool extremeFear = oracle.isExtremeFear();    // fearGreed < 25
bool extremeGreed = oracle.isExtremeGreed();  // fearGreed > 75

// Verify data freshness (< 1 hour old)
bool fresh = oracle.isDataFresh();
```

---

## Integration Examples

### DeFi Protocol Integration

```solidity
import "./CryptoNewsOracle.sol";

contract SentimentBasedVault {
    CryptoNewsOracle public oracle;
    
    constructor(address _oracle) {
        oracle = CryptoNewsOracle(_oracle);
    }
    
    function shouldReduceExposure() public view returns (bool) {
        // Reduce exposure during extreme fear
        return oracle.isExtremeFear() && oracle.isDataFresh();
    }
    
    function shouldIncreaseExposure() public view returns (bool) {
        // Increase exposure when bullish + greed
        return oracle.isBullish() && 
               oracle.isExtremeGreed() == false &&
               oracle.isDataFresh();
    }
    
    function getRebalanceAction() public view returns (string memory) {
        if (!oracle.isDataFresh()) return "HOLD";
        
        (uint256 sentiment, uint256 fearGreed, , , ) = oracle.getOracleData();
        
        if (sentiment > 70 && fearGreed > 60) return "REDUCE";
        if (sentiment < 30 && fearGreed < 40) return "ACCUMULATE";
        
        return "HOLD";
    }
}
```

### Trading Bot Integration

```solidity
contract NewsDrivenTrader {
    CryptoNewsOracle public oracle;
    
    event TradeSignal(string action, uint256 sentiment, uint256 confidence);
    
    function evaluateTrade() public view returns (
        string memory action,
        uint256 confidence
    ) {
        require(oracle.isDataFresh(), "Stale data");
        
        uint256 sentiment = oracle.sentiment();
        uint256 fearGreed = oracle.fearGreed();
        
        // High sentiment + moderate greed = potential long
        if (sentiment > 65 && fearGreed > 50 && fearGreed < 75) {
            return ("LONG", sentiment);
        }
        
        // Low sentiment + extreme fear = contrarian long
        if (sentiment < 35 && fearGreed < 25) {
            return ("LONG", 100 - sentiment);  // Higher confidence on extreme
        }
        
        // Very high sentiment + extreme greed = potential short
        if (sentiment > 80 && fearGreed > 80) {
            return ("SHORT", sentiment);
        }
        
        return ("NEUTRAL", 50);
    }
}
```

### DAO Governance

```solidity
contract SentimentWeightedVoting {
    CryptoNewsOracle public oracle;
    
    // Weight votes based on market conditions
    function getVoteWeight(address voter) public view returns (uint256) {
        uint256 baseWeight = getBaseVotingPower(voter);
        
        // During extreme conditions, weight long-term holders more
        if (oracle.isExtremeFear() || oracle.isExtremeGreed()) {
            uint256 holdingDuration = getHoldingDuration(voter);
            return baseWeight * (100 + holdingDuration / 30 days) / 100;
        }
        
        return baseWeight;
    }
}
```

---

## API Integration

The contract fetches data from:

```
https://cryptocurrency.cv/api/oracle/chainlink?format=standard
```

### Response Format

**Standard format:**
```json
{
  "data": {
    "sentiment": 65,
    "fearGreed": 58,
    "breakingCount": 3,
    "timestamp": 1703894400
  },
  "meta": {
    "round": 12345,
    "source": "free-crypto-news"
  }
}
```

**Packed format** (gas-efficient):
```json
{
  "data": {
    "result": "0x41003A030000000065A1B2C0"
  }
}
```

The packed format encodes:
- Bytes 0: Sentiment (0-100)
- Bytes 1: Fear & Greed (0-100)
- Bytes 2: Breaking count
- Bytes 3: Narrative code
- Bytes 4-7: Timestamp (uint32)

---

## Gas Costs

| Function | Estimated Gas |
|----------|---------------|
| `requestSentiment()` | ~150,000 |
| `requestFullData()` | ~150,000 |
| `fulfill()` | ~50,000 |
| `fulfillFullData()` | ~60,000 |
| `getOracleData()` (view) | Free |

---

## Events

```solidity
event SentimentUpdated(
    uint256 sentiment,
    uint256 fearGreed,
    uint256 timestamp
);

event RequestFulfilled(
    bytes32 indexed requestId,
    uint256 sentiment
);
```

### Listen for Updates

```javascript
const { ethers } = require("ethers");

const oracle = new ethers.Contract(ORACLE_ADDRESS, ORACLE_ABI, provider);

oracle.on("SentimentUpdated", (sentiment, fearGreed, timestamp) => {
  console.log(`Sentiment: ${sentiment}, Fear/Greed: ${fearGreed}`);
  console.log(`Updated at: ${new Date(timestamp * 1000)}`);
});
```

---

## Security Considerations

1. **Data freshness** - Always check `isDataFresh()` before using oracle data
2. **Single source** - Oracle currently uses one API source; consider aggregation for production
3. **LINK balance** - Ensure contract has LINK tokens for requests
4. **Access control** - Admin functions are owner-only
5. **Rate limiting** - The API has rate limits; don't request too frequently

---

## Testing

```javascript
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CryptoNewsOracle", function () {
  let oracle;

  beforeEach(async function () {
    // Deploy mock LINK and oracle for testing
    const MockLink = await ethers.getContractFactory("MockLinkToken");
    const mockLink = await MockLink.deploy();

    const Oracle = await ethers.getContractFactory("CryptoNewsOracle");
    oracle = await Oracle.deploy(
      mockLink.address,
      ethers.constants.AddressZero,
      ethers.constants.HashZero,
      0
    );
  });

  it("should return bullish when sentiment > 60", async function () {
    // Simulate fulfillment
    await oracle.setForTesting(65, 50, 2);
    expect(await oracle.isBullish()).to.be.true;
  });

  it("should detect extreme fear", async function () {
    await oracle.setForTesting(30, 20, 1);
    expect(await oracle.isExtremeFear()).to.be.true;
  });
});
```

---

## Related

- [Web3 Integrations](web3.md)
- [Chainlink Oracle API](../API.md#oracle)
- [Real-Time Data](../REALTIME.md)
