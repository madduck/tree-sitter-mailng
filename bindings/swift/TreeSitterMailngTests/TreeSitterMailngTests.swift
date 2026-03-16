import XCTest
import SwiftTreeSitter
import TreeSitterMailng

final class TreeSitterMailngTests: XCTestCase {
    func testCanLoadGrammar() throws {
        let parser = Parser()
        let language = Language(language: tree_sitter_mailng())
        XCTAssertNoThrow(try parser.setLanguage(language),
                         "Error loading Mail NG grammar")
    }
}
