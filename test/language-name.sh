#!/bin/sh
# Assert that the language/parser name is "mail".
#
# Consumers (Neovim via nvim-treesitter, the Go/Rust/Python/Swift/Node
# bindings, and the tree-sitter CLI) locate the parser by its language
# name. That name must be "mail", not "mailng". This test checks every
# place the name is observable, so a partial rename fails.
#
# Run this script from the repository root.

set -eu

fail=0

check() {
  file=$1
  pattern=$2
  if grep -q "$pattern" "$file"; then
    echo "ok   $file contains: $pattern"
  else
    echo "FAIL $file does not contain: $pattern"
    fail=1
  fi
}

reject() {
  file=$1
  pattern=$2
  if grep -q "$pattern" "$file"; then
    echo "FAIL $file still contains: $pattern"
    fail=1
  else
    echo "ok   $file free of: $pattern"
  fi
}

# The grammar defines the language name.
check grammar.js "name: 'mail'"

# The generated parser exposes the name and the entry symbol.
check src/grammar.json '"name": "mail"'
check src/parser.c "tree_sitter_mail(void)"
check src/parser.c '.name = "mail",'

# The grammar metadata drives the tree-sitter CLI and nvim-treesitter.
check tree-sitter.json '"name": "mail"'
check tree-sitter.json '"camelcase": "Mail"'
check tree-sitter.json '"injection-regex": "\^mail\$"'

# The language-specific bindings call the entry symbol by name.
check bindings/c/tree-sitter-mail.h "tree_sitter_mail(void)"
check bindings/go/binding.go "C.tree_sitter_mail()"
check bindings/rust/lib.rs "tree_sitter_mail()"
check bindings/python/tree_sitter_mailng/binding.c "tree_sitter_mail(void)"
check bindings/node/binding.cc "tree_sitter_mail()"

# No stale references to the old language name remain. The project keeps
# its own name "tree-sitter-mailng", so only the language identifier must
# be free of the old name.
reject grammar.js "'mailng'"
reject tree-sitter.json '"name": "mailng"'
reject tree-sitter.json '"camelcase": "MailNG"'
reject tree-sitter.json '"scope": "source.mailng"'
reject src/grammar.json "mailng"
reject src/parser.c "mailng"

exit "$fail"
