package tree_sitter_mailng_test

import (
	"testing"

	tree_sitter "github.com/tree-sitter/go-tree-sitter"
	tree_sitter_mailng "github.com/madduck/tree-sitter-mailng/bindings/go"
)

func TestCanLoadGrammar(t *testing.T) {
	language := tree_sitter.NewLanguage(tree_sitter_mailng.Language())
	if language == nil {
		t.Errorf("Error loading Mail NG grammar")
	}
}
