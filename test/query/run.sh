#!/bin/sh
# Run the query tests.
#
# For each case in test/query/cases, run the query against the fixture and
# compare the list of captures, as "name row column", against the expected
# file. Run this script from the repository root.

set -eu

TREE_SITTER=${TREE_SITTER:-tree-sitter}
QUERY=${1:-queries/mail/highlights.scm}
CASES=test/query/cases
BAIL=0

LIB=$(mktemp)
trap 'rm -f "$LIB"' EXIT
"$TREE_SITTER" build -o "$LIB" . >/dev/null

for fixture in "$CASES"/*.mail; do
  case_name=$(basename "$fixture" .mail)
  expected="$CASES/$case_name.expected"
  [ -f "$expected" ] || continue

  actual=$(mktemp)
  "$TREE_SITTER" query --lib-path "$LIB" --lang-name mail -c \
    "$QUERY" "$fixture" 2>/dev/null |
    sed -n 's/.*capture: [0-9]* - \([^,]*\), start: (\([0-9]*\), \([0-9]*\)).*/\1\t\2\t\3/p' |
    sort > "$actual"

  sort "$expected" > "$actual.expected"

  if diff -u "$actual.expected" "$actual" > "$actual.diff"; then
    echo "ok   $case_name"
  else
    echo "FAIL $case_name"
    cat "$actual.diff"
    BAIL=1
  fi

  rm -f "$actual" "$actual.expected" "$actual.diff"
done

exit "$BAIL"
