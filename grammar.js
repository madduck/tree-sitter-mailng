/**
 * @file A parser for RFC5322 email messages
 * @author martin f. krafft <tree-sitter-mailng@pobox.madduck.net>
 * @license MIT
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

const NEWLINE = /\r?\n/;
const WS_NO_NL = /[ \t]/;
const HEADER_FIELD_SEP = new RegExp(":" + WS_NO_NL.source + "*");
const NEWLINE_CONTINUED = new RegExp("(?:" + NEWLINE.source + "[ \t]+)*");
const MULTILINE_HEADER = new RegExp("(?:.*|.+" + NEWLINE_CONTINUED.source + ".+)");

function separated_list(item, sep = /,/) {
  return seq(item, repeat(seq(sep, item)))
}

function header(label, contents) {
  return seq(
    label,
    HEADER_FIELD_SEP,
    contents,
  )
}

export default grammar({
  name: "mail",

  // extras: (_$) => [' '],
  // externals: $ => [$.indent, $.dedent, $.newline],

  rules: {
    rfc5322_message: $ =>
      seq(
        $.headers,
        optional(
          seq(
            $.body_separator,
            $.body
          )
        )
      ),

    headers: $ => repeat1($._header),
    body_separator: _$ => NEWLINE,
    body: $ => repeat1($.block),
    block: _$ => /.+/,

    _header: $ => seq(
      choice(
        $.header_from,
        $.header_email,
        $.header_subject,
        $.header_other
      ), NEWLINE
    ),

    correspondent: _$ => token(/[a-z]+/),

    _fieldname_from: _$ => 'From',
    header_from: $ => header($._fieldname_from, $.correspondent),

    _fieldname_email: _$ => choice('To', 'Cc', 'Bcc', 'Reply-To'),
    header_email: $ => header(
      $._fieldname_email,
      separated_list(
        $.correspondent,
        new RegExp("," + WS_NO_NL.source + "*" + NEWLINE_CONTINUED.source)
      )
    ),

    multiline_contents: _$ => token(MULTILINE_HEADER),

    _fieldname_subject: _$ => "Subject",
    header_subject: $ => header(
      $._fieldname_subject,
      alias($.multiline_contents, $.subject)
    ),
    // subject: _$ => token(MULTILINE_HEADER),

    _fieldname_other: _$ => token(/[-\w]+/),
    header_other: $ => header(
      $._fieldname_other,
      alias($.multiline_contents, $.contents)
    ),
    // other_contents: _$ => token(MULTILINE_HEADER),

  }
});
