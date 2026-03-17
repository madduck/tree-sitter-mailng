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
      // An RFC5322 message is a set of headers, optionally followed by a body.
      // If there is a body, it is identified with an empty line following the headers.
      seq(
        $.headers,
        optional(
          seq(
            $.body_separator,
            optional($.body)
          )
        )
      ),

    _ws_no_nl: _$ => /[ \t]+/,

    // Headers is a collection of one or more _header instances
    headers: $ => repeat1($._header),

    // The body separator is just an empty line. Depending on the
    // file format, this could include a line-feed or not
    body_separator: _$ => /\r?\n/,

    // The body is a collection of blocks and could be empty
    body: $ => repeat1($._block),
    _block: _$ => /.+\r?\n/,

    // Each header occupies a (logical) line by itself, hence the final newline.
    // We differentiate between the different headers here mostly for enabling
    // queries later e.g. for syntax highlighting:
    _header: $ => seq(
      choice(
        $.header_date,
        $.header_from,
        $.header_email,
        $.header_subject,
        $.header_other
      ), /\r?\n/
    ),

    // Each header consists of a label, followed by a colon, and optional whitespace:
    _header_label: _$ => /[-\w]+/,
    _header_separator: _$ => /:[ \t]*/,

    // TODO:this needs to be fleshed out, postponing for now as this is going to be hard.
    correspondent: _$ => token(/[a-z]+/),

    // The From header just has one correspondent (TODO: could actually have more, and should be fused)
    header_from: $ => seq("From", $._header_separator, $.correspondent),

    // The date header uses a standard RFC5322 format
    _date_dow: _$ => /(Mon|Tue|Wed|Thu|Fri|Sat|Sun)/,
    _date_day: _$ => /\d{1,2}/,
    _date_month: _$ => /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/,
    _date_year: _$ => /\d{4}/,
    _date_time: _$ => /\d{2}:\d{2}:\d{2}/,
    _date_tzoffset: _$ => /[-+]\d{4}/,
    date: $ => seq(
      $._date_dow, ",", repeat1($._ws_no_nl),
      $._date_day, repeat1($._ws_no_nl),
      $._date_month, repeat1($._ws_no_nl),
      $._date_year, repeat1($._ws_no_nl),
      $._date_time, repeat1($._ws_no_nl),
      choice("GMT", $._date_tzoffset)
    ),
    header_date: $ => seq("Date", $._header_separator, $.date),

    // Other email headers take multiple correspondents. For now, lines can split only
    // after the comma used to separate multiple correspondents. TODO: lines can break elsewhere too…
    _comma_continued: _$ => /,[ \t]*(?:\r?\n[ \t]+)?/,
    header_email: $ => seq(
      choice('To', 'Cc', 'Bcc', 'Reply-To'),
      $._header_separator,
      seq($.correspondent, repeat(seq($._comma_continued, optional($.correspondent))))
    ),

    // Other header contents can flow to the next line if such starts with whitespace
    multiline_contents: _$ => /.+(\r?\n[ \t]+.+)*/,

    header_subject: $ => seq("Subject", $._header_separator, alias($.multiline_contents, $.subject)),
    header_other: $ => seq($._header_label, $._header_separator, alias($.multiline_contents, $.contents)),
  }
});
