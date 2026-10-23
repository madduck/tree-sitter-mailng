import CTreeSitterMailNG
import SwiftTreeSitter
import TreeSitter

public enum MailNGLanguage {
  /// The Tree-sitter language for Mail NG.
  public static func language() -> Language {
    return Language(language: tree_sitter_mailng())
  }
}
