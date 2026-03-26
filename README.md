# tree-sitter-mailng

This is a [Tree-sitter](https://tree-sitter.github.io/tree-sitter/) parser for
[RFC5322](https://datatracker.ietf.org/doc/html/rfc5322) messages, aka.
"e-mails", e.g.:

```mail
From: martin <martin@example.org>
To: Steven <steven@example.org>, Daniel <daniel@example.net>
Date: Sun, 22 Mar 2026 21:35:14 +0100
Subject: Thank you for the inspiration you've provided me with your Tree-sitter
  mail parsers that I've used for a long time!
Message-Id: <acBSNG3o5Llcz9x2@example.org>

Hey you two, thank you so much for your mail parsers. They got me started and
served as an inspiration for this project!

-- 
martin <martin@example.org>
```

This message will be parsed into the following tree:

```
(rfc5322_message ; [0, 0] - [12, 0]
  (headers ; [0, 0] - [6, 0]
    (header_from ; [0, 0] - [0, 33]
      (label_from) ; [0, 0] - [0, 4]
      (senders ; [0, 6] - [0, 33]
        (correspondent ; [0, 6] - [0, 33]
          (name) ; [0, 6] - [0, 12]
          (email_address)))) ; [0, 14] - [0, 32]
    (header_rcpt ; [1, 0] - [1, 60]
      (label_rcpt) ; [1, 0] - [1, 2]
      (recipients ; [1, 4] - [1, 60]
        (correspondent ; [1, 4] - [1, 31]
          (name) ; [1, 4] - [1, 10]
          (email_address)) ; [1, 12] - [1, 30]
        (correspondent ; [1, 33] - [1, 60]
          (name) ; [1, 33] - [1, 39]
          (email_address)))) ; [1, 41] - [1, 59]
    (header_date ; [2, 0] - [2, 37]
      (label_date) ; [2, 0] - [2, 4]
      (date)) ; [2, 6] - [2, 37]
    (header_subject ; [3, 0] - [4, 46]
      (label_subject) ; [3, 0] - [3, 7]
      (subject)) ; [3, 9] - [4, 46]
    (header_msgid ; [5, 0] - [5, 42]
      (label_msgid) ; [5, 0] - [5, 10]
      (msgid))) ; [5, 12] - [5, 42]
  (body_separator) ; [6, 0] - [7, 0]
  (body ; [7, 0] - [10, 0]
    (document ; [7, 0] - [10, 0]
      (section ; [7, 0] - [10, 0]
        (paragraph ; [7, 0] - [9, 0]
          (inline ; [7, 0] - [8, 42]
            (inline)))))) ; [7, 0] - [8, 42]
  (signature_separator) ; [10, 0] - [11, 0]
  (signature)) ; [11, 0] - [12, 0]
```

The parser can handle:

- All RFC-compliant headers
- Headers spanning multiple lines, i.e. line continuation as in the subject above
- Basic body text
- Signatures

Planned features are:

- Queries for syntax highlighting, folding, etc. (target NeoVim integration)
- Markdown support for the mail body (maybe)
- Quoted text, and nested quotations

## Another parser??

As you may have gleaned from the example message, this project was inspired by
the existing mail parsers [by
Steven Xu](https://github.com/stevenxxiu/tree-sitter-mail) and the fork [by
Daniel Fichtinger](https://codeberg.org/ficd/tree-sitter-mail). Initially, I
worked on patches to bring e.g. multi-line headers and nested quotes to their
projects, but quickly hit my Tree-sitter knowledge limits. So, as part of my
learning journey, I went ahead and reimplemented a parser from scratch. There
you go.

## Contributing

Please contribute pull requests, ideas, comments etc..

To get started with development, follow these steps:

```
git clone https://github.com/madduck/tree-sitter-mailng.git
cd tree-sitter-mailng
npm install
tree-sitter generate
tree-sitter test
```

## Legalese

The code is © 2026 martin f. krafft <tree-sitter-mailng@pobox.madduck.net>  
It is released under the terms of the MIT licence.
