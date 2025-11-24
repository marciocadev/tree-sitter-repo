import XCTest
import SwiftTreeSitter
import TreeSitterWing

final class TreeSitterWingTests: XCTestCase {
    func testCanLoadGrammar() throws {
        let parser = Parser()
        let language = Language(language: tree_sitter_wing())
        XCTAssertNoThrow(try parser.setLanguage(language),
                         "Error loading Wing grammar")
    }
}
