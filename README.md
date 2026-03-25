# tree-sitter-mailng

This is a [Tree-sitter](https://tree-sitter.github.io/tree-sitter/) parser for
[RFC5322](https://datatracker.ietf.org/doc/html/rfc5322) messages, aka.
"e-mails", e.g.:

```
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

The parser can handle:

- All RFC-compliant headers
- Headers spanning multiple lines, i.e. line continuation as in the subject above
- Basic body text

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
