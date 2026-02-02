// swift-tools-version:5.9

import PackageDescription

let package = Package(
    name: "CryptoNewsExamples",
    platforms: [
        .macOS(.v12),
        .iOS(.v15),
        .watchOS(.v8),
        .tvOS(.v15)
    ],
    products: [
        .executable(name: "CryptoNews", targets: ["CryptoNews"]),
    ],
    targets: [
        .executableTarget(
            name: "CryptoNews",
            path: ".",
            sources: ["CryptoNews.swift"]
        ),
    ]
)
