import XCTest
import SwiftTreeSitter
import TreeSitterMailNG

final class TreeSitterMailNGTests: XCTestCase {
  func testCanLoadGrammar() throws {
    let parser = Parser()
    parser.setLanguage(MailLanguage.language())
  }
}
