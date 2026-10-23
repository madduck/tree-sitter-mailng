#include <Python.h>

typedef struct TSLanguage TSLanguage;

TSLanguage *tree_sitter_mail(void);

static PyObject *language(PyObject *self, PyObject *args) {
  (void)self;
  (void)args;
  return PyCapsule_New((void *)tree_sitter_mail(), NULL, NULL);
}

static PyMethodDef methods[] = {
  {"language", language, METH_NOARGS, "Return the grammar's language."},
  {NULL, NULL, 0, NULL},
};

static struct PyModuleDef module = {
  PyModuleDef_HEAD_INIT,
  "_binding",
  NULL,
  -1,
  methods,
};

PyMODINIT_FUNC PyInit__binding(void) {
  return PyModule_Create(&module);
}
