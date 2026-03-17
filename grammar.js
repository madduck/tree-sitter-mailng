/**
 * @file A parser for RFC5322 email messages
 * @author martin f. krafft <tree-sitter-mailng@pobox.madduck.net>
 * @license MIT
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

export default grammar({
  name: "mail",

  // extras doesn't default to nothing, so needs to be explicitly disabled
  extras: _$ => [],

  rules: {
    rfc5322_message: $ =>
      seq(
        $.headers,
        optional(
          seq(
            $.body_separator,
            optional($.body)
          )
        )
      ),

    headers: $ => repeat1($._header),
    body_separator: _$ => /\r?\n/,
    body: $ => repeat1($._block),
    _block: _$ => /.+\r?\n/,

    _header: $ => seq(
      choice(
        $.header_from,
        $.header_email,
        $.header_subject,
        $.header_other
      ), /\r?\n/
    ),

    correspondent: _$ => token(/[a-z]+/),
    _header_label: _$ => /[-\w]+/,
    _header_separator: _$ => /:[ \t]*/,


    ),

    multiline_contents: _$ => /.+(\r?\n[ \t]+.+)*/,

    header_from: $ => seq("From", $._header_separator, $.correspondent),

    _comma_continued: _$ => /,[ \t]*(?:\r?\n[ \t]+)?/,
    header_email: $ => seq(
      choice('To', 'Cc', 'Bcc', 'Reply-To'),
      $._header_separator,
      seq($.correspondent, repeat(seq($._comma_continued, optional($.correspondent))))
    ),

    header_subject: $ => seq("Subject", $._header_separator, alias($.multiline_contents, $.subject)),
    header_other: $ => seq($._header_label, $._header_separator, alias($.multiline_contents, $.contents)),
  }
});
