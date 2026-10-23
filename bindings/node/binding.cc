#include <napi.h>

typedef struct TSLanguage TSLanguage;

extern "C" TSLanguage *tree_sitter_mailng();

Napi::Object Init(Napi::Env env, Napi::Object exports) {
  exports["name"] = Napi::String::New(env, "mailng");
  auto language = Napi::External<TSLanguage>::New(env, tree_sitter_mailng());
  exports["language"] = language;
  return exports;
}

NODE_API_MODULE(tree_sitter_mailng_binding, Init)
