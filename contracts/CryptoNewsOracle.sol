// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@chainlink/contracts/src/v0.8/ChainlinkClient.sol";
import "@chainlink/contracts/src/v0.8/shared/access/ConfirmedOwner.sol";

/**
 * @title CryptoNewsOracle
 * @notice Fetches crypto news sentiment data from Free Crypto News API via Chainlink
 * @dev Uses Chainlink Any API to fetch off-chain news data
 */
contract CryptoNewsOracle is ChainlinkClient, ConfirmedOwner {
    using Chainlink for Chainlink.Request;

    // Oracle data
    uint256 public sentiment;        // 0-100 sentiment score
    uint256 public fearGreed;        // 0-100 fear & greed index
    uint256 public breakingCount;    // Number of breaking news
    uint256 public lastUpdate;       // Timestamp of last update
    bytes32 public dataHash;         // Hash for verification

    // Chainlink config
    bytes32 private jobId;
    uint256 private fee;
    string public oracleUrl = "https://cryptocurrency.cv/api/oracle/chainlink?format=standard";

    // Events
    event SentimentUpdated(uint256 sentiment, uint256 fearGreed, uint256 timestamp);
    event RequestFulfilled(bytes32 indexed requestId, uint256 sentiment);

    /**
     * @notice Initialize the oracle
     * @param _link LINK token address
     * @param _oracle Chainlink oracle address
     * @param _jobId Job ID for HTTP GET
     * @param _fee Fee in LINK
     */
    constructor(
        address _link,
        address _oracle,
        bytes32 _jobId,
        uint256 _fee
    ) ConfirmedOwner(msg.sender) {
        _setChainlinkToken(_link);
        _setChainlinkOracle(_oracle);
        jobId = _jobId;
        fee = _fee;
    }

    /**
     * @notice Request sentiment data from the oracle
     * @return requestId The Chainlink request ID
     */
    function requestSentiment() public returns (bytes32 requestId) {
        Chainlink.Request memory req = _buildChainlinkRequest(
            jobId,
            address(this),
            this.fulfill.selector
        );
        
        req._add("get", oracleUrl);
        req._add("path", "data,sentiment");
        req._addInt("times", 1);
        
        return _sendChainlinkRequest(req, fee);
    }

    /**
     * @notice Callback function for Chainlink
     * @param _requestId The request ID
     * @param _sentiment The sentiment value
     */
    function fulfill(bytes32 _requestId, uint256 _sentiment) public recordChainlinkFulfillment(_requestId) {
        sentiment = _sentiment;
        lastUpdate = block.timestamp;
        
        emit RequestFulfilled(_requestId, _sentiment);
        emit SentimentUpdated(_sentiment, fearGreed, block.timestamp);
    }

    /**
     * @notice Request full oracle data (packed format)
     * @return requestId The Chainlink request ID
     */
    function requestFullData() public returns (bytes32 requestId) {
        Chainlink.Request memory req = _buildChainlinkRequest(
            jobId,
            address(this),
            this.fulfillFullData.selector
        );
        
        req._add("get", string(abi.encodePacked(oracleUrl, "&format=packed")));
        req._add("path", "data,result");
        
        return _sendChainlinkRequest(req, fee);
    }

    /**
     * @notice Callback for full data
     * @param _requestId The request ID
     * @param _packedData Packed data (sentiment|fearGreed|breaking|narrative|timestamp)
     */
    function fulfillFullData(bytes32 _requestId, uint256 _packedData) public recordChainlinkFulfillment(_requestId) {
        // Unpack data
        sentiment = (_packedData >> 56) & 0xFF;
        fearGreed = (_packedData >> 48) & 0xFF;
        breakingCount = (_packedData >> 40) & 0xFF;
        lastUpdate = block.timestamp;
        
        emit SentimentUpdated(sentiment, fearGreed, block.timestamp);
    }

    /**
     * @notice Check if market is bullish
     * @return True if sentiment > 60
     */
    function isBullish() public view returns (bool) {
        return sentiment > 60;
    }

    /**
     * @notice Check if market is bearish
     * @return True if sentiment < 40
     */
    function isBearish() public view returns (bool) {
        return sentiment < 40;
    }

    /**
     * @notice Check if there's extreme fear
     * @return True if fear & greed < 25
     */
    function isExtremeFear() public view returns (bool) {
        return fearGreed < 25;
    }

    /**
     * @notice Check if there's extreme greed
     * @return True if fear & greed > 75
     */
    function isExtremeGreed() public view returns (bool) {
        return fearGreed > 75;
    }

    /**
     * @notice Check if data is fresh (< 1 hour old)
     * @return True if data was updated within the last hour
     */
    function isDataFresh() public view returns (bool) {
        return block.timestamp - lastUpdate < 1 hours;
    }

    /**
     * @notice Get all oracle data
     * @return All oracle values
     */
    function getOracleData() public view returns (
        uint256 _sentiment,
        uint256 _fearGreed,
        uint256 _breakingCount,
        uint256 _lastUpdate,
        bool _isFresh
    ) {
        return (
            sentiment,
            fearGreed,
            breakingCount,
            lastUpdate,
            isDataFresh()
        );
    }

    // Admin functions
    function setOracleUrl(string memory _url) public onlyOwner {
        oracleUrl = _url;
    }

    function setJobId(bytes32 _jobId) public onlyOwner {
        jobId = _jobId;
    }

    function setFee(uint256 _fee) public onlyOwner {
        fee = _fee;
    }

    function withdrawLink() public onlyOwner {
        LinkTokenInterface link = LinkTokenInterface(_chainlinkTokenAddress());
        require(link.transfer(msg.sender, link.balanceOf(address(this))), "Transfer failed");
    }
}
