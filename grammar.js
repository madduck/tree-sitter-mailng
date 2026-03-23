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
  externals: $ => [
    $._newline,
    $._whitespace_except_newline,
    $._logical_linebreak,
  ],
  conflicts: $ => [[$.name]],

  rules: {
    rfc5322_message: $ =>
      // An RFC5322 message is a set of headers, optionally followed by a body.
      // If there is a body, it is identified with an empty line following the headers.
      seq(
        $.headers,
        optional(
          seq(
            // The body separator is just an empty line. Depending on the
            // file format, this could include a line-feed or not
            alias($._newline, $.body_separator),
            optional($.body)
          )
        )
      ),

    /** HEADERS ******************************************************** {{{ */

    // Headers is a collection of one or more _header instances
    headers: $ => repeat1($._header),

    // Each header occupies a (logical) line by itself, hence the final newline.
    // We differentiate between the different headers here mostly for enabling
    // queries later e.g. for syntax highlighting:
    _header: $ => seq(
      choice(
        $.header_date,
        $.header_from,
        $.header_email,
        $.header_subject,
        $.header_msgid,
        $.header_references,
        $.header_inreplyto,
        $.header_other
      ), $._newline
    ),

    // Each header consists of a label, followed by a colon, and optional whitespace:
    _header_separator: $ => seq(":", optional($._whitespace_except_newline)),

    _word: _$ => /\S+/,
    _word_no_doublequotes: _$ => /[^"\s]+/,
    _alnum_word: _$ => /\w+/,

    // Header contents can flow to the next line if such starts with whitespace, which
    // the standard calls "Folding"
    _header_contents_whitespace: $ => choice($._whitespace_except_newline, $._logical_linebreak),
    multiline_contents: $ => seq($._word, repeat(seq($._header_contents_whitespace, $._word))),

    /* Note: case-insensitive matching in the header field labels requires
     * regexs that have capital and lower-case as options for each character.
     * Thus, it is necessary to wrap these with token(prec(1, …)) to give
     * lexical preference to those over other, more generic regexps, such as
     * the one for all the other header labels further down.
     *
     * We don't *need* this here since the other header
     * labels regexp is defined later (thus gets lower lexical precedence), but
     * it's good practice to make this explicit.
     */

    /** CORRESPONDENTS ************************************************* {{{ */

    // Regex from https://stackoverflow.com/a/26989421
    email_address: _$ => /((([\t ]*\r\n)?[\t ]+)?[-!#-'*+/-9=?A-Z^-~]+(\.[-!#-'*+/-9=?A-Z^-~]+)*(([\t ]*\r\n)?[\t ]+)?|(([\t ]*\r\n)?[\t ]+)?"(((([\t ]*\r\n)?[\t ]+)?([]!#-[^-~]|(\\[\t -~])))+(([\t ]*\r\n)?[\t ]+)?|(([\t ]*\r\n)?[\t ]+)?)"(([\t ]*\r\n)?[\t ]+)?)@((([\t ]*\r\n)?[\t ]+)?[-!#-'*+/-9=?A-Z^-~]+(\.[-!#-'*+/-9=?A-Z^-~]+)*(([\t ]*\r\n)?[\t ]+)?|(([\t ]*\r\n)?[\t ]+)?\[((([\t ]*\r\n)?[\t ]+)?[!-Z^-~])*(([\t ]*\r\n)?[\t ]+)?](([\t ]*\r\n)?[\t ]+)?)/,
    _br_email_address: $ => seq(
      "<", $.email_address, ">"
    ),

    name: $ =>
      // $.name is included in conflicts above such that TS can resolve the
      // ambiguity that arises when $.name is followed by $.whitespace.
      seq(
        $._alnum_word,
        repeat(
          seq(
            $._header_contents_whitespace,
            $._alnum_word
          )
        )
      ),
    quoted_name: $ =>
      // prec.right not needed here due to the final quote
      seq(
        '"',
        $._word_no_doublequotes,
        repeat(
          seq(
            $._header_contents_whitespace,
            $._word_no_doublequotes
          )
        ),
        '"'
      ),

    correspondent: $ => choice(
      $.email_address,
      seq(
        // This is implemented by making the name part optional:
        optional(
          seq(
            choice(
              // a name (whitespace-separated words),
              $.name,
              // or a quoted name (whitespace-separated words within "")
              $.quoted_name
            ),
            // and some whitespace …
            $._header_contents_whitespace
          )
          // note about whitespace: I need this as a token
          // because of logical line continuations, so please don't
          // suggest that I just match the entirety of the name with
          // a single regex.
        ),
        // … before the email address in angle brackets:
        $._br_email_address
      ),
    ),

    _comma_separator: $ => prec.right(
      seq(
        optional($._header_contents_whitespace),
        ",",
        optional($._header_contents_whitespace))
    ),
    _one_or_more_correspondents: $ => prec.left(
      seq(
        $.correspondent,
        repeat(seq(
          $._comma_separator,
          optional($.correspondent)
        ))
      )
    ),

    /** }}} */

    /** HEADER FIELDS WITH CORRESPONDENTS ****************************** {{{ */

    // The From and Reply-To headers, only special as we might want to syntax highlight it
    header_from: $ => seq(token(prec(1, /[Ff][Rr][Oo][Mm]/)), $._header_separator,
      alias($._one_or_more_correspondents, $.senders)
    ),
    // … and the other recipient headers
    header_email: $ => seq(token(prec(1, /[Tt][Oo]|[Cc]{2}|[Bb][Cc]{2}/)), $._header_separator,
      alias($._one_or_more_correspondents, $.recipients)
    ),
    header_replyto: $ => seq(token(prec(1, /[Rr][Ee][Pp][Ll][Yy]-[Tt][Oo]/)), $._header_separator,
      alias($._one_or_more_correspondents, $.replytos)
    ),

    /** }}} */

    /** DATE HEADER FIELD ********************************************** {{{ */

    // The date header uses a standard RFC5322 format
    _date_dow: _$ => /(Mon|Tue|Wed|Thu|Fri|Sat|Sun)/,
    _date_day: _$ => /\d{1,2}/,
    _date_month: _$ => /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/,
    _date_year: _$ => /\d{4}/,
    _date_time: _$ => /\d{2}:\d{2}:\d{2}/,
    _date_tzoffset: _$ => /[-+]\d{4}/,
    date: $ => seq(
      $._date_dow, ",", $._header_contents_whitespace,
      $._date_day, $._header_contents_whitespace,
      $._date_month, $._header_contents_whitespace,
      $._date_year, $._header_contents_whitespace,
      $._date_time, $._header_contents_whitespace,
      choice("GMT", $._date_tzoffset)
    ),
    header_date: $ => seq(token(prec(1, /[Dd][Aa][Tt][Ee]/)), $._header_separator, $.date),

    /* }}} */

    /** HEADER FIELDS WITH MSGIDS ************************************** {{{ */

    msgid: $ => seq("<", alias($.email_address, 'msgid'), ">"),
    header_msgid: $ => seq(token(prec(1, /[Mm][Ee][Ss][Ss][Aa][Gg][Ee]-[Ii][Dd]/)), $._header_separator,
      $.msgid
    ),

    _one_or_more_msgids: $ => seq($.msgid, repeat(seq($._header_contents_whitespace, $.msgid))),

    header_references: $ => seq(token(prec(1, /[Rr][Ee][Ff][Ee][Rr][Ee][Nn][Cc][Ee][Ss]/)), $._header_separator,
      $._one_or_more_msgids
    ),

    header_inreplyto: $ => seq(token(prec(1, /[Ii][Nn]-[Rr][Ee][Pp][Ll][Yy]-[Tt][Oo]/)), $._header_separator,
      $._one_or_more_msgids
    ),

    /* }}} */

    /** SUBJECT AND OTHER HEADER FIELDS ******************************** {{{ */

    header_subject: $ => seq(token(prec(1, /[Ss][Uu][Bb][Jj][Ee][Cc][Tt]/)), $._header_separator,
      alias($.multiline_contents, $.subject)
    ),

    header_other: $ => seq(/[-\w]+/, $._header_separator,
      alias($.multiline_contents, $.contents)
    ),

    /* }}} */

    /** END HEADERS ***************************************************** }}}*/

    body: $ => repeat1($._block),
    _block: $ => seq(/.+/, $._newline),
  }
});

// vim:fdm=marker
