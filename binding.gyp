{
  "targets": [
    {
      "target_name": "tree_sitter_mailng_binding",
      "dependencies": [
        "<!(node -p \"require('node-addon-api').targets\"):node_addon_api_except"
      ],
      "include_dirs": [
        "<!(node -p \"require('node-addon-api').include_dir\")",
        "src"
      ],
      "sources": [
        "bindings/node/binding.cc",
        "src/parser.c"
      ],
      "conditions": [
        [
          "OS!='win'",
          {
            "cflags_c": [
              "-std=c11"
            ]
          }
        ]
      ]
    }
  ]
}
