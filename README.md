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

```raw
(rfc5322_message ; [0, 0] - [12, 0]
  (headers ; [0, 0] - [6, 0]
    (header_from ; [0, 0] - [1, 0]
      (label_from) ; [0, 0] - [0, 4]
      (senders ; [0, 6] - [0, 33]
        (correspondent ; [0, 6] - [0, 33]
          (name) ; [0, 6] - [0, 12]
          (email_address)))) ; [0, 13] - [0, 33]
    (header_rcpt ; [1, 0] - [2, 0]
      (label_rcpt) ; [1, 0] - [1, 2]
      (recipients ; [1, 4] - [1, 60]
        (correspondent ; [1, 4] - [1, 31]
          (name) ; [1, 4] - [1, 10]
          (email_address)) ; [1, 11] - [1, 31]
        (correspondent ; [1, 33] - [1, 60]
          (name) ; [1, 33] - [1, 39]
          (email_address)))) ; [1, 40] - [1, 60]
    (header_date ; [2, 0] - [3, 0]
      (label_date) ; [2, 0] - [2, 4]
      (date)) ; [2, 6] - [2, 37]
    (header_subject ; [3, 0] - [5, 0]
      (label_subject) ; [3, 0] - [3, 7]
      (subject)) ; [3, 9] - [4, 46]
    (header_msgid ; [5, 0] - [6, 0]
      (label_msgid) ; [5, 0] - [5, 10]
      (msgid))) ; [5, 12] - [5, 42]
  (body_separator) ; [6, 0] - [7, 0]
  (body) ; [7, 0] - [10, 0]
  (signature_separator) ; [10, 0] - [10, 3]
  (signature)) ; [10, 3] - [12, 0]
```

The parser can handle:

- All RFC-compliant headers
- Headers spanning multiple lines, i.e. line continuation as in the subject
  above
- Basic body text
- Signatures

and it includes a basic set of queries mainly targeting
[NeoVim](https://neovim.io/) (via
[nvim-treesitter](https://github.com/nvim-treesitter/nvim-treesitter)):

- Syntax highlighting
- Injection of Markdown into the mail body

Planned features are:

- Queries for folding, text-objects etc. (target NeoVim integration)
- Quoted text, and nested quotations

## How to use with NeoVim?

Assuming that you have a working NeoVim with
[nvim-treesitter](https://github.com/nvim-treesitter/nvim-treesitter), the
[recommended way](https://github.com/nvim-treesitter/nvim-treesitter#adding-custom-languages)
to include this parser is to register it under the language name `mail` and to
start it for the `mail` file type. Put the registration into a non-ftplugin
file, for example your `init.lua`. It hooks into the `:TSUpdate` command:

```Lua
vim.api.nvim_create_autocmd('User', { pattern = 'TSUpdate',
callback = function()
  require('nvim-treesitter.parsers').mail = {
    tier = 2, -- Support level: unstable
    install_info = {
      url = 'https://github.com/madduck/tree-sitter-mailng',
      revision = 'main',
      generate = true,
      generate_from_json = false,
      queries = 'queries/mail',
    },
  }
end})
```

Put the start call into your `after/ftplugin/mail.lua`, so that NeoVim uses the
parser for every mail file. The language name is `mail`:

```Lua
vim.treesitter.start(0, 'mail')
```

Once added, start NeoVim on a mail file and run:

```Vim
:TSUpdate
:TSInstall mail
```

and reload the file.

## Another parser??

As you may have gleaned from the example message, this project was inspired by
the existing mail parsers
[by Steven Xu](https://github.com/stevenxxiu/tree-sitter-mail) and the fork
[by Daniel Fichtinger](https://codeberg.org/ficd/tree-sitter-mail). Initially, I
worked on patches to bring e.g. multi-line headers and nested quotes to their
projects, but quickly hit my Tree-sitter knowledge limits. So, as part of my
learning journey, I went ahead and reimplemented a parser from scratch, with the
help of DeepSeek 🤖.

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

If you don't want to install anything outside the source tree, install
[direnv](https://direnv.net) and create a `.envrc` file:

```sh
$ echo layout node > .envrc
$ direnv allow
$ npm install
  # …
``

This puts `./node_modules/.bin/tree-sitter` on your `$PATH`.

A `Makefile` wraps the common steps:

```

make generate # regenerate src/ from grammar.js make build # compile the parser
make test # run the corpus tests make test-queries # run the query tests

```

## Legalese

The code is © 2026 martin f. krafft <tree-sitter-mailng@pobox.madduck.net>
It is released under the terms of the MIT licence.
```
