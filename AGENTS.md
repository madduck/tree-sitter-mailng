# tree-sitter-mailng

Guidance for coding agents working in this repository. Read this together with
the user-level `AGENTS.md`, which takes precedence where the two overlap.

## Product

A [Tree-sitter](https://tree-sitter.github.io/) grammar for
[RFC5322](https://www.rfc-editor.org/info/rfc5322/) messages, commonly known as
"Emails", but at the "drafting" phase in their life-cycle, i.e. when an editor
with Tree-sitter is being used to compose an email message. Deviations from the
standard will be individually catalogued.

## Quality Gates

`tree-sitter-cli test` must pass without errors for any commit.

## Testing conventions

Any change REQUIRES first the tests to be written, i.e. follow red-green
development STRICTLY.

## Workflow

Each task goes on a **separate feature branch** `feature/<short name>` created
from `main`.

When subsequently bugs are fixed or a feature is enhanced, suggest to put them
on the appropriate branch, but get confirmation first.
