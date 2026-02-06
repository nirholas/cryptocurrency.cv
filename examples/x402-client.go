// x402 Payment Client Example - Go
//
// This example shows how to make authenticated API calls using x402 payments.
//
// Requirements:
//   go get github.com/ethereum/go-ethereum
//
// Usage:
//   export WALLET_PRIVATE_KEY="your_private_key_here"
//   go run x402-client.go
//
// See: https://docs.x402.org

package main

import (
	"bytes"
	"crypto/ecdsa"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/ethereum/go-ethereum/common/hexutil"
	"github.com/ethereum/go-ethereum/crypto"
)

// =============================================================================
// CONFIGURATION
// =============================================================================

const APIBase = "https://cryptocurrency.cv"

var privateKey *ecdsa.PrivateKey
var walletAddress string

func init() {
	keyHex := os.Getenv("WALLET_PRIVATE_KEY")
	if keyHex == "" {
		fmt.Println("Warning: WALLET_PRIVATE_KEY not set. Using demo mode.")
		keyHex = "0x" + strings.Repeat("0", 64)
	}

	// Remove 0x prefix if present
	keyHex = strings.TrimPrefix(keyHex, "0x")

	keyBytes, err := hex.DecodeString(keyHex)
	if err != nil {
		fmt.Printf("Error decoding private key: %v\n", err)
		os.Exit(1)
	}

	privateKey, err = crypto.ToECDSA(keyBytes)
	if err != nil {
		fmt.Printf("Error creating private key: %v\n", err)
		os.Exit(1)
	}

	publicKey := privateKey.Public()
	publicKeyECDSA, ok := publicKey.(*ecdsa.PublicKey)
	if !ok {
		fmt.Println("Error casting public key")
		os.Exit(1)
	}

	walletAddress = crypto.PubkeyToAddress(*publicKeyECDSA).Hex()
	fmt.Printf("Wallet address: %s\n", walletAddress)
}

// =============================================================================
// X402 PAYMENT HANDLING
// =============================================================================

// PaymentRequirements represents parsed 402 response
type PaymentRequirements struct {
	Version  int    `json:"x402Version"`
	Network  string `json:"network"`
	Amount   string `json:"maxAmountRequired"`
	PayTo    string `json:"payTo"`
	Asset    string `json:"asset"`
	Nonce    string `json:"paymentNonce"`
	Resource string `json:"resource"`
}

// X402Response represents the 402 response structure
type X402Response struct {
	Error   string `json:"error"`
	X402    struct {
		Version int `json:"x402Version"`
		Accepts []struct {
			Network   string `json:"network"`
			Amount    string `json:"maxAmountRequired"`
			PayTo     string `json:"payTo"`
			Asset     string `json:"asset"`
			Nonce     string `json:"paymentNonce"`
			Resource  string `json:"resource"`
		} `json:"accepts"`
	} `json:"x402"`
}

// Parse402Response extracts payment requirements from 402 response
func Parse402Response(body []byte) (*PaymentRequirements, error) {
	var resp X402Response
	if err := json.Unmarshal(body, &resp); err != nil {
		return nil, err
	}

	if len(resp.X402.Accepts) == 0 {
		return nil, fmt.Errorf("no accepted payment methods")
	}

	accept := resp.X402.Accepts[0]
	return &PaymentRequirements{
		Version:  resp.X402.Version,
		Network:  accept.Network,
		Amount:   accept.Amount,
		PayTo:    accept.PayTo,
		Asset:    accept.Asset,
		Nonce:    accept.Nonce,
		Resource: accept.Resource,
	}, nil
}

// CreatePaymentSignature creates an x402 payment signature
//
// Note: This is simplified. Production should use official x402-go SDK.
func CreatePaymentSignature(req *PaymentRequirements) (string, error) {
	// Create payment message
	message := map[string]interface{}{
		"network":   req.Network,
		"amount":    req.Amount,
		"payTo":     req.PayTo,
		"asset":     req.Asset,
		"nonce":     req.Nonce,
		"resource":  req.Resource,
		"timestamp": time.Now().Unix(),
	}

	msgBytes, err := json.Marshal(message)
	if err != nil {
		return "", err
	}

	// Create Ethereum signed message hash
	prefixedMsg := fmt.Sprintf("\x19Ethereum Signed Message:\n%d%s", len(msgBytes), msgBytes)
	hash := crypto.Keccak256Hash([]byte(prefixedMsg))

	// Sign the message
	signature, err := crypto.Sign(hash.Bytes(), privateKey)
	if err != nil {
		return "", err
	}

	return hexutil.Encode(signature), nil
}

