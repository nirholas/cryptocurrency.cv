import CryptoNews
import Foundation

@main
struct Example {
    static func main() async throws {
        let client = CryptoNewsClient()

        print("=== Latest Crypto News ===")
        let articles = try await client.getLatest(limit: 5)
        articles.forEach { print($0) }

        print("\n=== Bitcoin News ===")
        let btc = try await client.getBitcoin(limit: 3)
        btc.forEach { print($0) }

        print("\n=== Search: ethereum ===")
        let results = try await client.search("ethereum", limit: 3)
        results.forEach { print($0) }
    }
}
