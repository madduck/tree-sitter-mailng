# Convenience targets. All of them rely on the project-local tree-sitter
# CLI, which direnv puts on PATH via `.envrc`.

TREE_SITTER ?= tree-sitter

.PHONY: all generate build test test-queries clean

all: generate build test

# Generate the parser from grammar.js into src/.
generate:
	$(TREE_SITTER) generate

# Compile the parser into a dynamic library.
build: generate
	$(TREE_SITTER) build

# Run the corpus tests.
test: generate
	$(TREE_SITTER) test

# Run the query tests.
test-queries:
	sh test/query/run.sh queries/mail/highlights.scm

clean:
	rm -rf build
	rm -f log.html
