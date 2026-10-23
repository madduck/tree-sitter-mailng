; Highlighting for RFC5322 messages ("e-mails").
;
; Capture names follow the conventions used by nvim-treesitter.

; === Header field names ==================================================

[
  (label_from)
  (label_rcpt)
  (label_date)
  (label_replyto)
] @keyword

; === Correspondents ======================================================

(name) @string.special
(quoted_name) @string

(email_address) @string.special.email

(group) @type

; === Field values ========================================================

(header_subject) @text.title

[
  (header_msgid)
  (header_inreplyto)
  (header_references)
  (header_other)
] @comment

(date) @number

; === Body and signature ==================================================

(body) @text.literal
(signature) @comment

; === Punctuation =========================================================

[
  (body_separator)
  (signature_separator)
] @punctuation.delimiter
