// swift-tools-version:5.9

import PackageDescription

let package = Package(
    name: "TreeSitterMailNG",
    products: [
        .library(name: "TreeSitterMailNG", targets: ["TreeSitterMailNG"]),
    ],
    dependencies: [
        .package(
            url: "https://github.com/tree-sitter/swift-tree-sitter",
            from: "0.25.0"
        ),
    ],
    targets: [
        .target(
            name: "TreeSitterMailNG",
            dependencies: [
                .product(name: "SwiftTreeSitter", package: "swift-tree-sitter"),
            ],
            path: "bindings/swift/TreeSitterMailNG",
            sources: ["TreeSitterMailNG.swift"],
            publicHeadersPath: ".",
            cSettings: [
                .headerSearchPath("../../src"),
            ]
        ),
        .testTarget(
            name: "TreeSitterMailNGTests",
            dependencies: ["TreeSitterMailNG"],
            path: "bindings/swift/TreeSitterMailNGTests"
        ),
    ],
    cLanguageStandard: .c11
)
