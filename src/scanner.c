#include "tree_sitter/parser.h"
#include <assert.h>
#include <stdio.h>
#include <wctype.h>

#define DEBUGPRINT(...) // printf(__VA_ARGS__)

enum TokenType { NEWLINE, WHITESPACE, LOGICAL_LINE_WHITESPACE };

static inline void advance(TSLexer *lexer) { lexer->advance(lexer, false); }
static inline void mark_end(TSLexer *lexer) { lexer->mark_end(lexer); }

static inline bool iswspace_but_not_newline(wint_t wc) {
  return iswspace(wc) && wc != '\n';
}

static inline bool at_newline_with_optional_linefeed(TSLexer *lexer) {
  if (lexer->lookahead == '\r') {
    mark_end(lexer);
    advance(lexer);
  }
  if (lexer->lookahead == '\n') {
    mark_end(lexer);
    return true;
  }
  return false;
}

bool tree_sitter_mail_external_scanner_scan(void *payload, TSLexer *lexer,
                                            const bool *valid_symbols) {
  if (!iswspace(lexer->lookahead)) {
    return false;
  }

  DEBUGPRINT("Lookahead now '%c' (%02x)…\n", lexer->lookahead,
             lexer->lookahead);
  DEBUGPRINT("Valid symbols: %c%c%c\n", valid_symbols[NEWLINE] ? '+' : '-',
             valid_symbols[WHITESPACE] ? '+' : '-',
             valid_symbols[LOGICAL_LINE_WHITESPACE] ? '+' : '-');

  unsigned int wscnt = 0;
  if (valid_symbols[WHITESPACE] || valid_symbols[LOGICAL_LINE_WHITESPACE]) {
    while (iswspace_but_not_newline(lexer->lookahead)) {
      // slurp up all trailing whitespace, which includes linefeeds (\r)
      advance(lexer);
      ++wscnt;
    }
  }

  if (valid_symbols[NEWLINE] || valid_symbols[WHITESPACE] ||
      valid_symbols[LOGICAL_LINE_WHITESPACE]) {

    if (valid_symbols[WHITESPACE] && !iswspace(lexer->lookahead)) {
      DEBUGPRINT(
          "Found just whitespace (len=%d) before '%c' (%02x, column %d)\n",
          wscnt, lexer->lookahead, lexer->lookahead, lexer->get_column(lexer));
      lexer->result_symbol = WHITESPACE;
      return true;
    }

    // assert(lexer->lookahead == '\n');

    if (valid_symbols[NEWLINE] || valid_symbols[LOGICAL_LINE_WHITESPACE]) {

      advance(lexer);

      DEBUGPRINT("Post-newline: %02x, '%c', column %d\n", lexer->lookahead,
                 lexer->lookahead, lexer->get_column(lexer));

      if (valid_symbols[NEWLINE] || valid_symbols[LOGICAL_LINE_WHITESPACE]) {
        if (!iswspace_but_not_newline(lexer->lookahead)) {

          DEBUGPRINT("Found single newline\n");
          mark_end(lexer);
          lexer->result_symbol = NEWLINE;
          return true;
        }

        do {
          DEBUGPRINT("Slurping '%c'…\n", lexer->lookahead);
          advance(lexer);
        } while (iswspace_but_not_newline(lexer->lookahead));

        DEBUGPRINT("Lookahead now '%c' (%02x)…\n", lexer->lookahead,
                   lexer->lookahead);
        DEBUGPRINT("Found logical-line whitespace\n");
        mark_end(lexer);
        lexer->result_symbol = LOGICAL_LINE_WHITESPACE;
        return true;
      }
    }
  }
  return false;
}

// The remaining functions must be defined, but they are not used:

// No state required, so nothing needs to be allocated, …
void *tree_sitter_mail_external_scanner_create() { return NULL; }

// … and hence nothing destroyed, …
void tree_sitter_mail_external_scanner_destroy(void *payload) { return; }

// … and nothing serialized, …
unsigned tree_sitter_mail_external_scanner_serialize(void *payload,
                                                     char *buffer) {
  return 0;
}

// … or loaded.
void tree_sitter_mail_external_scanner_deserialize(void *payload,
                                                   const char *buffer,
                                                   unsigned length) {
  return;
}
