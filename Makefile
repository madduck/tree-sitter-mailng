# Convenience targets. All of them rely on the project-local tree-sitter
# CLI, which direnv puts on PATH via `.envrc`.

TREE_SITTER ?= tree-sitter

.PHONY: all generate build test test-queries test-language-name clean

all: generate build test

# Generate the parser from grammar.js into src/.
generate:
	$(TREE_SITTER) generate

# Compile the parser into a dynamic library.
build: generate
	$(TREE_SITTER) build

# Run the corpus tests and the language-name test.
test: generate test-language-name
	$(TREE_SITTER) test

# Assert that the language/parser name is "mail".
test-language-name:
	sh test/language-name.sh

# Run the query tests.
test-queries:
	sh test/query/run.sh queries/mail/highlights.scm

clean:
	rm -rf build
	rm -f log.html
