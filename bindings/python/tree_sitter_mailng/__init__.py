"""Mail grammar for Tree-sitter."""

from importlib.resources import files as _files

from ._binding import language


def _get_query(name, file):
    query = _files(f"{__package__}.queries") / file
    globals()[name] = query.read_text()


def __getattr__(name):
    if name == "HIGHLIGHTS_QUERY":
        _get_query(name, "highlights.scm")
    elif name == "INJECTIONS_QUERY":
        _get_query(name, "injections.scm")
    else:
        raise AttributeError(f"module {__name__!r} has no attribute {name!r}")
    return globals()[name]


__all__ = [
    "language",
    "HIGHLIGHTS_QUERY",
    "INJECTIONS_QUERY",
]
