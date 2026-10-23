; Language injections for RFC5322 messages ("e-mails").
;
; The body of a mail is written in Markdown, and so is the signature.

((body) @injection.content
  (#set! injection.language "markdown"))

((signature) @injection.content
  (#set! injection.language "markdown"))
