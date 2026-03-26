/**
 * @file A parser for RFC5322 email messages
 * @author martin f. krafft <tree-sitter-mailng@pobox.madduck.net>
 * @license MIT
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

export default grammar({
  name: "mail",

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
            optional($._body)
          )
        )
      ),

    /** HEADERS ******************************************************** {{{ */

    // Headers is a collection of one or more _header instances, each followed
    // by an actual newline
    headers: $ => repeat1(seq($.header, $._newline)),

    // Each header occupies a (logical) line by itself.
    // We differentiate between the different headers here mostly for enabling
    // queries later e.g. for syntax highlighting:
    header: $ => choice(
      $.header_date,
      $.header_from,
      $.header_replyto,
      $.header_rcpt,
      $.header_subject,
      $.header_msgid,
      $.header_references,
      $.header_inreplyto,
      $.header_other
    ),

    // Each header consists of a label, followed by a colon, and optional whitespace:
    _header_separator: $ => seq(":", repeat($._hspace)),

    _word: _$ => /\S+/,
    _word_no_doublequotes: _$ => /[^"\s]+/,
    _alnum_word: _$ => /\w+/,

    // Header contents can flow to the next line if such starts with whitespace, which
    // the standard calls "Folding"
    _header_contents_whitespace: $ => prec.right(choice(
      $._hspace,
      seq(optional($._hspace), $._logical_linebreak)
    )),
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

    _csp_name: _$ => /[-\w]+/,
    name: $ =>
      // $.name is included in conflicts above such that TS can resolve the
      // ambiguity that arises when $.name is followed by $.whitespace.
      seq(
        $._csp_name,
        repeat(
          seq(
            $._header_contents_whitespace,
            $._csp_name
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
      // A correspondent *can* also just be a name, e.g. an alias for mutt,
      // or a local user:
      $.name,
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
    group: $ => seq(
      $._alnum_word,
      ":",
      optional($._header_contents_whitespace),
      optional($._one_or_more_correspondents),
      optional($._header_contents_whitespace),
      ";"
    ),
    _correspondents: $ => choice(
      $.group,
      $._one_or_more_correspondents
    ),

    /** }}} */

    /** HEADER FIELDS WITH CORRESPONDENTS ****************************** {{{ */

    // The From and Reply-To headers, only special as we might want to syntax highlight it
    header_from: $ => seq(
      alias(token(prec(1, /[Ff][Rr][Oo][Mm]/)), $.label_from),
      $._header_separator,
      optional(alias($._correspondents, $.senders))
    ),
    // … and the other recipient headers
    header_rcpt: $ => seq(
      alias(token(prec(1, /[Tt][Oo]|[Cc]{2}|[Bb][Cc]{2}/)), $.label_rcpt),
      $._header_separator,
      optional(alias($._correspondents, $.recipients))
    ),
    header_replyto: $ => seq(
      alias(token(prec(1, /[Rr][Ee][Pp][Ll][Yy]-[Tt][Oo]/)), $.label_replyto),
      $._header_separator,
      optional(alias($._correspondents, $.replytos))
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
    header_date: $ => seq(
      alias(token(prec(1, /[Dd][Aa][Tt][Ee]/)), $.label_date),
      $._header_separator,
      $.date
    ),

    /* }}} */

    /** HEADER FIELDS WITH MSGIDS ************************************** {{{ */

    msgid: $ => seq("<", alias($.email_address, 'msgid'), ">"),
    header_msgid: $ => seq(
      alias(token(prec(1, /[Mm][Ee][Ss][Ss][Aa][Gg][Ee]-[Ii][Dd]/)), $.label_msgid),
      $._header_separator,
      $.msgid
    ),

    _one_or_more_msgids: $ => seq($.msgid, repeat(seq($._header_contents_whitespace, $.msgid))),

    header_references: $ => seq(
      alias(token(prec(1, /[Rr][Ee][Ff][Ee][Rr][Ee][Nn][Cc][Ee][Ss]/)), $.label_references),
      $._header_separator,
      $._one_or_more_msgids
    ),

    header_inreplyto: $ => seq(
      alias(token(prec(1, /[Ii][Nn]-[Rr][Ee][Pp][Ll][Yy]-[Tt][Oo]/)), $.label_inreplyto),
      $._header_separator,
      $._one_or_more_msgids
    ),

    /* }}} */

    /** SUBJECT AND OTHER HEADER FIELDS ******************************** {{{ */

    header_subject: $ => seq(
      alias(token(prec(1, /[Ss][Uu][Bb][Jj][Ee][Cc][Tt]/)), $.label_subject),
      $._header_separator,
      alias($.multiline_contents, $.subject)
    ),

    header_other: $ => seq(
      alias(/[-\w]+/, $.label_other),
      $._header_separator,
      alias($.multiline_contents, $.contents)
    ),

    /* }}} */

    /** END HEADERS ***************************************************** }}}*/

    /** BODY *********************************************************** {{{ */

    _block: $ => seq(/.*/, $._newline),
    body: $ => repeat1($._block),

    // The body is a collection of blocks and could be empty, with an optional
    // signature following the conventional delimiter "-- "
    signature_separator: _$ => token(prec(2, /-- \r?\n/)),

    _body: $ => choice(
      seq(
        $.body,
        optional(
          seq(
            $.signature_separator,
            alias($.body, $.signature)
          )
        )
      ),
      seq(
        seq(
          $.signature_separator,
          alias($.body, $.signature)
        )
      )
    ),

    /* END BODY }}} */
  },

  // extras doesn't default to nothing, so needs to be explicitly disabled
  extras: _$ => [],
  supertypes: $ => [$.header],
  externals: $ => [
    $._newline,
    $._hspace,
    $._logical_linebreak,
  ],
  conflicts: $ => [[$.name], [$.correspondent]]
});

// vim:fdm=marker:fdl=0
