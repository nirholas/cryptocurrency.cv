# Lifecycle Hooks
Source: https://docs.x402.org/advanced-concepts/lifecycle-hooks

This page explains how to use lifecycle hooks to customize x402 payment flows.

Hooks allow you to intercept and modify payment lifecycle events on clients, servers and facilitators.

## Server Hooks

### x402ResourceServer (Transport-agnostic)

Register hooks on the core resource server for verification and settlement lifecycle events. Use cases include logging payments, recording analytics, implementing custom access control or recovering from transient failures.

* **onBeforeVerify** — Runs before payment verification. Return `{ abort: true, reason }` to reject.
* **onAfterVerify** — Runs after successful verification.
* **onVerifyFailure** — Runs on verification failure. Return `{ recovered: true, result }` to override.
* **onBeforeSettle** — Runs before settlement. Return `{ abort: true, reason }` to reject.
* **onAfterSettle** — Runs after successful settlement.
* **onSettleFailure** — Runs on settlement failure. Return `{ recovered: true, result }` to override.

<Tabs>
  <Tab title="TypeScript">
    ```typescript theme={null}
    import { x402ResourceServer } from "@x402/core";

    const server = new x402ResourceServer(facilitatorClient);

    server.onAfterSettle(async (context) => {
      await recordPayment({
        payer: context.result.payer,
        transaction: context.result.transaction,
        amount: context.requirements.amount,
        network: context.requirements.network,
      });
    });
    ```
  </Tab>

  <Tab title="Python">
    ```python theme={null}
    from x402 import x402ResourceServer

    server = x402ResourceServer(facilitator_client)

    async def record_payment(context):
        await db.record_payment(
            payer=context.result.payer,
            transaction=context.result.transaction,
            amount=context.requirements.amount,
            network=context.requirements.network,
        )

    server.on_after_settle(record_payment)
    ```

    For synchronous applications, use `x402ResourceServerSync`:

    ```python theme={null}
    from x402 import x402ResourceServerSync

    server = x402ResourceServerSync(facilitator_client)

    def record_payment(context):
        db.record_payment(
            payer=context.result.payer,
            transaction=context.result.transaction,
        )

    server.on_after_settle(record_payment)
    ```
  </Tab>

  <Tab title="Go">
    ```go theme={null}
    import x402 "github.com/coinbase/x402/go"

    server := x402.Newx402ResourceServer(facilitatorClient)

    server.OnAfterSettle(func(ctx x402.SettleResultContext) error {
        return db.RecordPayment(Payment{
            Payer:       ctx.Result.Payer,
            Transaction: ctx.Result.Transaction,
            Amount:      ctx.Requirements.Amount,
            Network:     ctx.Requirements.Network,
        })
    })
    ```
  </Tab>
</Tabs>

### x402HTTPResourceServer (HTTP)

Register hooks for HTTP-specific request handling before payment processing. Use cases include bypassing payment for API key holders, granting access to subscribers or blocking specific clients.

* **onProtectedRequest** — Runs on every request to a protected route.
  * Return `{ grantAccess: true }` to bypass payment.
  * Return `{ abort: true, reason }` to return 403.
  * Return `void` to continue to payment flow.

<Tabs>
  <Tab title="TypeScript">
    ```typescript theme={null}
    import { x402ResourceServer, x402HTTPResourceServer } from "@x402/core";

    const server = new x402ResourceServer(facilitatorClient);
    const httpServer = new x402HTTPResourceServer(server, routes);

    httpServer.onProtectedRequest(async (context, routeConfig) => {
      const apiKey = context.adapter.getHeader("X-API-Key");

      if (apiKey && await isValidApiKey(apiKey)) {
        return { grantAccess: true };
      }

      // No valid API key — continue to payment flow
    });
    ```
  </Tab>

  <Tab title="Python">
    *Coming soon.*
  </Tab>

  <Tab title="Go">
    *Coming soon.*
  </Tab>
</Tabs>

## Client Hooks

### x402Client (Transport-agnostic)

Register hooks on the core client for payment payload creation lifecycle events. Common use cases include enforcing spending limits, requiring approval for large payments or logging outgoing transactions.

* **onBeforePaymentCreation** — Runs before creating a payment payload. Return `{ abort: true, reason }` to cancel.
* **onAfterPaymentCreation** — Runs after successful payload creation.
* **onPaymentCreationFailure** — Runs on failure. Return `{ recovered: true, payload }` to provide fallback.

<Tabs>
  <Tab title="TypeScript">
    ```typescript theme={null}
    import { x402Client } from "@x402/core";

    const client = new x402Client();

    client.onBeforePaymentCreation(async (context) => {
      const maxAmount = BigInt("10000000"); // 10 USDC
      const requestedAmount = BigInt(context.selectedRequirements.amount);

      if (requestedAmount > maxAmount) {
        return { abort: true, reason: "Payment exceeds spending limit" };
      }
    });
    ```
  </Tab>

  <Tab title="Python">
    ```python theme={null}
    from x402 import x402Client
    from x402.types import AbortResult

    client = x402Client()

    async def enforce_spending_limit(context):
        max_amount = 10_000_000  # 10 USDC
        requested_amount = int(context.selected_requirements.amount)

        if requested_amount > max_amount:
            return AbortResult(abort=True, reason="Payment exceeds spending limit")

    client.on_before_payment_creation(enforce_spending_limit)
    ```

    For synchronous applications, use `x402ClientSync`:

    ```python theme={null}
    from x402 import x402ClientSync
    from x402.types import AbortResult

    client = x402ClientSync()

    def enforce_spending_limit(context):
        max_amount = 10_000_000  # 10 USDC
        requested_amount = int(context.selected_requirements.amount)

        if requested_amount > max_amount:
            return AbortResult(abort=True, reason="Payment exceeds spending limit")

    client.on_before_payment_creation(enforce_spending_limit)
    ```
  </Tab>

  <Tab title="Go">
    ```go theme={null}
    import x402 "github.com/coinbase/x402/go"

    client := x402.Newx402Client()

    client.OnBeforePaymentCreation(func(ctx x402.PaymentCreationContext) (*x402.BeforePaymentCreationResult, error) {
        maxAmount := big.NewInt(10_000_000) // 10 USDC
        requestedAmount := new(big.Int)
        requestedAmount.SetString(ctx.Requirements.Amount, 10)

        if requestedAmount.Cmp(maxAmount) > 0 {
            return &x402.BeforePaymentCreationResult{
                Abort:  true,
                Reason: "Payment exceeds spending limit",
            }, nil
        }
        return nil, nil
    })
    ```
  </Tab>
</Tabs>

### x402HTTPClient (HTTP)

Register hooks for HTTP-specific payment required handling. Use cases include trying API key authentication before paying or prompting users for payment confirmation.

* **onPaymentRequired** — Runs when a 402 response is received.
  * Return `{ headers }` to retry with alternate headers before paying.
  * Return `void` to proceed directly to payment.

<Tabs>
  <Tab title="TypeScript">
    ```typescript theme={null}
    import { x402Client, x402HTTPClient } from "@x402/core";

    const client = new x402Client();
    const httpClient = new x402HTTPClient(client);

    httpClient.onPaymentRequired(async ({ paymentRequired }) => {
      // Try API key authentication first
      const apiKey = process.env.API_KEY;
      if (apiKey) {
        return { headers: { "Authorization": `Bearer ${apiKey}` } };
      }
      // Return void to proceed with payment
    });
    ```
  </Tab>

  <Tab title="Python">
    *Coming soon.*
  </Tab>

  <Tab title="Go">
    *Coming soon.*
  </Tab>
</Tabs>

## Facilitator Hooks

### x402Facilitator

Register hooks on the facilitator for verification and settlement lifecycle events. Use cases include populating a bazaar discovery catalog, compliance checks or collecting metrics across all processed payments.

* **onBeforeVerify / onAfterVerify / onVerifyFailure** — Same pattern as server hooks.
* **onBeforeSettle / onAfterSettle / onSettleFailure** — Same pattern as server hooks.

<Tabs>
  <Tab title="TypeScript">
    ```typescript theme={null}
    import { x402Facilitator } from "@x402/core";
    import { extractDiscoveryInfo } from "@x402/extensions/bazaar";

    const facilitator = new x402Facilitator();

    facilitator.onAfterVerify(async (context) => {
      // Extract resource info from payment for bazaar catalog
      const discovered = extractDiscoveryInfo(
        context.paymentPayload,
        context.requirements,
        true, // validate
      );

      if (discovered) {
        bazaarCatalog.add({
          resource: discovered.resourceUrl,
          description: discovered.description,
          mimeType: discovered.mimeType,
          x402Version: discovered.x402Version,
          accepts: [context.requirements],
          lastUpdated: new Date().toISOString(),
        });
      }
    });
    ```
  </Tab>

  <Tab title="Python">
    ```python theme={null}
    from x402 import x402Facilitator

    facilitator = x402Facilitator()

    async def update_bazaar_catalog(context):
        discovered = extract_discovery_info(
            context.payment_payload,
            context.requirements,
            validate=True,
        )

        if discovered:
            await bazaar_catalog.add(
                resource=discovered.resource_url,
                description=discovered.description,
                mime_type=discovered.mime_type,
                accepts=[context.requirements],
            )

    facilitator.on_after_verify(update_bazaar_catalog)
    ```

    For synchronous applications, use `x402FacilitatorSync`:

    ```python theme={null}
    from x402 import x402FacilitatorSync

    facilitator = x402FacilitatorSync()

    def log_verification(context):
        print(f"Verified payment from {context.result.payer}")

    facilitator.on_after_verify(log_verification)
    ```
  </Tab>

  <Tab title="Go">
    ```go theme={null}
    import x402 "github.com/coinbase/x402/go"

    facilitator := x402.Newx402Facilitator()

    facilitator.OnAfterVerify(func(ctx x402.FacilitatorVerifyResultContext) error {
        discovered := extractDiscoveryInfo(ctx.PaymentPayload, ctx.Requirements)

        if discovered != nil {
            return bazaarCatalog.Add(BazaarEntry{
                Resource:    discovered.ResourceURL,
                Description: discovered.Description,
                MimeType:    discovered.MimeType,
                Accepts:     []PaymentRequirements{ctx.Requirements},
            })
        }
        return nil
    })
    ```
  </Tab>
</Tabs>

## Hook Chaining

All SDKs support method chaining for registering multiple hooks:

<Tabs>
  <Tab title="TypeScript">
    ```typescript theme={null}
    server
      .onBeforeVerify(validatePayment)
      .onAfterVerify(logVerification)
      .onBeforeSettle(checkBalance)
      .onAfterSettle(recordTransaction);
    ```
  </Tab>

  <Tab title="Python">
    ```python theme={null}
    (
        server
        .on_before_verify(validate_payment)
        .on_after_verify(log_verification)
        .on_before_settle(check_balance)
        .on_after_settle(record_transaction)
    )
    ```
  </Tab>

  <Tab title="Go">
    ```go theme={null}
    server.
        OnBeforeVerify(validatePayment).
        OnAfterVerify(logVerification).
        OnBeforeSettle(checkBalance).
        OnAfterSettle(recordTransaction)
    ```
  </Tab>
</Tabs>

***

Next, explore:

* [Client / Server](/core-concepts/client-server) — roles and responsibilities
* [Facilitator](/core-concepts/facilitator) — verification and settlement service


# Client / Server
Source: https://docs.x402.org/core-concepts/client-server

This page explains the roles and responsibilities of the **client** and **server** in the x402 protocol.

Understanding these roles is essential to designing, building, or integrating services that use x402 for programmatic payments.

**Note**\
Client refers to the technical component making an HTTP request. In practice, this is often the *buyer* of the resource.

Server refers to the technical component responding to the request. In practice, this is typically the *seller* of the resource

### Client Role

The client is the entity that initiates a request to access a paid resource.

Clients can include:

* Human-operated applications
* Autonomous agents
* Programmatic services acting on behalf of users or systems

#### Responsibilities

* **Initiate requests:** Send an HTTP request to the resource server.
* **Handle payment requirements:** Read the `402 Payment Required` response and extract payment details.
* **Prepare payment payload:** Use the provided payment requirements to construct a valid payment payload.
* **Resubmit request with payment:** Retry the request with the `PAYMENT-SIGNATURE` header containing the signed payment payload.

Clients do not need to manage accounts, credentials, or session tokens beyond their crypto wallet. All interactions are stateless and occur over standard HTTP requests.

### Server Role

The server is the resource provider enforcing payment for access to its services.

Servers can include:

* API services
* Content providers
* Any HTTP-accessible resource requiring monetization

#### Responsibilities

* **Define payment requirements:** Respond to unauthenticated requests with an HTTP `402 Payment Required`, including all necessary payment details in the response body.
* **Verify payment payloads:** Validate incoming payment payloads, either locally or by using a facilitator service.
* **Settle transactions:** Upon successful verification, submit the payment for settlement.
* **Provide the resource:** Once payment is confirmed, return the requested resource to the client.

Servers do not need to manage client identities or maintain session state. Verification and settlement are handled per request.

### Communication Flow

The typical flow between a client and a server in the x402 protocol is as follows:

1. **Client initiates request** to the server for a paid resource.
2. **Server responds with `402 Payment Required`**, including the payment requirements in the response body.
3. **Client prepares and submits a payment payload** based on the provided requirements, including it in the `PAYMENT-SIGNATURE` header (Base64-encoded).
4. **Server verifies the payment payload**, either locally or through a facilitator service.
5. **Server settles the payment** and confirms transaction completion.
6. **Server responds with the requested resource**, including a `PAYMENT-RESPONSE` header (Base64-encoded) with settlement confirmation, assuming payment was successful.

### Summary

In the x402 protocol:

* The **client** requests resources and supplies the signed payment payload.
* The **server** enforces payment requirements, verifies transactions, and provides the resource upon successful payment.

This interaction is stateless, HTTP-native, and compatible with both human applications and automated agents.

Next, explore:

* [Facilitator](/core-concepts/facilitator) — how servers verify and settle payments
* [HTTP 402](/core-concepts/http-402) — how servers communicate payment requirements to clients


# Facilitator
Source: https://docs.x402.org/core-concepts/facilitator

This page explains the role of the **facilitator** in the x402 protocol.

The facilitator is an optional but recommended service that simplifies the process of verifying and settling payments between clients (buyers) and servers (sellers).

### What is a Facilitator?

The facilitator is a service that:

* Verifies payment payloads submitted by clients.
* Settles payments on the blockchain on behalf of servers.

By using a facilitator, servers do not need to maintain direct blockchain connectivity or implement payment verification logic themselves. This reduces operational complexity and ensures accurate, real-time validation of transactions.

