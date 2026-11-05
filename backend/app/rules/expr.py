"""A tiny, safe evaluator for the `when:` expressions in rules/clinical_rules.yaml.

Grammar (no Python eval, no attribute access, no calls):
    expr    := or
    or      := and ("or" and)*
    and     := not ("and" not)*
    not     := "not" not | compare
    compare := atom (("<" | "<=" | ">" | ">=" | "==" | "!=") atom)*     # chained: 24 <= x <= 28
    atom    := NUMBER | NAME | "true" | "false" | "(" expr ")"

`and` binds tighter than `or` (as in Python), so `a and b or c` means `(a and b) or c`.
A comparison involving a missing value (None) is False. An unknown name raises, so typos fail tests.
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Any

_TOKEN = re.compile(r"\s*(?:(\d+(?:\.\d+)?)|(<=|>=|==|!=|<|>|\(|\))|([A-Za-z_][A-Za-z0-9_]*))")
_OPS = {
    "<": lambda a, b: a < b,
    "<=": lambda a, b: a <= b,
    ">": lambda a, b: a > b,
    ">=": lambda a, b: a >= b,
    "==": lambda a, b: a == b,
    "!=": lambda a, b: a != b,
}
_KEYWORDS = {"and", "or", "not", "true", "false"}


class RuleSyntaxError(ValueError):
    pass


class UnknownName(KeyError):
    pass


@dataclass(frozen=True)
class Node:
    kind: str  # num | name | bool | not | and | or | cmp
    value: Any = None
    children: tuple = ()


def tokenize(src: str) -> list[tuple[str, str]]:
    out, pos = [], 0
    src = src.strip()
    while pos < len(src):
        m = _TOKEN.match(src, pos)
        if not m or m.end() == pos:
            raise RuleSyntaxError(f"unexpected character at {pos}: {src[pos : pos + 12]!r}")
        num, op, name = m.groups()
        if num is not None:
            out.append(("num", num))
        elif op is not None:
            out.append(("op", op))
        else:
            out.append(("kw" if name in _KEYWORDS else "name", name))
        pos = m.end()
    return out


class _Parser:
    def __init__(self, tokens: list[tuple[str, str]]):
        self.t, self.i = tokens, 0

    def peek(self, kind: str | None = None, value: str | None = None) -> bool:
        if self.i >= len(self.t):
            return False
        k, v = self.t[self.i]
        return (kind is None or k == kind) and (value is None or v == value)

    def take(self) -> tuple[str, str]:
        tok = self.t[self.i]
        self.i += 1
        return tok

    def parse(self) -> Node:
        node = self.or_()
        if self.i != len(self.t):
            raise RuleSyntaxError(f"unexpected token {self.t[self.i]!r}")
        return node

    def or_(self) -> Node:
        parts = [self.and_()]
        while self.peek("kw", "or"):
            self.take()
            parts.append(self.and_())
        return parts[0] if len(parts) == 1 else Node("or", children=tuple(parts))

    def and_(self) -> Node:
        parts = [self.not_()]
        while self.peek("kw", "and"):
            self.take()
            parts.append(self.not_())
        return parts[0] if len(parts) == 1 else Node("and", children=tuple(parts))

    def not_(self) -> Node:
        if self.peek("kw", "not"):
            self.take()
            return Node("not", children=(self.not_(),))
        return self.compare()

    def compare(self) -> Node:
        first = self.atom()
        ops, rest = [], []
        while self.peek("op") and self.t[self.i][1] in _OPS:
            ops.append(self.take()[1])
            rest.append(self.atom())
        if not ops:
            return first
        return Node("cmp", value=tuple(ops), children=(first, *rest))

    def atom(self) -> Node:
        if self.i >= len(self.t):
            raise RuleSyntaxError("unexpected end of expression")
        k, v = self.take()
        if k == "num":
            return Node("num", float(v) if "." in v else int(v))
        if k == "name":
            return Node("name", v)
        if k == "kw" and v in ("true", "false"):
            return Node("bool", v == "true")
        if k == "op" and v == "(":
            node = self.or_()
            if not self.peek("op", ")"):
                raise RuleSyntaxError("missing )")
            self.take()
            return node
        raise RuleSyntaxError(f"unexpected token {v!r}")


def parse(src: str) -> Node:
    return _Parser(tokenize(src)).parse()


def names(node: Node) -> set[str]:
    if node.kind == "name":
        return {node.value}
    out: set[str] = set()
    for c in node.children:
        out |= names(c)
    return out


def evaluate(node: Node, ctx: dict[str, Any]) -> Any:
    k = node.kind
    if k in ("num", "bool"):
        return node.value
    if k == "name":
        if node.value not in ctx:
            raise UnknownName(node.value)
        return ctx[node.value]
    if k == "not":
        return not bool(evaluate(node.children[0], ctx))
    if k == "and":
        return all(bool(evaluate(c, ctx)) for c in node.children)
    if k == "or":
        return any(bool(evaluate(c, ctx)) for c in node.children)
    if k == "cmp":
        vals = [evaluate(c, ctx) for c in node.children]
        for op, a, b in zip(node.value, vals, vals[1:], strict=False):
            if a is None or b is None or isinstance(a, list) or isinstance(b, list):
                return False
            if not _OPS[op](a, b):
                return False
        return True
    raise RuleSyntaxError(f"bad node {k}")
