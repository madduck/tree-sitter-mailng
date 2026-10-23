/**
 * @file Tree-sitter grammar for RFC5322 messages ("e-mails") being drafted,
 * i.e. as produced by an editor while composing a message.
 * @license MIT
 * @author martin f. krafft <tree-sitter-mailng@pobox.madduck.net>
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

/**
 * Match a header field name case-insensitively.
 *
 * @param {string} name - The canonical (lower-case) field name.
 * @returns {RegExp} A pattern anchored at the current position.
 */
function fieldName(name) {
  return new RegExp(
    name
      .split('')
      .map((c) => (/[a-z]/.test(c) ? `[${c}${c.toUpperCase()}]` : `\\${c}`))
      .join(''),
  );
}

/**
 * A line break, optionally preceded by a carriage return.
 */
const CRLF = /\r?\n/;

/**
 * Horizontal white space, i.e. spaces and tabs.
 */
const HS = /[ \t]+/;

/**
 * Folding white space (RFC5322, section 3.2.2): white space that may be
 * folded, i.e. a line break inserted before any white space. A fold always
 * continues with white space, so a bare line break is never folding white
 * space. Without that requirement, a value such as a display-name would
 * swallow the following header field as a folded continuation.
 */
const FWS = choice(seq(optional(HS), CRLF, HS), HS);

/**
 * A header field value body, without its enclosing line break and without
 * the white space that separates it from the field name. It may span
 * multiple lines by way of folding. The pattern is greedy, so that it
 * consumes as much folded content as possible and leaves the final line
 * break to the enclosing header rule.
 */
const FIELD_BODY = /[^ \t\n\r](?:[^\n\r]|\r?\n[ \t])*/;

