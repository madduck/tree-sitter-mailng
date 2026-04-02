#include "tree_sitter/parser.h"
#include <assert.h>
#include <stdio.h>
#include <wctype.h>

enum TokenType { NEWLINE, HSPACE, LOGICAL_LINEBREAK, ERROR_SENTINEL };

// #define DEBUG 1

#ifdef DEBUG
#define DEBUGPRINT(...) printf(__VA_ARGS__)
#else
#define DEBUGPRINT(...)
#endif

#ifdef DEBUG
#define advance(lexer)                                                         \
  {                                                                            \
    wint_t before = lexer->lookahead;                                          \
    lexer->advance(lexer, false);                                              \
    DEBUGPRINT("advance to col %d, 0x%02x → 0x%02x (line %d)\n",               \
               lexer->get_column(lexer), before, lexer->lookahead, __LINE__);  \
  }
#define mark_end(lexer)                                                        \
  {                                                                            \
    lexer->mark_end(lexer);                                                    \
    DEBUGPRINT("mark end at col %d: '%c' (0x%02x) (line %d)\n",                \
               lexer->get_column(lexer), lexer->lookahead, lexer->lookahead,   \
               __LINE__);                                                      \
  }

static inline void debugprint_scanner_state(TSLexer *lexer,
                                            const bool *valid_symbols) {
  DEBUGPRINT("Scanner called, lookahead: 0x%02x… valid_symbols=",
             lexer->lookahead);
  for (int i = NEWLINE; i <= LOGICAL_LINEBREAK; ++i) {
    DEBUGPRINT("%d", valid_symbols[i]);
  }
  DEBUGPRINT("\n");
}

#else
#define advance(lexer) lexer->advance(lexer, false)
#define mark_end(lexer) lexer->mark_end(lexer)
#define debugprint_scanner_state(...)
#endif

#define ishspace(wc) wc != '\n' && wc != '\r' && iswspace(wc)

static inline unsigned int slurp_up_horizontal_space(TSLexer *lexer) {
  unsigned int wscnt = 0;
  while (ishspace(lexer->lookahead)) {
    // slurp up all whitespace, which includes carriage return (\r)
    advance(lexer);
    ++wscnt;
  }
  if (wscnt > 0) {
    DEBUGPRINT("Slurped %d whitespaces\n", wscnt);
  }
  return wscnt;
}

bool tree_sitter_mail_external_scanner_scan(UNUSED void *payload,
                                            TSLexer *lexer,
                                            const bool *valid_symbols) {
  debugprint_scanner_state(lexer, valid_symbols);

  if (valid_symbols[ERROR_SENTINEL]) {
    return false;
  }

  // we only concern ourselves when there is whitespace ahead, so
  // shortcut:
  if (!iswspace(lexer->lookahead)) {
    return false;
  }

  if (valid_symbols[HSPACE] && slurp_up_horizontal_space(lexer) > 0) {
    DEBUGPRINT("Found horizontal space before '%c' (0x%02x)\n",
               lexer->lookahead, lexer->lookahead);
    lexer->result_symbol = HSPACE;
    return true;
  }

  if (valid_symbols[NEWLINE] || valid_symbols[LOGICAL_LINEBREAK]) {
    mark_end(lexer);
    if (lexer->lookahead == '\r') {
      advance(lexer);
    }
    if (lexer->lookahead != '\n') {
      return false;
    }
    advance(lexer);
    DEBUGPRINT("Found newline, now looking at '%c' (0x%02x)\n",
               lexer->lookahead, lexer->lookahead);

    if (slurp_up_horizontal_space(lexer) > 0 &&
        valid_symbols[LOGICAL_LINEBREAK]) {
      DEBUGPRINT("Found logical-line whitespace\n");
      mark_end(lexer);
      lexer->result_symbol = LOGICAL_LINEBREAK;
      return true;
    }

    if (valid_symbols[NEWLINE]) {
      DEBUGPRINT("Found just newline\n");
      mark_end(lexer);
      lexer->result_symbol = NEWLINE;
      return true;
    }
  }

  return false;
}

// The remaining functions must be defined, but they are not used:

// No state required, so nothing needs to be allocated, …
void *tree_sitter_mail_external_scanner_create() { return NULL; }

// … and hence nothing destroyed, …
void tree_sitter_mail_external_scanner_destroy(UNUSED void *payload) { return; }

// … and nothing serialized, …
unsigned tree_sitter_mail_external_scanner_serialize(UNUSED void *payload,
                                                     UNUSED char *buffer) {
  return 0;
}

// … or loaded.
void tree_sitter_mail_external_scanner_deserialize(UNUSED void *payload,
                                                   UNUSED const char *buffer,
                                                   UNUSED unsigned length) {
  return;
}
