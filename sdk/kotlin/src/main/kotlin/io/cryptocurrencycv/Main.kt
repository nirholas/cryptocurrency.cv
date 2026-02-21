package io.cryptocurrencycv

fun main() {
    val client = CryptoNews()

    println("=== Latest Crypto News ===")
    client.getLatest(5).forEach(::println)

    println("\n=== Bitcoin News ===")
    client.getBitcoin(3).forEach(::println)

    println("\n=== Search: ethereum ===")
    client.search("ethereum", 3).forEach(::println)
}