module.exports = grammar({
  name: 'mail',

  extras: $ => [],

  conflicts: $ => [
    [$.correspondent],
    [$.senders],
    [$.recipients],
  ],

  rules: {
    // A message is a header section, then an optional body, then an optional
    // signature (RFC5322, section 3.5).
    rfc5322_message: $ => seq(
      $.headers,
      optional(seq($.body_separator, optional($.body))),
      optional(seq($.signature_separator, optional($.signature))),
    ),

    // === Headers (RFC5322, section 3.6) ==================================

    headers: $ => repeat1($._header),

    _header: $ => choice(
      $.header_from,
      $.header_rcpt,
      $.header_subject,
      $.header_date,
      $.header_msgid,
      $.header_references,
      $.header_inreplyto,
      $.header_replyto,
      $.header_other,
    ),

    header_from: $ => seq($.label_from, ':', optional(HS), optional($.senders), $._eol),
    header_rcpt: $ => seq($.label_rcpt, ':', optional(HS), optional($.recipients), $._eol),
    header_subject: $ => seq($.label_subject, ':', optional(HS), optional($.subject), $._eol),
    header_date: $ => seq($.label_date, ':', optional(HS), optional($.date), $._eol),
    header_msgid: $ => seq($.label_msgid, ':', optional(HS), optional($.msgid), $._eol),
    header_references: $ => seq($.label_references, ':', optional(HS), msgidSeq($), $._eol),
    header_inreplyto: $ => seq($.label_inreplyto, ':', optional(HS), msgidSeq($), $._eol),
    header_replyto: $ => seq($.label_replyto, ':', optional(HS), optional($.recipients), $._eol),
    header_other: $ => seq($.label_other, ':', optional(HS), optional($.contents), $._eol),

    // Field names are case-insensitive, so each is spelled out with explicit
    // character classes. Known names take precedence over label_other.
    label_from: _ => token(prec(1, fieldName('from'))),
    label_rcpt: _ => token(prec(1, choice(
      fieldName('to'),
      fieldName('cc'),
      fieldName('bcc'),
    ))),
    label_subject: _ => token(prec(1, fieldName('subject'))),
    label_date: _ => token(prec(1, fieldName('date'))),
    label_msgid: _ => token(prec(1, fieldName('message-id'))),
    label_references: _ => token(prec(1, fieldName('references'))),
    label_inreplyto: _ => token(prec(1, fieldName('in-reply-to'))),
    label_replyto: _ => token(prec(1, fieldName('reply-to'))),
    // Any other field name: printable US-ASCII except the colon
    // (RFC5322, section 2.2).
    label_other: _ => /[!-9;-~]+/,

    // === Addresses (RFC5322, section 3.4) ================================

    senders: $ => comsep1($, $.correspondent),

    recipients: $ => comsep1($, choice($.correspondent, $.group)),

    // The group display-name is consumed but not represented as a node, so
    // that a group's children are only its members.
    group: $ => seq(
      optional(token(displayName())),
      ':',
      optional(comsep1($, $.correspondent)),
      ';',
    ),

    // RFC5322, section 3.4: a mailbox is a name-addr, an angle-addr, or a
    // bare addr-spec, and a display-name on its own stands for an
    // unqualified alias (as found in the corpus).
    correspondent: $ => choice(
      seq(optional(choice($.quoted_name, $.name)), optional(FWS), $.email_address),
      $.email_address,
      $.name,
    ),

    // A display-name: one or more atoms separated by folding white space
    // (RFC5322, sections 3.2.3 and 3.4). It must not contain an at-sign,
    // which would make it an addr-spec instead.
    name: _ => token(displayName()),

    // A quoted-string, which may itself be folded (RFC5322, section 3.2.4).
    quoted_name: _ => token(seq(
      '"',
      /[^"\n\r]*/,
      repeat(seq(CRLF, HS, /[^"\n\r]*/)),
      '"',
    )),

    // An email address is either an angle-addr or a bare addr-spec
    // (RFC5322, section 3.4.1). The optional CFWS around an angle-addr is
    // handled by the surrounding rules.
    email_address: _ => choice(
      token(seq('<', /[^<>\n\r]*/, '>')),
      token(/[^\s:;,<>"@]+@[^\s:;,<>"@]+/),
    ),

    // === Field bodies ====================================================

    subject: _ => fieldValue(),
    date: _ => fieldValue(),
    contents: _ => fieldValue(),

    msgid: _ => token(seq('<', /[^<>\n\r]*/, '>')),

    // === Body and signature (RFC5322, section 3.5) =======================

    body_separator: _ => CRLF,
    body: _ => repeat1(choice(/[^\n\r]+/, CRLF)),

    signature_separator: _ => '-- ',
    signature: _ => repeat1(choice(/[^\n\r]+/, CRLF)),

    // === Helpers =========================================================

    // The end of a header field. The value patterns are greedy, and thus
    // consume any trailing white space themselves.
    _eol: _ => CRLF,
  },
});

/**
 * A comma-separated list of at least one element, allowing folding white
 * space around the separators.
 *
 * @param {object} $ - The grammar.
 * @param {object} rule - The element rule.
 * @returns {object} The sequence rule.
 */
function comsep1($, rule) {
  return seq(
    rule,
    repeat(seq(',', FWS, rule)),
    // RFC5322, section 4.4, allows a list to end with a spare comma.
    optional(seq(',', optional(HS))),
  );
}

/**
 * The pattern for a display-name: a sequence of atoms separated by folding
 * white space, excluding characters that have a special meaning in an
 * address (RFC5322, sections 3.2.3 and 3.4).
 *
 * @returns {object} The sequence rule.
 */
function displayName() {
  return seq(
    /[^:;,<>"@\s]+/,
    repeat(seq(optional(FWS), /[^:;,<>"@\s]+/)),
  );
}

/**
 * A sequence of one or more message identifiers, separated by optional
 * folding white space (RFC5322, sections 3.6.4).
 *
 * @param {object} $ - The grammar.
 * @returns {object} The sequence rule.
 */
function msgidSeq($) {
  return seq($.msgid, repeat(seq(optional(FWS), $.msgid)));
}

/**
 * A header field value: the folded body, without the white space that
 * separates it from the field name. The separating white space is consumed
 * by the enclosing header rule, so that it is not part of the value.
 *
 * @returns {object} The token rule.
 */
function fieldValue() {
  return token(FIELD_BODY);
}
