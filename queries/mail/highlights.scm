; Highlighting for RFC5322 messages ("e-mails").
;
; Capture names follow the conventions used by nvim-treesitter.

; === Header field names ==================================================

[
  (label_from)
  (label_rcpt)
  (label_subject)
  (label_date)
  (label_msgid)
  (label_references)
  (label_inreplyto)
  (label_replyto)
  (label_other)
] @keyword

; === Correspondents ======================================================

(name) @string.special
(quoted_name) @string

(email_address) @string.special.email

(group) @type

; === Field values ========================================================

(subject) @markup.bold
(date) @number
(msgid) @comment
(contents) @comment

; === Body and signature ==================================================

(body) @text.literal
(signature) @comment

; === Punctuation =========================================================

[
  (body_separator)
  (signature_separator)
] @punctuation.delimiter
