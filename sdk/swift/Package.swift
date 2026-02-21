// swift-tools-version: 5.7
import PackageDescription

let package = Package(
    name: "CryptoNews",
    platforms: [
        .macOS(.v12),
        .iOS(.v15),
        .watchOS(.v8),
        .tvOS(.v15),
    ],
    products: [
        .library(name: "CryptoNews", targets: ["CryptoNews"]),
    ],
    targets: [
        .target(name: "CryptoNews", path: "Sources/CryptoNews"),
        .executableTarget(name: "CryptoNewsExample", dependencies: ["CryptoNews"], path: "Sources/Example"),
        .testTarget(name: "CryptoNewsTests", dependencies: ["CryptoNews"], path: "Tests/CryptoNewsTests"),
    ]
)