### Facilitator Responsibilities

* **Verify payments:** Confirm that the client's payment payload meets the server's declared payment requirements.
* **Settle payments:** Submit validated payments to the blockchain and monitor for confirmation.
* **Provide responses:** Return verification and settlement results to the server, allowing the server to decide whether to fulfill the client's request.

The facilitator does not hold funds or act as a custodian - it performs verification and execution of onchain transactions based on signed payloads provided by clients.

### Why Use a Facilitator?

Using a facilitator provides:

* **Reduced operational complexity:** Servers do not need to interact directly with blockchain nodes.
* **Protocol consistency:** Standardized verification and settlement flows across services.
* **Faster integration:** Services can start accepting payments with minimal blockchain-specific development.

While it is possible to implement verification and settlement locally, using a facilitator accelerates adoption and ensures correct protocol behavior.

### Live Facilitators

Multiple facilitators are live in production, supporting various networks including Base, Solana, Polygon, Avalanche, and more. For a complete and up-to-date list, see the [x402 Ecosystem](https://www.x402.org/ecosystem?category=facilitators).

### Interaction Flow

1. `Client` makes an HTTP request to a `resource server`
2. `Resource server` responds with a `402 Payment Required` status and a `Payment Required Response` JSON object in the response body.
3. `Client` selects one of the `paymentDetails` returned by the `accepts` field of the server response and creates a `Payment Payload` based on the `scheme` of the `paymentDetails` they have selected.
4. `Client` sends the HTTP request with the `PAYMENT-SIGNATURE` header containing the `Payment Payload` (Base64-encoded) to the `resource server`
5. `Resource server` verifies the `Payment Payload` is valid either via local verification or by POSTing the `Payment Payload` and `Payment Details` to the `/verify` endpoint of the `facilitator server`.
6. `Facilitator server` performs verification of the object based on the `scheme` and `networkId` of the `Payment Payload` and returns a `Verification Response`
7. If the `Verification Response` is valid, the resource server performs the work to fulfill the request. If the `Verification Response` is invalid, the resource server returns a `402 Payment Required` status and a `Payment Required Response` JSON object in the response body.
8. `Resource server` either settles the payment by interacting with a blockchain directly, or by POSTing the `Payment Payload` and `Payment Details` to the `/settle` endpoint of the `facilitator server`.
9. `Facilitator server` submits the payment to the blockchain based on the `scheme` and `networkId` of the `Payment Payload`.
10. `Facilitator server` waits for the payment to be confirmed on the blockchain.
11. `Facilitator server` returns a `Payment Execution Response` to the resource server.
12. `Resource server` returns a `200 OK` response to the `Client` with the resource they requested as the body of the HTTP response, and a `PAYMENT-RESPONSE` header containing the `Settlement Response` as Base64-encoded JSON if the payment was executed successfully.

### Summary

The facilitator acts as an independent verification and settlement layer within the x402 protocol. It helps servers confirm payments and submit transactions onchain without requiring direct blockchain infrastructure.

Next, explore:

* [Client / Server](/core-concepts/client-server) — understand the roles and responsibilities of clients and servers
* [HTTP 402](/core-concepts/http-402) — understand how payment requirements are communicated to clients


# HTTP 402
Source: https://docs.x402.org/core-concepts/http-402

For decades, HTTP 402 Payment Required has been reserved for future use. x402 unlocks it, and [absolves the internet of its original sin](https://economyofbits.substack.com/p/marc-andreessens-original-sin).

### What is HTTP 402?

[HTTP 402](https://datatracker.ietf.org/doc/html/rfc7231#section-6.5.2) is a standard, but rarely used, HTTP response status code indicating that payment is required to access a resource.

In x402, this status code is activated to:

* Inform clients (buyers or agents) that payment is required.
* Communicate the details of the payment, such as amount, currency, and destination address.
* Provide the information necessary to complete the payment programmatically.

### Why x402 Uses HTTP 402

The primary purpose of HTTP 402 is to enable frictionless, API-native payments for accessing web resources, especially for:

* Machine-to-machine (M2M) payments (e.g., AI agents).
* Pay-per-use models such as API calls or paywalled content.
* Micropayments without account creation or traditional payment rails.

Using the 402 status code keeps x402 protocol natively web-compatible and easy to integrate into any HTTP-based service.

### Payment Headers in V2

x402 V2 uses two standardized headers for payment communication:

* **`PAYMENT-SIGNATURE`**: Contains the Base64-encoded payment payload from the client. This header is sent by the client when retrying a request after receiving a 402 response, proving they have authorized payment.
* **`PAYMENT-RESPONSE`**: Contains the Base64-encoded settlement response from the server. This header is returned by the server in the successful response, confirming the payment was verified and settled.

Both headers must contain valid Base64-encoded JSON strings. This encoding ensures compatibility across different HTTP implementations and prevents issues with special characters in JSON payloads.

### Summary

HTTP 402 is the foundation of the x402 protocol, enabling services to declare payment requirements directly within HTTP responses. It:

* Signals payment is required
* Communicates necessary payment details
* Integrates seamlessly with standard HTTP workflows


# Networks & Token Support
Source: https://docs.x402.org/core-concepts/network-and-token-support

This page explains which blockchain networks and tokens are supported by x402, and how to extend support to additional networks.

## V2 Network Identifiers (CAIP-2)

x402 V2 uses [CAIP-2](https://chainagnostic.org/CAIPs/caip-2) standard network identifiers for unambiguous cross-chain support. This format follows the pattern `namespace:reference`.

### Network Identifier Reference

| V1 Name         | V2 CAIP-2 ID                              | Chain ID | Description          |
| --------------- | ----------------------------------------- | -------- | -------------------- |
| `base-sepolia`  | `eip155:84532`                            | 84532    | Base Sepolia testnet |
| `base`          | `eip155:8453`                             | 8453     | Base mainnet         |
| `solana-devnet` | `solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1` | -        | Solana Devnet        |
| `solana`        | `solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp` | -        | Solana Mainnet       |

### Format Explanation

* **EVM networks**: `eip155:<chainId>` where chainId is the numeric chain identifier
* **Solana**: `solana:<genesisHash>` where genesisHash is the first 32 bytes of the genesis block hash

## Overview

x402 is designed to work across multiple blockchain networks, with different levels of support depending on the facilitator being used. The protocol itself is network-agnostic, but facilitators need to implement network-specific logic for payment verification and settlement.

### Supported Facilitators

Network support in x402 depends on which facilitator you use. For a complete and up-to-date list of available facilitators and their supported networks, see the [x402 Ecosystem](https://www.x402.org/ecosystem?category=facilitators).

#### x402.org Facilitator

* **Supports**: `eip155:84532` (Base Sepolia), `solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1` (Solana Devnet)
* **Notes**: Recommended for testing and development. This is the default facilitator in the x402 packages and requires no setup.

#### Production Facilitators

Multiple production-ready facilitators are available supporting various networks including Base, Solana, Polygon, Avalanche, and more. See the [x402 Ecosystem](https://www.x402.org/ecosystem?category=facilitators) for available options and their documentation.

### Token Support

x402 supports tokens on both EVM and Solana networks:

* **EVM**: Any ERC-20 token that implements the EIP-3009 standard
* **Solana**: Any SPL or token-2022 token

**Important**: Facilitators support networks, not specific tokens — any EIP-3009 compatible token works on EVM networks, and any SPL/token-2022 token works on Solana, for the facilitators that support those networks.

#### EVM: EIP-3009 Requirement

Tokens must implement the `transferWithAuthorization` function from the EIP-3009 standard. This enables:

* **Gasless transfers**: The facilitator sponsors gas fees
* **Signature-based authorization**: Users sign transfer authorizations off-chain
* **Secure payments**: Transfers are authorized by cryptographic signatures

#### Specifying Payment Amounts

When configuring payment requirements, you have two options:

1. **Price String** (e.g., `"$0.01"`) - The system infers USDC as the token
2. **TokenAmount** - Specify exact atomic units of any EIP-3009 token

#### Using Custom EIP-3009 Tokens

To use a custom EIP-3009 token, you need three key pieces of information:

1. **Token Address**: The contract address of your EIP-3009 token
2. **EIP-712 Name**: The token's name for EIP-712 signatures
3. **EIP-712 Version**: The token's version for EIP-712 signatures

**Finding Token Information on Basescan**

You can retrieve the required EIP-712 values from any block explorer:

1. **Name**: Read the `name()` function - [Example on Basescan](https://basescan.org/token/0x833589fcd6edb6e08f4c7c32d4f71b54bda02913#readProxyContract#F16)
2. **Version**: Read the `version()` function - [Example on Basescan](https://basescan.org/token/0x833589fcd6edb6e08f4c7c32d4f71b54bda02913#readProxyContract#F24)

These values are used in the `eip712` nested object when configuring TokenAmount:

```typescript theme={null}
{
  eip712: {
    name: "USD Coin",    // From name() function
    version: "2"         // From version() function
  }
}
```

#### Solana: SPL Tokens & Token 2022 Tokens

On Solana, x402 supports all SPL tokens and Token 2022 tokens. When using facilitators that support Solana or Solana Devnet, payments can be made in any SPL/token-2022 token, including USDC (SPL). No EIP-712 configuration is required on Solana.

#### USDC - The Default Token

* **Status**: Supported by default across all networks
* **Why**: USDC implements EIP-3009 and is widely available
* **Networks**: Available on `eip155:8453` (Base), `eip155:84532` (Base Sepolia), and all supported networks

#### Why EIP-3009?

The EIP-3009 standard is essential for x402 because it enables:

1. **Gas abstraction**: Buyers don't need native tokens (ETH, MATIC, etc.) for gas
2. **One-step payments**: No separate approval transactions required
3. **Universal facilitator support**: Any EIP-3009 token works with any facilitator

### Quick Reference

| Facilitator Type                                                                | Networks Supported                                        | Production Ready | Requirements    |
| ------------------------------------------------------------------------------- | --------------------------------------------------------- | ---------------- | --------------- |
| x402.org (Default)                                                              | `eip155:84532`, `solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1` | Testnet only     | None            |
| [Production Facilitators](https://www.x402.org/ecosystem?category=facilitators) | Various (Base, Solana, Polygon, Avalanche, etc.)          | Yes              | Varies          |
| Self-hosted                                                                     | Any EVM network (CAIP-2 format)                           | Yes              | Technical setup |

**Note**: On EVM networks, facilitators support any EIP-3009 compatible token; on Solana, facilitators support any SPL/Token-2022 token.

### Adding Support for New Networks

x402 V2 uses dynamic network registration - you can support any EVM network without modifying source files.

#### V2: Dynamic Registration (Recommended)

In V2, networks are supported through the registration pattern using CAIP-2 identifiers. No source code changes are required:

<Tabs>
  <Tab title="TypeScript">
    ```typescript theme={null}
    import { x402ResourceServer, HTTPFacilitatorClient } from "@x402/core/server";
    import { registerExactEvmScheme } from "@x402/evm/exact/server";

    const facilitatorClient = new HTTPFacilitatorClient({
      url: "https://your-facilitator.com"  // Facilitator that supports your network
    });

    const server = new x402ResourceServer(facilitatorClient);
    registerExactEvmScheme(server);  // Registers wildcard support for all EVM chains

    // Now use any CAIP-2 network identifier in your routes:
    const routes = {
      "GET /api/data": {
        accepts: [{
          scheme: "exact",
          price: "$0.001",
          network: "eip155:43114",  // Avalanche mainnet
          payTo: "0xYourAddress",
        }],
      },
    };
    ```
  </Tab>

  <Tab title="Go">
    ```go theme={null}
    import (
        x402http "github.com/coinbase/x402/go/http"
        evm "github.com/coinbase/x402/go/mechanisms/evm/exact/server"
    )

    facilitatorClient := x402http.NewHTTPFacilitatorClient(&x402http.FacilitatorConfig{
        URL: "https://your-facilitator.com",
    })

    // Register EVM scheme - supports any CAIP-2 EVM network
    schemes := []ginmw.SchemeConfig{
        {Network: x402.Network("eip155:43114"), Server: evm.NewExactEvmScheme()},  // Avalanche
    }
    ```
  </Tab>

  <Tab title="Python">
    ```python theme={null}
    from x402.http import FacilitatorConfig, HTTPFacilitatorClient, PaymentOption
    from x402.http.types import RouteConfig
    from x402.mechanisms.evm.exact import ExactEvmServerScheme
    from x402.server import x402ResourceServer

    # Create facilitator client for your network
    facilitator = HTTPFacilitatorClient(
        FacilitatorConfig(url="https://your-facilitator.com")
    )

    # Create server and register EVM scheme for your network
    server = x402ResourceServer(facilitator)
    server.register("eip155:43114", ExactEvmServerScheme())  # Avalanche mainnet

    # Now use any CAIP-2 network identifier in your routes:
    routes: dict[str, RouteConfig] = {
        "GET /api/data": RouteConfig(
            accepts=[
                PaymentOption(
                    scheme="exact",
                    price="$0.001",
                    network="eip155:43114",  # Avalanche mainnet
                    pay_to="0xYourAddress",
                ),
            ],
        ),
    }
    ```
  </Tab>
</Tabs>

**Key Points:**

* Use CAIP-2 format: `eip155:<chainId>` for any EVM network
* The scheme implementation handles the network automatically
* You only need a facilitator that supports your target network (or run your own)

#### Running Your Own Facilitator

If you need immediate support or want to test before contributing, you can run your own facilitator.

Video Guide: [Adding EVM Chains to x402](https://x.com/jaycoolh/status/1920851551905575164/video/1)

**Prerequisites**

1. Access to an RPC endpoint for your target network
2. A wallet with native tokens for gas sponsorship
3. The x402 facilitator code

### Future Network Support

The x402 ecosystem is actively expanding network support. Planned additions include:

* Additional L2 networks
* Additional non-EVM chain support
* Cross-chain payment capabilities

### Getting Help

For help with network integration:

* Join the [x402 Discord community](https://discord.gg/cdp)
* Check the [x402 GitHub repository](https://github.com/coinbase/x402)

### Summary

x402's network support is designed to be extensible while maintaining security and reliability. Whether you're using the default Base Sepolia (`eip155:84532`) setup for testing or running your own facilitator for custom networks, the protocol provides flexibility for various use cases.

Key takeaways:

* Base (`eip155:8453`) and Base Sepolia (`eip155:84532`) have the best out-of-the-box support
* Any EVM network can be supported with a custom facilitator using CAIP-2 format
* Any EIP-3009 token (with `transferWithAuthorization`) works on any facilitator
* Use price strings for USDC or TokenAmount for custom tokens
* Network choice affects gas costs and payment economics
* V2 uses CAIP-2 network identifiers for unambiguous cross-chain support

Next, explore:

* [Quickstart for Sellers](/getting-started/quickstart-for-sellers) — Start accepting payments on supported networks
* [Core Concepts](/core-concepts/http-402) — Learn how x402 works under the hood
* [Facilitator](/core-concepts/facilitator) — Understand the role of facilitators
* [MCP Server](/guides/mcp-server-with-x402) — Set up AI agents to use x402 payments


# Wallet
Source: https://docs.x402.org/core-concepts/wallet

This page explains the role of the **wallet** in the x402 protocol.

In x402, a wallet is both a payment mechanism and a form of unique identity for buyers and sellers. Wallet addresses are used to send, receive, and verify payments, while also serving as identifiers within the protocol.

### Role of the Wallet

#### For Buyers

Buyers use wallets to:

* Store USDC/crypto
* Sign payment payloads
* Authorize onchain payments programmatically

Wallets enable buyers, including AI agents, to transact without account creation or credential management.

#### For Sellers

Sellers use wallets to:

* Receive USDC/crypto payments
* Define their payment destination within server configurations

A seller's wallet address is included in the payment requirements provided to buyers.

[CDP's Wallet API ](https://docs.cdp.coinbase.com/wallet-api-v2/docs/welcome)is our recommended option for programmatic payments and secure key management.

### Summary

* Wallets enable programmatic, permissionless payments in x402.
* Buyers use wallets to pay for services.
* Sellers use wallets to receive payments.
* Wallet addresses also act as unique identifiers within the protocol.


# Bazaar (Discovery Layer)
Source: https://docs.x402.org/extensions/bazaar

The x402 Bazaar is the discovery layer for the x402 ecosystem - a machine-readable catalog that helps developers and AI agents find and integrate with x402-compatible API endpoints.

Think of it as a search index for payable APIs, enabling the autonomous discovery and consumption of services.

The x402 Bazaar is in early development. While our vision is to build the "Google for agentic endpoints," we're currently more like "Yahoo search" - functional but evolving. Features and APIs may change as we gather feedback and expand capabilities.

### Overview

The Bazaar solves a critical problem in the x402 ecosystem: **discoverability**. Without it, x402-compatible endpoints are like hidden stalls in a vast market. The Bazaar provides:

* **For Buyers (API Consumers)**: Programmatically discover available x402-enabled services, understand their capabilities, pricing, and schemas
* **For Sellers (API Providers)**: Automatic visibility for your x402-enabled services to a global audience of developers and AI agents
* **For AI Agents**: Dynamic service discovery without pre-baked integrations - query, find, pay, and use

### How It Works

Facilitators that support the Bazaar extension may provide a `/list` endpoint that returns all x402-compatible services registered through the respective facilitator. Services are discoverable when they include the bazaar extension in their route configuration.

**Note:** The spec for marketplace items is open and part of the x402 scheme, meaning any facilitator can implement their own discovery layer.

#### Basic Flow

1. **Discovery**: Clients query the `/list` endpoint to find available services
2. **Selection**: Choose a service based on price, capabilities, and requirements
3. **Execution**: Use x402 to pay for and access the selected service
4. **No Manual Setup**: No API keys, no account creation, just discover and pay

### API Reference

#### List Endpoint

Retrieve all available x402-compatible endpoints:

```bash theme={null}
GET https://api.cdp.coinbase.com/platform/v2/x402/discovery/resources
```

**Note**: The recommended way to use this endpoint is to use the `useFacilitator` hook as described below.

**Response Schema**

Each endpoint in the list contains the following fields:

```json theme={null}
{
  "accepts": [
    {
      "asset": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
      "description": "",
      "extra": {
        "name": "USD Coin",
        "version": "2"
      },
      "maxAmountRequired": "200",
      "maxTimeoutSeconds": 60,
      "mimeType": "",
      "network": "eip155:8453",
      "outputSchema": {
        "input": {
          "method": "GET",
          "type": "http"
        },
        "output": null
      },
      "payTo": "0xa2477E16dCB42E2AD80f03FE97D7F1a1646cd1c0",
      "resource": "https://api.example.com/x402/weather",
      "scheme": "exact"
    }
  ],
  "lastUpdated": "2025-08-09T01:07:04.005Z",
  "metadata": {},
  "resource": "https://api.example.com/x402/weather",
  "type": "http",
  "x402Version": 2
}
```

### Quickstart for Buyers

See the full example here for [Python](https://github.com/coinbase/x402/tree/main/examples/python/discovery) and [Node.js](https://github.com/coinbase/x402/tree/main/examples/typescript/discovery).

#### Step 1: Discover Available Services

Fetch the list of available x402 services using the facilitator client:

<Tabs>
  <Tab title="TypeScript">
    ```typescript theme={null}
    import { HTTPFacilitatorClient } from "@x402/core/http";
    import { withBazaar } from "@x402/extensions";

    const facilitatorClient = new HTTPFacilitatorClient({
      url: "https://x402.org/facilitator"
    });
    const client = withBazaar(facilitatorClient);

    const response = await client.extensions.discovery.listResources({ type: "http" });

    // Filter services under $0.10
    const usdcAsset = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
    const maxPrice = 100000; // $0.10 in USDC atomic units (6 decimals)

    const affordableServices = response.items.filter(item =>
      item.accepts.find(paymentRequirements =>
        paymentRequirements.asset === usdcAsset &&
        Number(paymentRequirements.maxAmountRequired) < maxPrice
      )
    );
    ```
  </Tab>

  <Tab title="Python">
    ```python theme={null}
    from x402.http import FacilitatorConfig, HTTPFacilitatorClient

    facilitator = HTTPFacilitatorClient(
        FacilitatorConfig(url="https://api.cdp.coinbase.com/platform/v2/x402")
    )

    response = await facilitator.list_resources(type="http")

    # Filter services under $0.10
    usdc_asset = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"
    max_price = 100000  # $0.10 in USDC atomic units (6 decimals)

    affordable_services = [
        item
        for item in response.items
        if any(
            payment_req.asset == usdc_asset
            and int(payment_req.max_amount_required) < max_price
            for payment_req in item.accepts
        )
    ]
    ```
  </Tab>
</Tabs>

#### Step 2: Call a Discovered Service

Once you've found a suitable service, use an x402 client to call it:

<Tabs>
  <Tab title="TypeScript">
    ```typescript theme={null}
    import { wrapAxiosWithPayment, x402Client } from "@x402/axios";
    import { registerExactEvmScheme } from "@x402/evm/exact/client";
    import axios from "axios";
    import { privateKeyToAccount } from "viem/accounts";

    // Set up your payment account
    const account = privateKeyToAccount("0xYourPrivateKey");
    const client = new x402Client();
    registerExactEvmScheme(client, { signer: account });

    // Select a service from discovery
    const selectedService = affordableServices[0];

    // Create a payment-enabled client for that service
    const api = wrapAxiosWithPayment(
      axios.create({ baseURL: selectedService.resource }),
      client
    );

    // Select the payment method of your choice
    const selectedPaymentRequirements = selectedService.accepts[0];
    const inputSchema = selectedPaymentRequirements.outputSchema.input;

    // Build the request using the service's schema
    const response = await api.request({
      method: inputSchema.method,
      url: inputSchema.resource,
      params: { location: "San Francisco" } // Based on inputSchema
    });

    console.log("Response data:", response.data);
    ```
  </Tab>

  <Tab title="Python">
    ```python theme={null}
    import asyncio

    from eth_account import Account

    from x402 import x402Client
    from x402.http.clients import x402HttpxClient
    from x402.mechanisms.evm import EthAccountSigner
    from x402.mechanisms.evm.exact.register import register_exact_evm_client


    async def main() -> None:
        account = Account.from_key("0xYourPrivateKey")
        client = x402Client()
        register_exact_evm_client(client, EthAccountSigner(account))

        # Select a service from discovery (from Step 1)
        selected_service = affordable_services[0]

        # Select the payment method of your choice
        selected_payment_requirements = selected_service.accepts[0]
        input_schema = selected_payment_requirements.output_schema.input

        # Make the request using httpx client
        async with x402HttpxClient(client) as http:
            response = await http.request(
                method=input_schema.method,
                url=input_schema.resource,
                params={"location": "San Francisco"}  # Based on input_schema
            )
            await response.aread()
            print(f"Response data: {response.json()}")


    asyncio.run(main())
    ```
  </Tab>
</Tabs>

### Quickstart for Sellers

#### Listing with Bazaar Extension

Add the bazaar extension to your route configuration to make your API discoverable.

#### Adding Metadata

To enhance your listing with descriptions and schemas, include them when setting up your x402 middleware. **You should include descriptions for each parameter to make it clear for agents to call your endpoints**:

<Tabs>
  <Tab title="TypeScript">
    ```typescript theme={null}
    import { paymentMiddleware } from "@x402/express";
    import { x402ResourceServer, HTTPFacilitatorClient } from "@x402/core/server";
    import { registerExactEvmScheme } from "@x402/evm/exact/server";
    import { bazaarResourceServerExtension } from "@x402/extensions";

    const facilitatorClient = new HTTPFacilitatorClient({
      url: "https://x402.org/facilitator"
    });
    const server = new x402ResourceServer(facilitatorClient);
    registerExactEvmScheme(server);

    const routes = {
      "GET /weather": {
        price: "$0.001",
        network: "eip155:8453",
        resource: "0xYourAddress",
        description: "Get current weather data for any location",
        extensions: {
          bazaar: {
            discoverable: true,
            inputSchema: {
              queryParams: {
                location: {
                  type: "string",
                  description: "City name or coordinates",
                  required: true
                }
              }
            },
            outputSchema: {
              type: "object",
              properties: {
                temperature: { type: "number" },
                conditions: { type: "string" },
                humidity: { type: "number" }
              }
            }
          }
        }
      }
    };

    app.use(paymentMiddleware(routes, server));
    ```
  </Tab>

  <Tab title="Python">
    ```python theme={null}
    from fastapi import FastAPI

    from x402.http import FacilitatorConfig, HTTPFacilitatorClient, PaymentOption
    from x402.http.middleware.fastapi import PaymentMiddlewareASGI
    from x402.http.types import RouteConfig
    from x402.mechanisms.evm.exact import ExactEvmServerScheme
    from x402.server import x402ResourceServer

    app = FastAPI()

    # Create facilitator client (CDP mainnet)
    facilitator = HTTPFacilitatorClient(
        FacilitatorConfig(url="https://api.cdp.coinbase.com/platform/v2/x402")
    )

    # Create resource server and register EVM scheme
    server = x402ResourceServer(facilitator)
    server.register("eip155:8453", ExactEvmServerScheme())

    # Define routes with Bazaar discovery metadata
    routes: dict[str, RouteConfig] = {
        "GET /weather": RouteConfig(
            accepts=[
                PaymentOption(
                    scheme="exact",
                    pay_to="0xYourAddress",
                    price="$0.001",
                    network="eip155:8453",
                ),
            ],
            mime_type="application/json",
            description="Get current weather data for any location",
            extensions={
                "bazaar": {
                    "discoverable": True,
                    "inputSchema": {
                        "queryParams": {
                            "location": {
                                "type": "string",
                                "description": "City name or coordinates",
                                "required": True,
                            }
                        }
                    },
                    "outputSchema": {
                        "type": "object",
                        "properties": {
                            "temperature": {"type": "number"},
                            "conditions": {"type": "string"},
                            "humidity": {"type": "number"},
                        },
                    },
                }
            },
        ),
    }

    app.add_middleware(PaymentMiddlewareASGI, routes=routes, server=server)
    ```
  </Tab>

  <Tab title="Go">
    ```go theme={null}
    package main

    import (
        x402 "github.com/coinbase/x402/go"
        "github.com/coinbase/x402/go/extensions/bazaar"
        "github.com/coinbase/x402/go/extensions/types"
        x402http "github.com/coinbase/x402/go/http"
        ginmw "github.com/coinbase/x402/go/http/gin"
        evm "github.com/coinbase/x402/go/mechanisms/evm/exact/server"
        "github.com/gin-gonic/gin"
    )

    func main() {
        r := gin.Default()

        facilitatorClient := x402http.NewHTTPFacilitatorClient(&x402http.FacilitatorConfig{
            URL: "https://x402.org/facilitator",
        })

        // Create Bazaar Discovery Extension with input/output schemas
        discoveryExtension, _ := bazaar.DeclareDiscoveryExtension(
            bazaar.MethodGET,
            map[string]interface{}{"location": "San Francisco"},
            types.JSONSchema{
                "properties": map[string]interface{}{
                    "location": map[string]interface{}{
                        "type":        "string",
                        "description": "City name or coordinates",
                    },
                },
                "required": []string{"location"},
            },
            "",
            &types.OutputConfig{
                Schema: types.JSONSchema{
                    "properties": map[string]interface{}{
                        "temperature": map[string]interface{}{"type": "number"},
                        "conditions":  map[string]interface{}{"type": "string"},
                        "humidity":    map[string]interface{}{"type": "number"},
                    },
                },
            },
        )

        routes := x402http.RoutesConfig{
            "GET /weather": {
                Accepts: x402http.PaymentOptions{{
                    Scheme:  "exact",
                    PayTo:   "0xYourAddress",
                    Price:   "$0.001",
                    Network: x402.Network("eip155:8453"),
                }},
                Description: "Get current weather data for any location",
                Extensions: map[string]interface{}{
                    types.BAZAAR: discoveryExtension,
                },
            },
        }

        r.Use(ginmw.X402Payment(ginmw.Config{
            Routes:      routes,
            Facilitator: facilitatorClient,
            Schemes: []ginmw.SchemeConfig{{
                Network: x402.Network("eip155:8453"),
                Server:  evm.NewExactEvmScheme(),
            }},
        }))

        r.GET("/weather", func(c *gin.Context) {
            location := c.DefaultQuery("location", "San Francisco")
            c.JSON(200, gin.H{
                "location":    location,
                "temperature": 70,
                "conditions":  "sunny",
                "humidity":    45,
            })
        })

        r.Run(":4021")
    }
    ```
  </Tab>
</Tabs>

### Coming Soon

The x402 Bazaar is rapidly evolving, and your feedback helps us prioritize features.

### Support

* **GitHub**: [github.com/coinbase/x402](https://github.com/coinbase/x402)
* **Discord**: [Join #x402 channel](https://discord.com/invite/cdp)

### FAQ

**Q: How do I get my service listed?**
A: Add the bazaar extension to your route configuration. See the examples above.

**Q: How can I make endpoint calls more accurate?**
A: Include descriptions clearly stating what each parameter does and how to call your endpoint, but do so as succinctly as possible.

**Q: How does pricing work?**
A: Listing is free. Services set their own prices per API call, paid via x402.

**Q: What networks are supported?**
A: Currently Base (`eip155:8453`) and Base Sepolia (`eip155:84532`) with USDC payments.

**Q: Can I list non-x402 services?**
A: No, only x402-compatible endpoints can be listed. See our [Quickstart for Sellers](/getting-started/quickstart-for-sellers) to make your API x402-compatible.


# FAQ
Source: https://docs.x402.org/faq



### General

#### What *is* x402 in a single sentence?

x402 is an open‑source protocol that turns the dormant HTTP `402 Payment Required` status code into a fully‑featured, on‑chain payment layer for APIs, websites, and autonomous agents.

**Is x402 a CDP Product?**

*No.* While Coinbase Developer Platform provides tooling and are the creators of the standard, it is an open protocol (Apache-2.0 license) and you don't need any Coinbase products to use it. We look forward to further clarifying this distinction and making x402 a credibly neutral payment standard.

#### Why not use traditional payment rails or API keys?

Traditional rails require credit‑card networks, user accounts, and multi‑step UI flows.\
x402 removes those dependencies, enabling programmatic, HTTP-native payments (perfect for AI agents) while dropping fees to near‑zero and settling in \~1 second.

#### Is x402 only for crypto‑native projects?

No. Any web API or content provider—crypto or web2—can integrate x402 if it wants a lower‑cost, friction‑free payment path for small or usage‑based transactions.

### Language & Framework Support

#### What languages and frameworks are supported?

Typescript, Python, and Go are reference implementations, but x402 is an **open protocol**.

Nothing prevents you from implementing the spec in Rust, Java, or other languages. If you're interested in building support for your favorite language, please [open an issue](https://github.com/coinbase/x402/issues) and let us know, we'd be happy to help!

### Facilitators

#### Who runs facilitators today?

Multiple organizations operate production facilitators. The protocol is **permissionless**—anyone can run a facilitator. See the [x402 Ecosystem](https://www.x402.org/ecosystem?category=facilitators) for available options, including:

* Community‑run facilitators for various networks and assets
* Private facilitators for enterprises that need custom KYT / KYC flows.

#### What stops a malicious facilitator from stealing funds or lying about settlement?

Every `x402PaymentPayload` is **signed by the buyer** and settles **directly on‑chain**.\
A facilitator that tampers with the transaction will fail signature checks.

### Pricing & Schemes

#### How should I price my endpoint?

There is no single answer, but common patterns are:

* **Flat per‑call** (e.g., `$0.001` per request)
* **Tiered** (`/basic` vs `/pro` endpoints with different prices)
* **Up‑to** (work in progress): "pay‑up‑to" where the final cost equals usage (tokens, MB, etc.)

#### Can I integrate x402 with a usage / plan manager like Metronome?

Yes. x402 handles the *payment execution*. You can still meter usage, aggregate calls, or issue prepaid credits in Metronome and only charge when limits are exceeded. Example glue code is coming soon.

### Assets, Networks & Fees

#### Which assets and networks are supported today?

| Network       | CAIP-2 ID                                 | Asset                               | Fees\*   | Status      |
| ------------- | ----------------------------------------- | ----------------------------------- | -------- | ----------- |
| Base          | `eip155:8453`                             | Any EIP-3009 token                  | fee-free | **Mainnet** |
| Base Sepolia  | `eip155:84532`                            | Any EIP-3009 token                  | fee-free | **Testnet** |
| Solana        | `solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp` | Any SPL token; Token-2022 (v2 only) | fee-free | **Mainnet** |
| Solana Devnet | `solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1` | Any SPL token; Token-2022 (v2 only) | fee-free | **Testnet** |

\* Gas paid on chain; many facilitators offer **zero** facilitator fees (see [ecosystem](https://www.x402.org/ecosystem?category=facilitators) for details).

*Support for additional chains and assets is on the roadmap and community‑driven.*

#### Does x402 support fiat off‑ramps or credit‑card deposits?

Not natively. However, facilitators or third‑party gateways can wrap x402 flows with on‑ and off‑ramps.

### Security

#### Do I have to expose my private key to my backend?

No. The recommended pattern is:

1. **Buyers (clients/agents)** sign locally in their runtime (browser, serverless, agent VM). You can use CDP Wallet API to create a programmatic wallet.
2. **Sellers** never hold the buyer's key; they only verify signatures.

#### How do refunds work?

The current `exact` scheme is a *push payment*—irreversible once executed. Two options:

1. **Business‑logic refunds:** Seller sends a new USDC transfer back to the buyer.
2. **Escrow schemes:** Future spec could add conditional transfers (e.g., HTLCs or hold invoices).

### Usage by AI Agents

#### How does an agent know what to pay?

Agents follow the same flow as humans:

1. Make a request.
2. Parse the `PAYMENT-REQUIRED` header.
3. Choose a suitable requirement and sign a payload via the x402 client SDKs.
4. Retry with the `PAYMENT-SIGNATURE` header.

#### Do agents need wallets?

Yes. Programmatic wallets (e.g., **CDP Wallet API**, **viem**, **ethers‑v6** HD wallets) let agents sign `EIP‑712` payloads without exposing seed phrases.

### Governance & Roadmap

#### Is there a formal spec or whitepaper?

* **Spec:** [GitHub Specification](https://github.com/coinbase/x402/tree/main/specs)
* [**Whitepaper**](https://www.x402.org/x402-whitepaper.pdf)

#### How will x402 evolve?

Tracked in public GitHub issues + community RFCs. Major themes:

* Multi‑asset support
* Additional schemes (`upto`, `stream`, `permit2`)
* Discovery layer for service search & reputation

**Why is x402 hosted in the Coinbase GitHub?**

We acknowledge that the repo is primarily under Coinbase ownership today. This is primarily to leverage our best-in-house security and auditing team to ensure the spec is safe and nobody accidentally creates legally ambiguous payment flows. We intend to eventually transfer ownership of the repo to a steering group or open-source committee.

### Troubleshooting

#### I keep getting `402 Payment Required`, even after attaching `PAYMENT-SIGNATURE`. Why?

1. Signature is invalid (wrong chain ID or payload fields).
2. Payment amount is less than the required `amount` in the payment requirements.
3. Address has insufficient USDC or was flagged by KYT.\
   Check the `error` field in the server's JSON response for details.

#### My test works on Base Sepolia but fails on Base mainnet—what changed?

* Ensure you set `network: "eip155:8453"` (Base mainnet) instead of `"eip155:84532"` (Base Sepolia).
* Confirm your wallet has *mainnet* USDC.
* Gas fees are higher on mainnet; fund the wallet with a small amount of ETH for gas.

### Still have questions?

• Reach out in the [Discord channel](https://discord.gg/invite/cdp)\
• Open a GitHub Discussion or Issue in the [x402 repo](https://github.com/coinbase/x402)


# Quickstart for Buyers
Source: https://docs.x402.org/getting-started/quickstart-for-buyers

This guide walks you through how to use **x402** to interact with services that require payment. By the end of this guide, you will be able to programmatically discover payment requirements, complete a payment, and access a paid resource.

### Prerequisites

Before you begin, ensure you have:

* A crypto wallet with USDC (any EVM-compatible wallet)
* [Node.js](https://nodejs.org/en) and npm, [Go](https://go.dev/), or Python and pip
* A service that requires payment via x402

**Note**\
We have pre-configured [examples available in our repo](https://github.com/coinbase/x402/tree/main/examples), including examples for fetch, Axios, Go, and MCP.

### 1. Install Dependencies

<Tabs>
  <Tab title="Node.js">
    Install the x402 client packages:

    ```bash theme={null}
    # For fetch-based clients
    npm install @x402/fetch @x402/evm

    # For axios-based clients
    npm install @x402/axios @x402/evm

    # For Solana support, also add:
    npm install @x402/svm
    ```
  </Tab>

  <Tab title="Go">
    Add the x402 Go module to your project:

    ```bash theme={null}
    go get github.com/coinbase/x402/go
    ```
  </Tab>

  <Tab title="Python">
    Install the [x402 package](https://pypi.org/project/x402/) with your preferred HTTP client:

    ```bash theme={null}
    # For httpx (async) - recommended
    pip install "x402[httpx]"

    # For requests (sync)
    pip install "x402[requests]"

    # For Solana support, also add:
    pip install "x402[svm]"
    ```
  </Tab>
</Tabs>

### 2. Create a Wallet Signer

<Tabs>
  <Tab title="Node.js (viem)">
    Install the required package:

    ```bash theme={null}
    npm install viem
    ```

    Then instantiate the wallet signer:

    ```typescript theme={null}
    import { privateKeyToAccount } from "viem/accounts";

    // Create a signer from private key (use environment variable)
    const signer = privateKeyToAccount(process.env.EVM_PRIVATE_KEY as `0x${string}`);
    ```
  </Tab>

  <Tab title="Go">
    ```go theme={null}
    import (
        evmsigners "github.com/coinbase/x402/go/signers/evm"
    )

    // Load private key from environment
    evmSigner, err := evmsigners.NewClientSignerFromPrivateKey(os.Getenv("EVM_PRIVATE_KEY"))
    if err != nil {
        log.Fatal(err)
    }
    ```
  </Tab>

  <Tab title="Python (eth-account)">
    Install the required package:

    ```bash theme={null}
    pip install eth_account
    ```

    Then instantiate the wallet signer:

    ```python theme={null}
    import os
    from eth_account import Account
    from x402.mechanisms.evm import EthAccountSigner

    account = Account.from_key(os.getenv("EVM_PRIVATE_KEY"))
    signer = EthAccountSigner(account)
    ```
  </Tab>
</Tabs>

#### Solana (SVM)

Use [SolanaKit](https://www.solanakit.com/) to instantiate a signer:

```typescript theme={null}
import { createKeyPairSignerFromBytes } from "@solana/kit";
import { base58 } from "@scure/base";

// 64-byte base58 secret key (private + public)
const svmSigner = await createKeyPairSignerFromBytes(
  base58.decode(process.env.SOLANA_PRIVATE_KEY!)
);
```

### 3. Make Paid Requests Automatically

<Tabs>
  <Tab title="Fetch">
    **@x402/fetch** extends the native `fetch` API to handle 402 responses and payment headers for you. [Full example here](https://github.com/coinbase/x402/tree/main/examples/typescript/clients/fetch)

    ```typescript theme={null}
    import { wrapFetchWithPayment } from "@x402/fetch";
    import { x402Client, x402HTTPClient } from "@x402/core/client";
    import { registerExactEvmScheme } from "@x402/evm/exact/client";
    import { privateKeyToAccount } from "viem/accounts";

    // Create signer
    const signer = privateKeyToAccount(process.env.EVM_PRIVATE_KEY as `0x${string}`);

    // Create x402 client and register EVM scheme
    const client = new x402Client();
    registerExactEvmScheme(client, { signer });

    // Wrap fetch with payment handling
    const fetchWithPayment = wrapFetchWithPayment(fetch, client);

    // Make request - payment is handled automatically
    const response = await fetchWithPayment("https://api.example.com/paid-endpoint", {
      method: "GET",
    });

    const data = await response.json();
    console.log("Response:", data);

    // Get payment receipt from response headers
    if (response.ok) {
      const httpClient = new x402HTTPClient(client);
      const paymentResponse = httpClient.getPaymentSettleResponse(
        (name) => response.headers.get(name)
      );
      console.log("Payment settled:", paymentResponse);
    }
    ```
  </Tab>

  <Tab title="Axios">
    **@x402/axios** adds a payment interceptor to Axios, so your requests are retried with payment headers automatically. [Full example here](https://github.com/coinbase/x402/tree/main/examples/typescript/clients/axios)

    ```typescript theme={null}
    import { x402Client, wrapAxiosWithPayment, x402HTTPClient } from "@x402/axios";
    import { registerExactEvmScheme } from "@x402/evm/exact/client";
    import { privateKeyToAccount } from "viem/accounts";
    import axios from "axios";

    // Create signer
    const signer = privateKeyToAccount(process.env.EVM_PRIVATE_KEY as `0x${string}`);

    // Create x402 client and register EVM scheme
    const client = new x402Client();
    registerExactEvmScheme(client, { signer });

    // Create an Axios instance with payment handling
    const api = wrapAxiosWithPayment(
      axios.create({ baseURL: "https://api.example.com" }),
      client,
    );

    // Make request - payment is handled automatically
    const response = await api.get("/paid-endpoint");
    console.log("Response:", response.data);

    // Get payment receipt
    const httpClient = new x402HTTPClient(client);
    const paymentResponse = httpClient.getPaymentSettleResponse(
      (name) => response.headers[name.toLowerCase()]
    );
    console.log("Payment settled:", paymentResponse);
    ```
  </Tab>

  <Tab title="Go">
    [Full example here](https://github.com/coinbase/x402/tree/main/examples/go/clients/http)

    ```go theme={null}
    package main

    import (
        "context"
        "encoding/json"
        "fmt"
        "net/http"
        "os"
        "time"

        x402 "github.com/coinbase/x402/go"
        x402http "github.com/coinbase/x402/go/http"
        evm "github.com/coinbase/x402/go/mechanisms/evm/exact/client"
        evmsigners "github.com/coinbase/x402/go/signers/evm"
    )

    func main() {
        url := "http://localhost:4021/weather"

        // Create EVM signer
        evmSigner, _ := evmsigners.NewClientSignerFromPrivateKey(os.Getenv("EVM_PRIVATE_KEY"))

        // Create x402 client and register EVM scheme
        x402Client := x402.Newx402Client().
            Register("eip155:*", evm.NewExactEvmScheme(evmSigner))

        // Wrap HTTP client with payment handling
        httpClient := x402http.WrapHTTPClientWithPayment(
            http.DefaultClient,
            x402http.Newx402HTTPClient(x402Client),
        )

        // Make request - payment is handled automatically
        ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
        defer cancel()

        req, _ := http.NewRequestWithContext(ctx, "GET", url, nil)
        resp, err := httpClient.Do(req)
        if err != nil {
            fmt.Printf("Request failed: %v\n", err)
            return
        }
        defer resp.Body.Close()

        // Read response
        var data map[string]interface{}
        json.NewDecoder(resp.Body).Decode(&data)
        fmt.Printf("Response: %+v\n", data)

        // Check payment response header
        paymentHeader := resp.Header.Get("PAYMENT-RESPONSE")
        if paymentHeader != "" {
            fmt.Println("Payment settled successfully!")
        }
    }
    ```
  </Tab>

  <Tab title="Python (httpx)">
    **httpx** provides async HTTP client support with automatic 402 payment handling.

    [Full HTTPX example](https://github.com/coinbase/x402/tree/main/examples/python/clients/httpx) | [Full Requests example](https://github.com/coinbase/x402/tree/main/examples/python/clients/requests)

    ```python theme={null}
    import asyncio
    import os
    from eth_account import Account

    from x402 import x402Client
    from x402.http import x402HTTPClient
    from x402.http.clients import x402HttpxClient
    from x402.mechanisms.evm import EthAccountSigner
    from x402.mechanisms.evm.exact.register import register_exact_evm_client


    async def main() -> None:
        client = x402Client()
        account = Account.from_key(os.getenv("EVM_PRIVATE_KEY"))
        register_exact_evm_client(client, EthAccountSigner(account))

        http_client = x402HTTPClient(client)

        async with x402HttpxClient(client) as http:
            response = await http.get("https://api.example.com/paid-endpoint")
            await response.aread()

            print(f"Response: {response.text}")

            if response.is_success:
                settle_response = http_client.get_payment_settle_response(
                    lambda name: response.headers.get(name)
                )
                print(f"Payment settled: {settle_response}")


    asyncio.run(main())
    ```
  </Tab>

  <Tab title="Python (requests)">
    **requests** provides sync HTTP client support with automatic 402 payment handling.

    [Full Requests example](https://github.com/coinbase/x402/tree/main/examples/python/clients/requests)

    ```python theme={null}
    import os
    from eth_account import Account

    from x402 import x402ClientSync
    from x402.http import x402HTTPClientSync
    from x402.http.clients import x402_requests
    from x402.mechanisms.evm import EthAccountSigner
    from x402.mechanisms.evm.exact.register import register_exact_evm_client


    def main() -> None:
        client = x402ClientSync()
        account = Account.from_key(os.getenv("EVM_PRIVATE_KEY"))
        register_exact_evm_client(client, EthAccountSigner(account))

        http_client = x402HTTPClientSync(client)

        with x402_requests(client) as session:
            response = session.get("https://api.example.com/paid-endpoint")

            print(f"Response: {response.text}")

            if response.ok:
                settle_response = http_client.get_payment_settle_response(
                    lambda name: response.headers.get(name)
                )
                print(f"Payment settled: {settle_response}")


    main()
    ```
  </Tab>
</Tabs>

### Multi-Network Client Setup

You can register multiple payment schemes to handle different networks:

<Tabs>
  <Tab title="TypeScript">
    ```typescript theme={null}
    import { wrapFetchWithPayment } from "@x402/fetch";
    import { x402Client } from "@x402/core/client";
    import { registerExactEvmScheme } from "@x402/evm/exact/client";
    import { registerExactSvmScheme } from "@x402/svm/exact/client";
    import { privateKeyToAccount } from "viem/accounts";
    import { createKeyPairSignerFromBytes } from "@solana/kit";
    import { base58 } from "@scure/base";

    // Create signers
    const evmSigner = privateKeyToAccount(process.env.EVM_PRIVATE_KEY as `0x${string}`);
    const svmSigner = await createKeyPairSignerFromBytes(
      base58.decode(process.env.SOLANA_PRIVATE_KEY!)
    );

    // Create client with multiple schemes
    const client = new x402Client();
    registerExactEvmScheme(client, { signer: evmSigner });
    registerExactSvmScheme(client, { signer: svmSigner });

    const fetchWithPayment = wrapFetchWithPayment(fetch, client);

    // Now handles both EVM and Solana networks automatically!
    ```
  </Tab>

  <Tab title="Go">
    ```go theme={null}
    import (
        x402 "github.com/coinbase/x402/go"
        x402http "github.com/coinbase/x402/go/http"
        evm "github.com/coinbase/x402/go/mechanisms/evm/exact/client"
        svm "github.com/coinbase/x402/go/mechanisms/svm/exact/client"
        evmsigners "github.com/coinbase/x402/go/signers/evm"
        svmsigners "github.com/coinbase/x402/go/signers/svm"
    )

    // Create signers
    evmSigner, _ := evmsigners.NewClientSignerFromPrivateKey(os.Getenv("EVM_PRIVATE_KEY"))
    svmSigner, _ := svmsigners.NewClientSignerFromPrivateKey(os.Getenv("SVM_PRIVATE_KEY"))

    // Create client with multiple schemes
    x402Client := x402.Newx402Client().
        Register("eip155:*", evm.NewExactEvmScheme(evmSigner)).
        Register("solana:*", svm.NewExactSvmScheme(svmSigner))

    // Wrap HTTP client with payment handling
    httpClient := x402http.WrapHTTPClientWithPayment(
        http.DefaultClient,
        x402http.Newx402HTTPClient(x402Client),
    )

    // Now handles both EVM and Solana networks automatically!
    ```
  </Tab>

  <Tab title="Python">
    ```python theme={null}
    import asyncio
    import os

    from eth_account import Account

    from x402 import x402Client
    from x402.http.clients import x402HttpxClient
    from x402.mechanisms.evm import EthAccountSigner
    from x402.mechanisms.evm.exact.register import register_exact_evm_client
    from x402.mechanisms.svm import KeypairSigner
    from x402.mechanisms.svm.exact.register import register_exact_svm_client


    async def main() -> None:
        client = x402Client()

        # Register EVM scheme
        account = Account.from_key(os.getenv("EVM_PRIVATE_KEY"))
        register_exact_evm_client(client, EthAccountSigner(account))

        # Register SVM scheme
        svm_signer = KeypairSigner.from_base58(os.getenv("SVM_PRIVATE_KEY"))
        register_exact_svm_client(client, svm_signer)

        async with x402HttpxClient(client) as http:
            response = await http.get("https://api.example.com/paid-endpoint")
            print(f"Response: {response.text}")


    asyncio.run(main())
    ```
  </Tab>
</Tabs>

### 4. Discover Available Services (Optional)

Instead of hardcoding endpoints, you can use the x402 Bazaar to dynamically discover available services. This is especially powerful for building autonomous agents.

```typescript theme={null}
// Fetch available services from the Bazaar API
const response = await fetch(
  "https://api.cdp.coinbase.com/platform/v2/x402/discovery/resources"
);
const services = await response.json();

// Filter services by criteria
const affordableServices = services.items.filter((item) =>
  item.accepts.some((req) => Number(req.amount) < 100000) // Under $0.10
);

console.log("Available services:", affordableServices);
```

Learn more about service discovery in the [Bazaar documentation](/extensions/bazaar).

### 5. Error Handling

Clients will throw errors if:

* No scheme is registered for the required network
* The request configuration is missing
* A payment has already been attempted for the request
* There is an error creating the payment header

Common error handling:

```typescript theme={null}
try {
  const response = await fetchWithPayment(url, { method: "GET" });
  // Handle success
} catch (error) {
  if (error.message.includes("No scheme registered")) {
    console.error("Network not supported - register the appropriate scheme");
  } else if (error.message.includes("Payment already attempted")) {
    console.error("Payment failed on retry");
  } else {
    console.error("Request failed:", error);
  }
}
```

### Summary

* Install x402 client packages (`@x402/fetch` or `@x402/axios`) and mechanism packages (`@x402/evm`, `@x402/svm`)
* Create a wallet signer
* Create an `x402Client` and register payment schemes
* Use the provided wrapper/interceptor to make paid API requests
* (Optional) Use the x402 Bazaar to discover services dynamically
* Payment flows are handled automatically for you

***

**Next Steps:**

* Explore [Advanced Concepts](/advanced-concepts/lifecycle-hooks) like lifecycle hooks for custom logic before/after verification/settlement
* Explore [Extensions](/extensions/bazaar) like Bazaar for service discovery

**References:**

* [@x402/fetch on npm](https://www.npmjs.com/package/@x402/fetch)
* [@x402/axios on npm](https://www.npmjs.com/package/@x402/axios)
* [@x402/evm on npm](https://www.npmjs.com/package/@x402/evm)
* [x402 Go module](https://github.com/coinbase/x402/tree/main/go)

For questions or support, join our [Discord](https://discord.gg/cdp).


# Quickstart for Sellers
Source: https://docs.x402.org/getting-started/quickstart-for-sellers

This guide walks you through integrating with **x402** to enable payments for your API or service. By the end, your API will be able to charge buyers and AI agents for access.

**Note:** This quickstart begins with testnet configuration for safe testing. When you're ready for production, see [Running on Mainnet](#running-on-mainnet) for the simple changes needed to accept real payments on Base (EVM) and Solana networks.

### Prerequisites

Before you begin, ensure you have:

* A crypto wallet to receive funds (any EVM-compatible wallet)
* [Node.js](https://nodejs.org/en) and npm, [Go](https://go.dev/), or Python and pip installed
* An existing API or server

**Note**\
We have pre-configured examples available in our repo for both [Node.js](https://github.com/coinbase/x402/tree/main/examples/typescript/servers) and [Go](https://github.com/coinbase/x402/tree/main/examples/go/servers). We also have an [advanced example](https://github.com/coinbase/x402/tree/main/examples/typescript/servers/advanced) that shows how to use the x402 SDKs to build a more complex payment flow.

### 1. Install Dependencies

<Tabs>
  <Tab title="Express">
    Install the [x402 Express middleware package](https://www.npmjs.com/package/@x402/express).

    ```bash theme={null}
    npm install @x402/express @x402/core @x402/evm
    ```
  </Tab>

  <Tab title="Next.js">
    Install the [x402 Next.js middleware package](https://www.npmjs.com/package/@x402/next).

    ```bash theme={null}
    npm install @x402/next @x402/core @x402/evm
    ```
  </Tab>

  <Tab title="Hono">
    Install the [x402 Hono middleware package](https://www.npmjs.com/package/@x402/hono).

    ```bash theme={null}
    npm install @x402/hono @x402/core @x402/evm
    ```
  </Tab>

  <Tab title="Go">
    Add the x402 Go module to your project:

    ```bash theme={null}
    go get github.com/coinbase/x402/go
    ```
  </Tab>

  <Tab title="FastAPI">
    [Install the x402 Python package](https://pypi.org/project/x402/) with FastAPI support:

    ```bash theme={null}
    pip install "x402[fastapi]"

    # For Solana support, also add:
    pip install "x402[svm]"
    ```
  </Tab>

  <Tab title="Flask">
    [Install the x402 Python package](https://pypi.org/project/x402/) with Flask support:

    ```bash theme={null}
    pip install "x402[flask]"

    # For Solana support, also add:
    pip install "x402[svm]"
    ```
  </Tab>
</Tabs>

### 2. Add Payment Middleware

Integrate the payment middleware into your application. You will need to provide:

* The Facilitator URL or facilitator client. For testing, use `https://x402.org/facilitator` which works on Base Sepolia and Solana devnet.
  * For mainnet setup, see [Running on Mainnet](#running-on-mainnet)
* The routes you want to protect.
* Your receiving wallet address.

<Tabs>
  <Tab title="Express">
    Full example in the repo [here](https://github.com/coinbase/x402/tree/main/examples/typescript/servers/express).

    ```typescript theme={null}
    import express from "express";
    import { paymentMiddleware } from "@x402/express";
    import { x402ResourceServer, HTTPFacilitatorClient } from "@x402/core/server";
    import { registerExactEvmScheme } from "@x402/evm/exact/server";

    const app = express();

    // Your receiving wallet address
    const payTo = "0xYourAddress";

    // Create facilitator client (testnet)
    const facilitatorClient = new HTTPFacilitatorClient({
      url: "https://x402.org/facilitator"
    });

    // Create resource server and register EVM scheme
    const server = new x402ResourceServer(facilitatorClient);
    registerExactEvmScheme(server);

    app.use(
      paymentMiddleware(
        {
          "GET /weather": {
            accepts: [
              {
                scheme: "exact",
                price: "$0.001", // USDC amount in dollars
                network: "eip155:84532", // Base Sepolia (CAIP-2 format)
                payTo,
              },
            ],
            description: "Get current weather data for any location",
            mimeType: "application/json",
          },
        },
        server,
      ),
    );

    // Implement your route
    app.get("/weather", (req, res) => {
      res.send({
        report: {
          weather: "sunny",
          temperature: 70,
        },
      });
    });

    app.listen(4021, () => {
      console.log(`Server listening at http://localhost:4021`);
    });
    ```
  </Tab>

  <Tab title="Next.js">
    Full example in the repo [here](https://github.com/coinbase/x402/tree/main/examples/typescript/fullstack/next).

    ```typescript theme={null}
    // middleware.ts
    import { paymentProxy } from "@x402/next";
    import { x402ResourceServer, HTTPFacilitatorClient } from "@x402/core/server";
    import { registerExactEvmScheme } from "@x402/evm/exact/server";

    const payTo = "0xYourAddress";

    const facilitatorClient = new HTTPFacilitatorClient({
      url: "https://x402.org/facilitator"
    });

    const server = new x402ResourceServer(facilitatorClient);
    registerExactEvmScheme(server);

    export const middleware = paymentProxy(
      {
        "/api/protected": {
          accepts: [
            {
              scheme: "exact",
              price: "$0.01",
              network: "eip155:84532",
              payTo,
            },
          ],
          description: "Access to protected content",
          mimeType: "application/json",
        },
      },
      server,
    );

    export const config = {
      matcher: ["/api/protected/:path*"],
    };
    ```
  </Tab>

  <Tab title="Hono">
    Full example in the repo [here](https://github.com/coinbase/x402/tree/main/examples/typescript/servers/hono).

    ```typescript theme={null}
    import { Hono } from "hono";
    import { serve } from "@hono/node-server";
    import { paymentMiddleware } from "@x402/hono";
    import { x402ResourceServer, HTTPFacilitatorClient } from "@x402/core/server";
    import { registerExactEvmScheme } from "@x402/evm/exact/server";

    const app = new Hono();
    const payTo = "0xYourAddress";

    const facilitatorClient = new HTTPFacilitatorClient({
      url: "https://x402.org/facilitator"
    });

    const server = new x402ResourceServer(facilitatorClient);
    registerExactEvmScheme(server);

    app.use(
      paymentMiddleware(
        {
          "/protected-route": {
            accepts: [
              {
                scheme: "exact",
                price: "$0.10",
                network: "eip155:84532",
                payTo,
              },
            ],
            description: "Access to premium content",
            mimeType: "application/json",
          },
        },
        server,
      ),
    );

    app.get("/protected-route", (c) => {
      return c.json({ message: "This content is behind a paywall" });
    });

    serve({ fetch: app.fetch, port: 3000 });
    ```
  </Tab>

  <Tab title="Go (Gin)">
    Full example in the repo [here](https://github.com/coinbase/x402/tree/main/examples/go/servers/gin).

    ```go theme={null}
    package main

    import (
        "net/http"
        "time"

        x402 "github.com/coinbase/x402/go"
        x402http "github.com/coinbase/x402/go/http"
        ginmw "github.com/coinbase/x402/go/http/gin"
        evm "github.com/coinbase/x402/go/mechanisms/evm/exact/server"
        "github.com/gin-gonic/gin"
    )

    func main() {
        payTo := "0xYourAddress"
        network := x402.Network("eip155:84532") // Base Sepolia (CAIP-2 format)

        r := gin.Default()

        // Create facilitator client
        facilitatorClient := x402http.NewHTTPFacilitatorClient(&x402http.FacilitatorConfig{
            URL: "https://x402.org/facilitator",
        })

        // Apply x402 payment middleware
        r.Use(ginmw.X402Payment(ginmw.Config{
            Routes: x402http.RoutesConfig{
                "GET /weather": {
                    Accepts: x402http.PaymentOptions{
                        {
                            Scheme:  "exact",
                            PayTo:   payTo,
                            Price:   "$0.001",
                            Network: network,
                        },
                    },
                    Description: "Get weather data for a city",
                    MimeType:    "application/json",
                },
            },
            Facilitator: facilitatorClient,
            Schemes: []ginmw.SchemeConfig{
                {Network: network, Server: evm.NewExactEvmScheme()},
            },
            SyncFacilitatorOnStart: true,
            Timeout:    30 * time.Second,
        }))

        // Protected endpoint
        r.GET("/weather", func(c *gin.Context) {
            c.JSON(http.StatusOK, gin.H{
                "weather":     "sunny",
                "temperature": 70,
            })
        })

        r.Run(":4021")
    }
    ```
  </Tab>

  <Tab title="FastAPI">
    Full example in the repo [here](https://github.com/coinbase/x402/tree/main/examples/python/servers/fastapi).

    ```python theme={null}
    from typing import Any

    from fastapi import FastAPI

    from x402.http import FacilitatorConfig, HTTPFacilitatorClient, PaymentOption
    from x402.http.middleware.fastapi import PaymentMiddlewareASGI
    from x402.http.types import RouteConfig
    from x402.mechanisms.evm.exact import ExactEvmServerScheme
    from x402.server import x402ResourceServer

    app = FastAPI()

    # Your receiving wallet address
    pay_to = "0xYourAddress"

    # Create facilitator client (testnet)
    facilitator = HTTPFacilitatorClient(
        FacilitatorConfig(url="https://x402.org/facilitator")
    )

    # Create resource server and register EVM scheme
    server = x402ResourceServer(facilitator)
    server.register("eip155:84532", ExactEvmServerScheme())

    # Define protected routes
    routes: dict[str, RouteConfig] = {
        "GET /weather": RouteConfig(
            accepts=[
                PaymentOption(
                    scheme="exact",
                    pay_to=pay_to,
                    price="$0.001",  # USDC amount in dollars
                    network="eip155:84532",  # Base Sepolia (CAIP-2 format)
                ),
            ],
            mime_type="application/json",
            description="Get current weather data for any location",
        ),
    }

    # Add payment middleware
    app.add_middleware(PaymentMiddlewareASGI, routes=routes, server=server)


    @app.get("/weather")
    async def get_weather() -> dict[str, Any]:
        return {
            "report": {
                "weather": "sunny",
                "temperature": 70,
            }
        }


    if __name__ == "__main__":
        import uvicorn
        uvicorn.run(app, host="0.0.0.0", port=4021)
    ```
  </Tab>

  <Tab title="Flask">
    Full example in the repo [here](https://github.com/coinbase/x402/tree/main/examples/python/servers/flask).

    ```python theme={null}
    from flask import Flask, jsonify

    from x402.http import FacilitatorConfig, HTTPFacilitatorClientSync, PaymentOption
    from x402.http.middleware.flask import payment_middleware
    from x402.http.types import RouteConfig
    from x402.mechanisms.evm.exact import ExactEvmServerScheme
    from x402.server import x402ResourceServerSync

    app = Flask(__name__)

    pay_to = "0xYourAddress"

    facilitator = HTTPFacilitatorClientSync(
        FacilitatorConfig(url="https://x402.org/facilitator")
    )

    server = x402ResourceServerSync(facilitator)
    server.register("eip155:84532", ExactEvmServerScheme())

    routes: dict[str, RouteConfig] = {
        "GET /weather": RouteConfig(
            accepts=[
                PaymentOption(
                    scheme="exact",
                    pay_to=pay_to,
                    price="$0.001",
                    network="eip155:84532",
                ),
            ],
            mime_type="application/json",
            description="Get current weather data for any location",
        ),
    }

    payment_middleware(app, routes=routes, server=server)


    @app.route("/weather")
    def get_weather():
        return jsonify({
            "report": {
                "weather": "sunny",
                "temperature": 70,
            }
        })


    if __name__ == "__main__":
        app.run(host="0.0.0.0", port=4021)
    ```
  </Tab>
</Tabs>

**Route Configuration Interface:**

```typescript theme={null}
interface RouteConfig {
  accepts: Array<{
    scheme: string;           // Payment scheme (e.g., "exact")
    price: string;            // Price in dollars (e.g., "$0.01")
    network: string;          // Network in CAIP-2 format (e.g., "eip155:84532")
    payTo: string;            // Your wallet address
  }>;
  description?: string;       // Description of the resource
  mimeType?: string;          // MIME type of the response
  extensions?: object;        // Optional extensions (e.g., Bazaar)
}
```

When a request is made to these routes without payment, your server will respond with the HTTP 402 Payment Required code and payment instructions.

### 3. Test Your Integration

To verify:

1. Make a request to your endpoint (e.g., `curl http://localhost:4021/weather`).
2. The server responds with a 402 Payment Required, including payment instructions in the `PAYMENT-REQUIRED` header.
3. Complete the payment using a compatible client, wallet, or automated agent. This typically involves signing a payment payload, which is handled by the client SDK detailed in the [Quickstart for Buyers](/getting-started/quickstart-for-buyers).
4. Retry the request, this time including the `PAYMENT-SIGNATURE` header containing the cryptographic proof of payment.
5. The server verifies the payment via the facilitator and, if valid, returns your actual API response (e.g., `{ "data": "Your paid API response." }`).

### 4. Enhance Discovery with Metadata (Recommended)

When using a facilitator that supports the Bazaar extension, your endpoints can be listed in the [x402 Bazaar](/extensions/bazaar), our discovery layer that helps buyers and AI agents find services. To enable discovery:

```typescript theme={null}
{
  "GET /weather": {
    accepts: [
      {
        scheme: "exact",
        price: "$0.001",
        network: "eip155:8453",
        payTo: "0xYourAddress",
      },
    ],
    description: "Get real-time weather data including temperature, conditions, and humidity",
    mimeType: "application/json",
    extensions: {
      bazaar: {
        discoverable: true,
        category: "weather",
        tags: ["forecast", "real-time"],
      },
    },
  },
}
```

Learn more about the discovery layer in the [Bazaar documentation](/extensions/bazaar).

### 5. Error Handling

* If you run into trouble, check out the examples in the [repo](https://github.com/coinbase/x402/tree/main/examples) for more context and full code.
* Run `npm install` or `go mod tidy` to install dependencies

***

## Running on Mainnet

Once you've tested your integration on testnet, you're ready to accept real payments on mainnet.

### 1. Update the Facilitator URL

For mainnet, use a production facilitator. See the [x402 Ecosystem](https://www.x402.org/ecosystem?category=facilitators) for available options. Example using one facilitator:

<Tabs>
  <Tab title="Node.js">
    ```typescript theme={null}
    const facilitatorClient = new HTTPFacilitatorClient({
      url: "https://api.cdp.coinbase.com/platform/v2/x402"
    });
    ```
  </Tab>

  <Tab title="Go">
    ```go theme={null}
    facilitatorClient := x402http.NewHTTPFacilitatorClient(&x402http.FacilitatorConfig{
        URL: "https://api.cdp.coinbase.com/platform/v2/x402",
    })
    ```
  </Tab>

  <Tab title="Python (FastAPI)">
    ```python theme={null}
    from x402.http import FacilitatorConfig, HTTPFacilitatorClient

    facilitator = HTTPFacilitatorClient(
        FacilitatorConfig(url="https://api.cdp.coinbase.com/platform/v2/x402")
    )
    ```
  </Tab>

  <Tab title="Python (Flask)">
    ```python theme={null}
    from x402.http import FacilitatorConfig, HTTPFacilitatorClientSync

    facilitator = HTTPFacilitatorClientSync(
        FacilitatorConfig(url="https://api.cdp.coinbase.com/platform/v2/x402")
    )
    ```
  </Tab>
</Tabs>

### 2. Update Your Network Identifier

Change from testnet to mainnet network identifiers:

<Tabs>
  <Tab title="Base Mainnet">
    ```typescript theme={null}
    // Testnet → Mainnet
    network: "eip155:8453", // Base mainnet (was eip155:84532)
    ```
  </Tab>

  <Tab title="Solana Mainnet">
    ```typescript theme={null}
    // Testnet → Mainnet
    network: "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp", // Solana mainnet

    // For Solana, use a Solana wallet address (base58 format)
    payTo: "YourSolanaWalletAddress",
    ```
  </Tab>

  <Tab title="Multi-Network">
    ```typescript theme={null}
    // Support multiple networks on the same endpoint
    {
      "GET /weather": {
        accepts: [
          {
            scheme: "exact",
            price: "$0.001",
            network: "eip155:8453",  // Base mainnet
            payTo: "0xYourEvmAddress",
          },
          {
            scheme: "exact",
            price: "$0.001",
            network: "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp",  // Solana mainnet
            payTo: "YourSolanaAddress",
          },
        ],
        description: "Weather data",
      },
    }
    ```
  </Tab>
</Tabs>

### 3. Register Multiple Schemes (Multi-Network)

For multi-network support, register both EVM and SVM schemes:

<Tabs>
  <Tab title="Node.js">
    ```typescript theme={null}
    import { registerExactEvmScheme } from "@x402/evm/exact/server";
    import { registerExactSvmScheme } from "@x402/svm/exact/server";

    const server = new x402ResourceServer(facilitatorClient);
    registerExactEvmScheme(server);
    registerExactSvmScheme(server);
    ```
  </Tab>

  <Tab title="Go">
    ```go theme={null}
    import (
        evm "github.com/coinbase/x402/go/mechanisms/evm/exact/server"
        svm "github.com/coinbase/x402/go/mechanisms/svm/exact/server"
    )

    r.Use(ginmw.X402Payment(ginmw.Config{
        // ...
        Schemes: []ginmw.SchemeConfig{
            {Network: x402.Network("eip155:8453"), Server: evm.NewExactEvmScheme()},
            {Network: x402.Network("solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp"), Server: svm.NewExactSvmScheme()},
        },
    }))
    ```
  </Tab>

  <Tab title="Python">
    ```python theme={null}
    from x402.mechanisms.evm.exact import ExactEvmServerScheme
    from x402.mechanisms.svm.exact import ExactSvmServerScheme
    from x402.server import x402ResourceServer

    server = x402ResourceServer(facilitator)
    server.register("eip155:8453", ExactEvmServerScheme())  # Base mainnet
    server.register("solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp", ExactSvmServerScheme())  # Solana mainnet
    ```
  </Tab>
</Tabs>

### 4. Update Your Wallet

Make sure your receiving wallet address is a real mainnet address where you want to receive USDC payments.

### 5. Test with Real Payments

Before going live:

1. Test with small amounts first
2. Verify payments are arriving in your wallet
3. Monitor the facilitator for any issues

**Warning:** Mainnet transactions involve real money. Always test thoroughly on testnet first and start with small amounts on mainnet.

***

## Network Identifiers (CAIP-2)

x402 v2 uses [CAIP-2](https://github.com/ChainAgnostic/CAIPs/blob/main/CAIPs/caip-2.md) format for network identifiers:

| Network        | CAIP-2 Identifier                         |
| -------------- | ----------------------------------------- |
| Base Mainnet   | `eip155:8453`                             |
| Base Sepolia   | `eip155:84532`                            |
| Solana Mainnet | `solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp` |
| Solana Devnet  | `solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1` |

See [Network Support](/core-concepts/network-and-token-support) for the full list.

***

### Next Steps

* Check out the [Advanced Example](https://github.com/coinbase/x402/tree/main/examples/typescript/servers/advanced) for a more complex payment flow
* Explore [Advanced Concepts](/advanced-concepts/lifecycle-hooks) like lifecycle hooks for custom logic before/after verification/settlement
* Explore [Extensions](/extensions/bazaar) like Bazaar for service discovery
* Get started as a [buyer](/getting-started/quickstart-for-buyers)

For questions or support, join our [Discord](https://discord.gg/cdp).

### Summary

This quickstart covered:

* Installing the x402 SDK and relevant middleware
* Adding payment middleware to your API and configuring it
* Testing your integration
* Deploying to mainnet with CAIP-2 network identifiers

Your API is now ready to accept crypto payments through x402.


# MCP Server with x402
Source: https://docs.x402.org/guides/mcp-server-with-x402

[Model Context Protocol (MCP)](https://modelcontextprotocol.io/) is a protocol for passing context between LLMs and other AI agents. This page shows how to use the x402 payment protocol with MCP to make paid API requests through an MCP server, and how to connect it to Claude Desktop.

### What is this integration?

This guide walks you through running an MCP server that can access paid APIs using the x402 protocol. The MCP server acts as a bridge between Claude Desktop (or any MCP-compatible client) and a paid API (such as the sample weather API in the x402 repo). When Claude (or another agent) calls a tool, the MCP server will:

1. Detect if the API requires payment (via HTTP 402 with `PAYMENT-REQUIRED` header)
2. Automatically handle the payment using your wallet via the registered x402 scheme
3. Return the paid data to the client (e.g., Claude)

This lets you (or your agent) access paid APIs programmatically, with no manual payment steps.

***

### Prerequisites

* Node.js v20+ (install via [nvm](https://github.com/nvm-sh/nvm))
* pnpm v10 (install via [pnpm.io/installation](https://pnpm.io/installation))
* An x402-compatible server to connect to (for this demo, we'll use the [sample express server with weather data](https://github.com/coinbase/x402/tree/main/examples/typescript/servers/express) from the x402 repo, or any external x402 API)
* An Ethereum wallet with USDC (on Base Sepolia or Base Mainnet) and/or a Solana wallet with USDC (on Devnet or Mainnet)
* [Claude Desktop with MCP support](https://claude.ai/download)

***

### Quick Start

#### 1. Install and Build

```bash theme={null}
# Clone the x402 repository
git clone https://github.com/coinbase/x402.git
cd x402/examples/typescript

# Install dependencies and build packages
pnpm install && pnpm build

# Navigate to the MCP client example
cd clients/mcp
```

#### 2. Configure Claude Desktop

Add the MCP server to your Claude Desktop configuration:

```json theme={null}
{
  "mcpServers": {
    "demo": {
      "command": "pnpm",
      "args": [
        "--silent",
        "-C",
        "<absolute path to this repo>/examples/typescript/clients/mcp",
        "dev"
      ],
      "env": {
        "EVM_PRIVATE_KEY": "<private key of a wallet with USDC on Base Sepolia>",
        "SVM_PRIVATE_KEY": "<base58-encoded private key of a Solana wallet with USDC on Devnet>",
        "RESOURCE_SERVER_URL": "http://localhost:4021",
        "ENDPOINT_PATH": "/weather"
      }
    }
  }
}
```

#### 3. Start the x402 Server

Make sure your x402-compatible server is running at the URL specified in `RESOURCE_SERVER_URL`:

```bash theme={null}
# In another terminal, from the examples/typescript directory
cd servers/express
pnpm dev
```

#### 4. Restart Claude Desktop

Restart Claude Desktop to load the new MCP server, then ask Claude to use the `get-data-from-resource-server` tool.

***

### Environment Variables

| Variable              | Description                                       | Required                   |
| --------------------- | ------------------------------------------------- | -------------------------- |
| `EVM_PRIVATE_KEY`     | Your EVM wallet's private key (0x prefixed)       | One of EVM or SVM required |
| `SVM_PRIVATE_KEY`     | Your Solana wallet's private key (base58 encoded) | One of EVM or SVM required |
| `RESOURCE_SERVER_URL` | The base URL of the paid API                      | Yes                        |
| `ENDPOINT_PATH`       | The specific endpoint path (e.g., `/weather`)     | Yes                        |

***

### Implementation

The MCP server uses `@x402/axios` to wrap axios with automatic payment handling:

```typescript theme={null}
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import axios from "axios";
import { x402Client, wrapAxiosWithPayment } from "@x402/axios";
import { registerExactEvmScheme } from "@x402/evm/exact/client";
import { registerExactSvmScheme } from "@x402/svm/exact/client";
import { privateKeyToAccount } from "viem/accounts";
import { createKeyPairSignerFromBytes } from "@solana/kit";
import { base58 } from "@scure/base";
import { config } from "dotenv";

config();

const evmPrivateKey = process.env.EVM_PRIVATE_KEY as `0x${string}`;
const svmPrivateKey = process.env.SVM_PRIVATE_KEY as string;
const baseURL = process.env.RESOURCE_SERVER_URL || "http://localhost:4021";
const endpointPath = process.env.ENDPOINT_PATH || "/weather";

if (!evmPrivateKey && !svmPrivateKey) {
  throw new Error("At least one of EVM_PRIVATE_KEY or SVM_PRIVATE_KEY must be provided");
}

/**
 * Creates an axios client configured with x402 payment support for EVM and/or SVM.
 */
async function createClient() {
  const client = new x402Client();

  // Register EVM scheme if private key is provided
  if (evmPrivateKey) {
    const evmSigner = privateKeyToAccount(evmPrivateKey);
    registerExactEvmScheme(client, { signer: evmSigner });
  }

  // Register SVM scheme if private key is provided
  if (svmPrivateKey) {
    const svmSigner = await createKeyPairSignerFromBytes(base58.decode(svmPrivateKey));
    registerExactSvmScheme(client, { signer: svmSigner });
  }

  return wrapAxiosWithPayment(axios.create({ baseURL }), client);
}

async function main() {
  const api = await createClient();

  // Create an MCP server
  const server = new McpServer({
    name: "x402 MCP Client Demo",
    version: "2.0.0",
  });

  // Add a tool that calls the paid API
  server.tool(
    "get-data-from-resource-server",
    "Get data from the resource server (in this example, the weather)",
    {},
    async () => {
      const res = await api.get(endpointPath);
      return {
        content: [{ type: "text", text: JSON.stringify(res.data) }],
      };
    },
  );

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
```

***

### How It Works

The MCP server exposes a tool that, when called, fetches data from a paid API endpoint. If the endpoint requires payment, the x402 axios wrapper automatically handles the payment handshake:

1. **402 Response**: The server returns HTTP 402 with `PAYMENT-REQUIRED` header
2. **Parse Requirements**: The wrapper extracts payment requirements from the header
3. **Create Payment**: Uses the registered scheme (EVM or SVM) to create a payment payload
4. **Retry Request**: Sends the original request with the `PAYMENT-SIGNATURE` header
5. **Return Data**: Once payment is verified, the data is returned to Claude

***

### Multi-Network Support

The example supports both EVM (Base, Ethereum) and Solana networks. The x402 client automatically selects the appropriate scheme based on the payment requirements:

```typescript theme={null}
import { x402Client, wrapAxiosWithPayment } from "@x402/axios";
import { registerExactEvmScheme } from "@x402/evm/exact/client";
import { registerExactSvmScheme } from "@x402/svm/exact/client";

const client = new x402Client();

// Register EVM scheme for Base/Ethereum payments
registerExactEvmScheme(client, { signer: evmSigner });

// Register SVM scheme for Solana payments
registerExactSvmScheme(client, { signer: svmSigner });

// Now handles both EVM and Solana networks automatically
const httpClient = wrapAxiosWithPayment(axios.create({ baseURL }), client);
```

When the server returns a 402 response, the client checks the `network` field in the payment requirements:

* `eip155:*` networks use the EVM scheme
* `solana:*` networks use the SVM scheme

***

### Response Handling

#### Payment Required (402)

When a payment is required, the client receives:

```
HTTP/1.1 402 Payment Required
PAYMENT-REQUIRED: <base64-encoded JSON>
```

The wrapper automatically:

1. Parses the payment requirements
2. Creates and signs a payment using the appropriate scheme
3. Retries the request with the `PAYMENT-SIGNATURE` header

#### Successful Response

After payment is processed, the MCP server returns:

```json theme={null}
{
  "content": [
    {
      "type": "text",
      "text": "{\"report\":{\"weather\":\"sunny\",\"temperature\":70}}"
    }
  ]
}
```

***

### Architecture Diagram

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Claude Desktop │────▶│   MCP Server    │────▶│  x402 API       │
│                 │     │  (x402 client)  │     │  (paid endpoint)│
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                       │                       │
        │  1. Call tool         │  2. GET /weather      │
        │                       │                       │
        │                       │  3. 402 + requirements│
        │                       │◀──────────────────────│
        │                       │                       │
        │                       │  4. Sign payment      │
        │                       │                       │
        │                       │  5. Retry with payment│
        │                       │──────────────────────▶│
        │                       │                       │
        │                       │  6. 200 + data        │
        │                       │◀──────────────────────│
        │                       │                       │
        │  7. Return response   │                       │
        │◀──────────────────────│                       │
```

***

### Dependencies

The example uses these x402 v2 packages:

```json theme={null}
{
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.9.0",
    "@x402/axios": "workspace:*",
    "@x402/evm": "workspace:*",
    "@x402/svm": "workspace:*",
    "axios": "^1.13.2",
    "viem": "^2.39.0",
    "@solana/kit": "^2.1.1",
    "@scure/base": "^1.2.6"
  }
}
```

***

### How the Pieces Fit Together

* **x402-compatible server**: Hosts the paid API (e.g., weather data). Responds with HTTP 402 and `PAYMENT-REQUIRED` header if payment is required.
* **MCP server (this implementation)**: Acts as a bridge, handling payment via `@x402/axios` and exposing tools to MCP clients.
* **Claude Desktop**: Calls the MCP tool, receives the paid data, and displays it to the user.

***

### Next Steps

* [See the full example in the repo](https://github.com/coinbase/x402/tree/main/examples/typescript/clients/mcp)
* Try integrating with your own x402-compatible APIs
* Extend the MCP server with more tools or custom logic as needed
* [Learn about building x402 servers](/getting-started/quickstart-for-sellers)


# Migration Guide: V1 to V2
Source: https://docs.x402.org/guides/migration-v1-to-v2

This guide helps you migrate from x402 V1 to V2. The V2 protocol introduces standardized identifiers, improved type safety, and a more modular architecture.

## Overview

| Aspect          | V1                                   | V2                                                        |
| --------------- | ------------------------------------ | --------------------------------------------------------- |
| Payment Header  | `X-PAYMENT`                          | `PAYMENT-SIGNATURE`                                       |
| Response Header | `X-PAYMENT-RESPONSE`                 | `PAYMENT-RESPONSE`                                        |
| Network Format  | String (`base-sepolia`)              | CAIP-2 (`eip155:84532`)                                   |
| Version Field   | `x402Version: 1`                     | `x402Version: 2`                                          |
| Packages        | `x402`, `x402-express`, `x402-axios` | `@x402/core`, `@x402/express`, `@x402/axios`, `@x402/evm` |

## For Buyers

### Before (V1)

<Tabs>
  <Tab title="TypeScript">
    ```typescript theme={null}
    import { withPaymentInterceptor } from "x402-axios";
    import { createWalletClient, http } from "viem";
    import { privateKeyToAccount } from "viem/accounts";
    import { baseSepolia } from "viem/chains";
    import axios from "axios";

    const account = privateKeyToAccount(process.env.PRIVATE_KEY as `0x${string}`);
    const walletClient = createWalletClient({
      account,
      chain: baseSepolia,
      transport: http(),
    });

    // V1 pattern
    const api = withPaymentInterceptor(
      axios.create({ baseURL: "https://api.example.com" }),
      walletClient,
    );

    const response = await api.get("/paid-endpoint");
    ```
  </Tab>

  <Tab title="Python">
    ```python theme={null}
    import os

    from eth_account import Account

    from x402.clients.httpx import x402HttpxClient

    # V1 pattern
    account = Account.from_key(os.getenv("PRIVATE_KEY"))

    async with x402HttpxClient(account=account, base_url="https://api.example.com") as client:
        response = await client.get("/protected-endpoint")
        print(await response.aread())
    ```
  </Tab>
</Tabs>

### After (V2)

<Tabs>
  <Tab title="TypeScript">
    ```typescript theme={null}
    import { x402Client, wrapAxiosWithPayment } from "@x402/axios";
    import { registerExactEvmScheme } from "@x402/evm/exact/client";
    import { privateKeyToAccount } from "viem/accounts";
    import axios from "axios";

    const signer = privateKeyToAccount(process.env.EVM_PRIVATE_KEY as `0x${string}`);

    // V2 pattern: Create client and register scheme separately
    const client = new x402Client();
    registerExactEvmScheme(client, { signer });

    // Wrap axios with payment handling
    const api = wrapAxiosWithPayment(
      axios.create({ baseURL: "https://api.example.com" }),
      client,
    );

    const response = await api.get("/paid-endpoint");
    ```
  </Tab>

  <Tab title="Python">
    ```python theme={null}
    import asyncio
    import os

    from eth_account import Account

    from x402 import x402Client
    from x402.http import x402HTTPClient
    from x402.http.clients import x402HttpxClient
    from x402.mechanisms.evm import EthAccountSigner
    from x402.mechanisms.evm.exact.register import register_exact_evm_client


    async def main() -> None:
        # V2 pattern: Create client and register scheme separately
        client = x402Client()
        account = Account.from_key(os.getenv("EVM_PRIVATE_KEY"))
        register_exact_evm_client(client, EthAccountSigner(account))

        http_client = x402HTTPClient(client)

        async with x402HttpxClient(client) as http:
            response = await http.get("https://api.example.com/paid-endpoint")
            await response.aread()

            print(f"Response: {response.text}")

            if response.is_success:
                settle_response = http_client.get_payment_settle_response(
                    lambda name: response.headers.get(name)
                )
                print(f"Payment settled: {settle_response}")


    asyncio.run(main())
    ```
  </Tab>
</Tabs>

### Key Changes

<Tabs>
  <Tab title="TypeScript">
    1. **Package rename**: `x402-axios` → `@x402/axios`
    2. **Function rename**: `withPaymentInterceptor` → `wrapAxiosWithPayment`
    3. **Wallet setup**: Use `x402Client` with `registerExactEvmScheme` helper instead of passing wallet directly
    4. **No chain-specific configuration**: The V2 client automatically handles network selection based on payment requirements
  </Tab>

  <Tab title="Python">
    1. **Import path changes**: `x402.clients.httpx` → `x402.http.clients`
    2. **Signer wrapper**: Wrap `eth_account.Account` with `EthAccountSigner`
    3. **Client construction**: Create `x402Client()` first, then register schemes
    4. **Environment variable**: `PRIVATE_KEY` → `EVM_PRIVATE_KEY`
    5. **Async/Sync variants**: Use `x402Client` for httpx (async), `x402ClientSync` for requests (sync)
  </Tab>
</Tabs>

## For Sellers

### Before (V1)

<Tabs>
  <Tab title="TypeScript">
    ```typescript theme={null}
    import { paymentMiddleware, FacilitatorConfig } from "x402-express";
    import express from "express";

    const app = express();

    const facilitatorConfig: FacilitatorConfig = {
      url: "https://x402.org/facilitator",
    };

    app.use(
      paymentMiddleware(facilitatorConfig, {
        "GET /weather": {
          price: "$0.001",
          network: "base-sepolia", // V1 string format
          config: {
            description: "Get weather data",
          },
        },
      }),
    );
    ```
  </Tab>

  <Tab title="Python">
    ```python theme={null}
    from typing import Any, Dict

    from fastapi import FastAPI

    from x402.fastapi.middleware import require_payment

    app = FastAPI()

    # V1 pattern
    app.middleware("http")(
        require_payment(
            path="/weather",
            price="$0.001",
            pay_to_address="0xYourAddress",
            network="base-sepolia",  # V1 string identifier
        )
    )

    @app.get("/weather")
    async def get_weather() -> Dict[str, Any]:
        return {"report": {"weather": "sunny", "temperature": 70}}
    ```
  </Tab>
</Tabs>

### After (V2)

<Tabs>
  <Tab title="TypeScript">
    ```typescript theme={null}
    import express from "express";
    import { paymentMiddleware } from "@x402/express";
    import { x402ResourceServer, HTTPFacilitatorClient } from "@x402/core/server";
    import { registerExactEvmScheme } from "@x402/evm/exact/server";

    const app = express();
    const payTo = "0xYourAddress";

    // V2 pattern: Create facilitator client and resource server
    const facilitatorClient = new HTTPFacilitatorClient({
      url: "https://x402.org/facilitator"
    });

    const server = new x402ResourceServer(facilitatorClient);
    registerExactEvmScheme(server);

    app.use(
      paymentMiddleware(
        {
          "GET /weather": {
            accepts: [
              {
                scheme: "exact",
                price: "$0.001",
                network: "eip155:84532", // V2 CAIP-2 format
                payTo,
              },
            ],
            description: "Get weather data",
            mimeType: "application/json",
          },
        },
        server,
      ),
    );
    ```
  </Tab>

  <Tab title="Python">
    ```python theme={null}
    from typing import Any

    from fastapi import FastAPI

    from x402.http import FacilitatorConfig, HTTPFacilitatorClient, PaymentOption
    from x402.http.middleware.fastapi import PaymentMiddlewareASGI
    from x402.http.types import RouteConfig
    from x402.mechanisms.evm.exact import ExactEvmServerScheme
    from x402.server import x402ResourceServer

    app = FastAPI()

    # V2 pattern: Create facilitator client and resource server
    facilitator = HTTPFacilitatorClient(
        FacilitatorConfig(url="https://x402.org/facilitator")
    )

    server = x402ResourceServer(facilitator)
    server.register("eip155:84532", ExactEvmServerScheme())

    # V2: Route config uses accepts array with explicit scheme, network, and pay_to
    routes: dict[str, RouteConfig] = {
        "GET /weather": RouteConfig(
            accepts=[
                PaymentOption(
                    scheme="exact",
                    pay_to="0xYourAddress",
                    price="$0.001",
                    network="eip155:84532",  # V2 CAIP-2 format
                ),
            ],
            mime_type="application/json",
            description="Get weather data",
        ),
    }

    app.add_middleware(PaymentMiddlewareASGI, routes=routes, server=server)


    @app.get("/weather")
    async def get_weather() -> dict[str, Any]:
        return {"report": {"weather": "sunny", "temperature": 70}}
    ```
  </Tab>
</Tabs>

### Key Changes

<Tabs>
  <Tab title="TypeScript">
    1. **Package rename**: `x402-express` → `@x402/express`
    2. **Configuration structure**: Route config now uses `accepts` array with explicit `scheme`, `network`, and `payTo`
    3. **Network format**: `base-sepolia` → `eip155:84532` (CAIP-2 standard)
    4. **Resource server**: Create `x402ResourceServer` with facilitator client and register schemes using helper functions
    5. **Price recipient**: Explicitly specify `payTo` address per route
  </Tab>

  <Tab title="Python">
    1. **Import path changes**: `x402.fastapi.middleware` → `x402.http.middleware.fastapi`
    2. **Middleware pattern**: `require_payment` decorator → `PaymentMiddlewareASGI` class
    3. **Configuration structure**: Route config now uses `RouteConfig` and `PaymentOption` Pydantic models
    4. **Network format**: `base-sepolia` → `eip155:84532` (CAIP-2 standard)
    5. **Resource server**: Create `x402ResourceServer` and register schemes explicitly
    6. **Type hints**: Use modern Python type hints (`dict[str, Any]` instead of `Dict[str, Any]`)
    7. **Async/Sync variants**: Use `x402ResourceServer` + `HTTPFacilitatorClient` for FastAPI (async), use `x402ResourceServerSync` + `HTTPFacilitatorClientSync` for Flask (sync)
  </Tab>
</Tabs>

## Network Identifier Mapping

| V1 Name         | V2 CAIP-2 ID      | Chain ID | Description              |
| --------------- | ----------------- | -------- | ------------------------ |
| `base-sepolia`  | `eip155:84532`    | 84532    | Base Sepolia Testnet     |
| `base`          | `eip155:8453`     | 8453     | Base Mainnet             |
| `ethereum`      | `eip155:1`        | 1        | Ethereum Mainnet         |
| `sepolia`       | `eip155:11155111` | 11155111 | Ethereum Sepolia Testnet |
| `solana-devnet` | `solana:devnet`   | -        | Solana Devnet            |
| `solana`        | `solana:mainnet`  | -        | Solana Mainnet           |

## Package Migration Reference

<Tabs>
  <Tab title="TypeScript">
    | V1 Package     | V2 Package(s)                |
    | -------------- | ---------------------------- |
    | `x402`         | `@x402/core`                 |
    | `x402-express` | `@x402/express`              |
    | `x402-axios`   | `@x402/axios`                |
    | `x402-fetch`   | `@x402/fetch`                |
    | `x402-hono`    | `@x402/hono`                 |
    | `x402-next`    | `@x402/next`                 |
    | (built-in)     | `@x402/evm` (EVM support)    |
    | (built-in)     | `@x402/svm` (Solana support) |
  </Tab>

  <Tab title="Python">
    | V1 Import Path            | V2 Import Path                                        |
    | ------------------------- | ----------------------------------------------------- |
    | `x402.clients.httpx`      | `x402.http.clients.x402HttpxClient`                   |
    | `x402.clients.requests`   | `x402.http.clients.x402_requests`                     |
    | `x402.fastapi.middleware` | `x402.http.middleware.fastapi`                        |
    | `x402.flask.middleware`   | `x402.http.middleware.flask`                          |
    | `x402.facilitator`        | `x402.http.HTTPFacilitatorClient`                     |
    | (new)                     | `x402.mechanisms.evm.EthAccountSigner`                |
    | (new)                     | `x402.mechanisms.evm.exact.register_exact_evm_client` |
    | (new)                     | `x402.mechanisms.svm.KeypairSigner`                   |
    | (new)                     | `x402.mechanisms.svm.exact.register_exact_svm_client` |
    | (new)                     | `x402.server.x402ResourceServer`                      |

    **Installation with extras:**

    ```bash theme={null}
    # V1
    pip install x402

    # V2 - install with specific extras
    pip install "x402[httpx]"      # For async HTTP clients
    pip install "x402[requests]"   # For sync HTTP clients
    pip install "x402[fastapi]"    # For FastAPI servers
    pip install "x402[flask]"      # For Flask servers
    pip install "x402[svm]"        # For Solana support
    ```
  </Tab>
</Tabs>

## Header Changes

If you're implementing custom HTTP handling, update your header names:

<Tabs>
  <Tab title="TypeScript">
    ```typescript theme={null}
    // V1
    const payment = req.header("X-PAYMENT");
    res.setHeader("X-PAYMENT-RESPONSE", responseData);

    // V2
    const payment = req.header("PAYMENT-SIGNATURE");
    res.setHeader("PAYMENT-RESPONSE", responseData);
    ```
  </Tab>

  <Tab title="Python">
    ```python theme={null}
    # V1
    payment = request.headers.get("X-PAYMENT")
    response.headers["X-PAYMENT-RESPONSE"] = response_data

    # V2
    payment = request.headers.get("PAYMENT-SIGNATURE")
    response.headers["PAYMENT-RESPONSE"] = response_data
    ```
  </Tab>
</Tabs>

## Troubleshooting

<Tabs>
  <Tab title="TypeScript">
    ### "Cannot find module" errors

    Ensure you've installed all V2 packages:

    ```bash theme={null}
    # For buyers
    npm install @x402/axios @x402/evm

    # For sellers (Express)
    npm install @x402/express @x402/core @x402/evm
    ```
  </Tab>

  <Tab title="Python">
    ### "ModuleNotFoundError" errors

    Ensure you've installed the x402 package with the correct extras:

    ```bash theme={null}
    # For async HTTP clients (httpx)
    pip install "x402[httpx]"

    # For sync HTTP clients (requests)
    pip install "x402[requests]"

    # For FastAPI servers
    pip install "x402[fastapi]"

    # For Flask servers
    pip install "x402[flask]"

    # For Solana support
    pip install "x402[svm]"
    ```
  </Tab>
</Tabs>

### Payment verification failures

* Check you're using CAIP-2 network identifiers (`eip155:84532` not `base-sepolia`)
* Verify your `payTo` address is correctly configured
* Ensure the facilitator URL is correct for your network (testnet vs mainnet)

### Mixed V1/V2 compatibility

The facilitator supports both V1 and V2 protocols. During migration, your V2 server can still accept payments from V1 clients, but we recommend updating clients to V2 for full feature support.

## Next Steps

* [Quickstart for Buyers](/getting-started/quickstart-for-buyers)
* [Quickstart for Sellers](/getting-started/quickstart-for-sellers)
* [Network and Token Support](/core-concepts/network-and-token-support)


# Welcome to x402
Source: https://docs.x402.org/introduction

This guide will help you understand x402, the open payment standard, and help you get started building or integrating services with x402.

x402 is the open payment standard that enables services to charge for access to their APIs and content directly over HTTP. It is built around the HTTP `402 Payment Required` status code and allows clients to programmatically pay for resources without accounts, sessions, or credential management.

With x402, any web service can require payment before serving a response, using crypto-native payments for speed, privacy, and efficiency.

**Want to contribute to our docs?** [The GitBook repo is open to PRs! ](https://github.com/coinbase/x402) Our only ask is that you keep these docs as a neutral resource, with no branded content other than linking out to other resources where appropriate.

**Note about the docs:** These docs are the credibly neutral source of truth for x402, as x402 is a completely open standard under the Apache-2.0 license. Coinbase Developer Platform is currently sponsoring [AI-powered docs for users here](https://docs.cdp.coinbase.com/x402/welcome), as we migrate to our own AI-powered solution on the main x402.org domain.

### Why Use x402?

x402 addresses key limitations of existing payment systems:

* **High fees and friction** with traditional credit cards and fiat payment processors
* **Incompatibility with machine-to-machine payments**, such as AI agents
* **Lack of support for micropayments**, making it difficult to monetize usage-based services

### Who is x402 for?

* **Sellers:** Service providers who want to monetize their APIs or content. x402 enables direct, programmatic payments from clients with minimal setup.
* **Buyers:** Human developers and AI agents seeking to access paid services without accounts or manual payment flows.

Both sellers and buyers interact directly through HTTP requests, with payment handled transparently through the protocol.

### What Can You Build?

x402 enables a range of use cases, including:

* API services paid per request
* AI agents that autonomously pay for API access
* [Paywalls](https://x.com/MurrLincoln/status/1935406976881803601) for digital content
* Microservices and tooling monetized via microtransactions
* Proxy services that aggregate and resell API capabilities

### How Does It Work?

At a high level, the flow is simple:

1. A buyer requests a resource from a server.
2. If payment is required, the server responds with `402 Payment Required`, including payment instructions.
3. The buyer prepares and submits a payment payload.
4. The server verifies and settles the payment using an x402 facilitator's /verify and /settle endpoints.
5. If payment is valid, the server provides the requested resource.

For more detail, see:

* [Client / Server](/core-concepts/client-server)
* [Facilitator](/core-concepts/facilitator)
* [HTTP 402](/core-concepts/http-402)

The goal is to make programmatic commerce accessible, permissionless, and developer-friendly.

### Get Started

Ready to build? Start here:

* [Quickstart for Sellers](/getting-started/quickstart-for-sellers)
* [Quickstart for Buyers](/getting-started/quickstart-for-buyers)
* [Explore Core Concepts](/core-concepts/http-402)
* [Join our community on Discord](https://discord.gg/invite/cdp)


# SDK Features
Source: https://docs.x402.org/sdk-features

Feature parity across TypeScript, Go, and Python SDKs

# SDK Features

This page tracks which features are implemented in each SDK (TypeScript, Go, Python v2).

## Core

| Component   | TypeScript | Go | Python |
| ----------- | ---------- | -- | ------ |
| Server      | ✅          | ✅  | ✅      |
| Client      | ✅          | ✅  | ✅      |
| Facilitator | ✅          | ✅  | ✅      |

### HTTP Framework Integrations

| Role   | TypeScript             | Go       | Python          |
| ------ | ---------------------- | -------- | --------------- |
| Server | Express, Hono, Next.js | Gin      | FastAPI, Flask  |
| Client | Fetch, Axios           | net/http | httpx, requests |

## Networks

| Network       | TypeScript | Go | Python |
| ------------- | ---------- | -- | ------ |
| evm (EIP-155) | ✅          | ✅  | ✅      |
| svm (Solana)  | ✅          | ✅  | ✅      |

## Mechanisms

| Mechanism            | TypeScript | Go | Python |
| -------------------- | ---------- | -- | ------ |
| exact/evm (EIP-3009) | ✅          | ✅  | ✅      |
| exact/svm (SPL)      | ✅          | ✅  | ✅      |

## Extensions

| Extension | TypeScript | Go | Python |
| --------- | ---------- | -- | ------ |
| bazaar    | ✅          | ✅  | ✅      |

## Client Hooks

| Hook                     | TypeScript | Go | Python |
| ------------------------ | ---------- | -- | ------ |
| onBeforePaymentCreation  | ✅          | ✅  | ✅      |
| onAfterPaymentCreation   | ✅          | ✅  | ✅      |
| onPaymentCreationFailure | ✅          | ✅  | ✅      |
| onPaymentRequired (HTTP) | ✅          | ❌  | ❌      |

## Server Hooks

| Hook                      | TypeScript | Go | Python |
| ------------------------- | ---------- | -- | ------ |
| onBeforeVerify            | ✅          | ✅  | ✅      |
| onAfterVerify             | ✅          | ✅  | ✅      |
| onVerifyFailure           | ✅          | ✅  | ✅      |
| onBeforeSettle            | ✅          | ✅  | ✅      |
| onAfterSettle             | ✅          | ✅  | ✅      |
| onSettleFailure           | ✅          | ✅  | ✅      |
| onProtectedRequest (HTTP) | ✅          | ❌  | ❌      |

## Facilitator Hooks

| Hook            | TypeScript | Go | Python |
| --------------- | ---------- | -- | ------ |
| onBeforeVerify  | ✅          | ✅  | ✅      |
| onAfterVerify   | ✅          | ✅  | ✅      |
| onVerifyFailure | ✅          | ✅  | ✅      |
| onBeforeSettle  | ✅          | ✅  | ✅      |
| onAfterSettle   | ✅          | ✅  | ✅      |
| onSettleFailure | ✅          | ✅  | ✅      |

## Extension Hooks

| Hook                          | TypeScript | Go | Python |
| ----------------------------- | ---------- | -- | ------ |
| enrichDeclaration             | ✅          | ✅  | ✅      |
| enrichPaymentRequiredResponse | ✅          | ❌  | ❌      |
| enrichSettlementResponse      | ✅          | ❌  | ❌      |

## HTTP Server Features

| Feature              | TypeScript | Go | Python |
| -------------------- | ---------- | -- | ------ |
| dynamicPayTo         | ✅          | ✅  | ✅      |
| dynamicPrice         | ✅          | ✅  | ✅      |
| paywall (browser UI) | ✅          | ✅  | ✅      |

