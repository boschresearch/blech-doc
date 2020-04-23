---
title: "Notation"
linkTitle: "Notation"
weight: 10
description: >

---

We use a modified Backus-Naur form notation to describe the Blech language syntax.
The modifications to the original BNF make the rules look more like regular expressions.
We follow the same notation conventions as the [Python language documentation](https://docs.python.org/3/reference/index.html). Here is what they write about notation:

> The descriptions of lexical analysis and syntax use a modified BNF grammar notation. This uses the following style of definition:
> ```abnf
> name      ::=  lc_letter (lc_letter | "_")*
> lc_letter ::=  "a"..."z"
> ```
> The first line says that a `name` is an `lc_letter` followed by a sequence of zero or more ``lc_letter``s and underscores. An `lc_letter` in turn is any of the single characters ``'a'`` through ``'z'``. (This rule is actually adhered to for the names defined in lexical and grammar rules in this document.)
>
> Each rule begins with a name (which is the name defined by the rule) and `::=`. A vertical bar (`|`) is used to separate alternatives; it is the least binding operator in this notation. A star (`*`) means zero or more repetitions of the preceding item; likewise, a plus (`+`) means one or more repetitions, and a phrase enclosed in square brackets (`[ ]`) means zero or one occurrences (in other words, the enclosed phrase is optional). The `+*+` and `+` operators bind as tightly as possible; parentheses are used for grouping. Literal strings are enclosed in quotes. White space is only meaningful to separate tokens. Rules are normally contained on a single line; rules with many alternatives may be formatted alternatively with each line after the first beginning with a vertical bar.
>
> In lexical definitions (as the example above), two more conventions are used: Two literal characters separated by three dots mean a choice of any single character in the given (inclusive) range of ASCII characters. A phrase between angular brackets (`+<...>+`) gives an informal description of the symbol defined; e.g., this could be used to describe the notion of ‘control character’ if needed.