// MakePaidRequest makes an API request with x402 payment handling
func MakePaidRequest(endpoint, method string, body []byte) ([]byte, error) {
	url := APIBase + endpoint

	// Initial request
	var req *http.Request
	var err error

	if body != nil {
		req, err = http.NewRequest(method, url, bytes.NewReader(body))
	} else {
		req, err = http.NewRequest(method, url, nil)
	}
	if err != nil {
		return nil, err
	}

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	// Handle 402 Payment Required
	if resp.StatusCode == 402 {
		fmt.Printf("💰 Payment required for %s\n", endpoint)

		requirements, err := Parse402Response(respBody)
		if err != nil {
			return nil, fmt.Errorf("failed to parse 402 response: %w", err)
		}

		fmt.Printf("  Network: %s\n", requirements.Network)
		fmt.Printf("  Amount: %s (USDC units)\n", requirements.Amount)
		fmt.Printf("  PayTo: %s\n", requirements.PayTo)

		// Create payment signature
		signature, err := CreatePaymentSignature(requirements)
		if err != nil {
			return nil, fmt.Errorf("failed to create signature: %w", err)
		}

		// Retry with payment header
		if body != nil {
			req, _ = http.NewRequest(method, url, bytes.NewReader(body))
		} else {
			req, _ = http.NewRequest(method, url, nil)
		}
		req.Header.Set("X-Payment", signature)

		resp, err = client.Do(req)
		if err != nil {
			return nil, err
		}
		defer resp.Body.Close()

		respBody, err = io.ReadAll(resp.Body)
		if err != nil {
			return nil, err
		}

		if resp.StatusCode == 200 {
			fmt.Println("  ✅ Payment successful!")
		}
	}

	if resp.StatusCode != 200 {
		return nil, fmt.Errorf("API error: %d", resp.StatusCode)
	}

	return respBody, nil
}

// =============================================================================
// API FUNCTIONS
// =============================================================================

// NewsResponse represents the news API response
type NewsResponse struct {
	Articles []struct {
		Title  string `json:"title"`
		Source string `json:"source"`
	} `json:"articles"`
}

func fetchNews() {
	fmt.Println("\n📰 Fetching crypto news...")

	data, err := MakePaidRequest("/api/v1/news", "GET", nil)
	if err != nil {
		fmt.Printf("❌ Error: %v\n", err)
		return
	}

	var resp NewsResponse
	if err := json.Unmarshal(data, &resp); err != nil {
		fmt.Printf("❌ Parse error: %v\n", err)
		return
	}

	fmt.Printf("✅ Received %d articles\n", len(resp.Articles))
	if len(resp.Articles) > 0 {
		fmt.Printf("  Latest: %s\n", resp.Articles[0].Title)
	}
}

func checkDiscovery() {
	fmt.Println("\n🔍 Checking available endpoints...")

	resp, err := http.Get(APIBase + "/api/.well-known/x402")
	if err != nil {
		fmt.Printf("❌ Error: %v\n", err)
		return
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)

	var discovery struct {
		Resources []struct {
			Path  string `json:"path"`
			Price string `json:"price"`
		} `json:"resources"`
	}

	if err := json.Unmarshal(body, &discovery); err != nil {
		fmt.Printf("❌ Parse error: %v\n", err)
		return
	}

	fmt.Printf("✅ Found %d paid endpoints:\n", len(discovery.Resources))
	for i, r := range discovery.Resources {
		if i >= 5 {
			fmt.Printf("  ... and %d more\n", len(discovery.Resources)-5)
			break
		}
		fmt.Printf("  - %s (%s)\n", r.Path, r.Price)
	}
}

// =============================================================================
// MAIN
// =============================================================================

func main() {
	fmt.Println("🚀 x402 Payment Client - Go Example")
	fmt.Println(strings.Repeat("=", 50))

	// Check discovery endpoint first (free)
	checkDiscovery()

	// Fetch data with payments
	fetchNews()

	fmt.Println()
	fmt.Println(strings.Repeat("=", 50))
	fmt.Println("✅ Examples complete!")
	fmt.Println()
	fmt.Println("Note: This is a demo. For production, use:")
	fmt.Println("  go get github.com/coinbase/x402-go")
}
