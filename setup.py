from os.path import isdir, join
from platform import system

from setuptools import Extension, find_packages, setup
from setuptools.command.build_ext import build_ext


def library_name():
    return "mailng"


def include_dirs():
    return ["src"]


def sources():
    return ["bindings/python/tree_sitter_mailng/binding.c", "src/parser.c"]


class BuildExt(build_ext):
    def build_extensions(self):
        if system() == "Windows":
            self.compiler.compile_options.remove("/WX")
        build_ext.build_extensions(self)


setup(
    ext_modules=[
        Extension(
            "tree_sitter_mailng._binding",
            language="c",
            include_dirs=include_dirs(),
            sources=sources(),
        ),
    ],
    packages=find_packages("bindings/python"),
    package_dir={"": "bindings/python"},
    package_data={
        "tree_sitter_mailng": [
            "queries/*.scm",
            "*.pyi",
        ],
    },
    cmdclass={"build_ext": BuildExt},
    zip_safe=False,
)
