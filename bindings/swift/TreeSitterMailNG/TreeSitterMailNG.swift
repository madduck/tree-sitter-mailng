import CTreeSitterMailNG
import SwiftTreeSitter
import TreeSitter

public enum MailLanguage {
  /// The Tree-sitter language for Mail.
  public static func language() -> Language {
    return Language(language: tree_sitter_mail())
  }
}
