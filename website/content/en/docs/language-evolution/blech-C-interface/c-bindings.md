---
title: "C bindings"
linkTitle: "C bindings"
weight: 20
description: >
    Allow C bindings with the expressiveness of C macros.
---

## Problem

Re-arranging parameters in C function calls is currently not possible.

Output parameters in C are not always at the end of the parameter list.
For example, a function like `strcpy` can not be used from Blech via a simple `extern function`.

```c
char *strcpy(char *restrict s1, const char *restrict s2);
```

The C function `strcpy` copies `s2` to `s1`.

The `extern` function declaration in Blech would put the target `toString` in the output parameter list.
```blech
@[CFunction (binding ="strcpy", header = "string.h")]
extern function stringCopy (fromString: string)(toString: string)
```

Given that we currently do not support strings, which is another future topic, 
the order of input and output parameters cannot be rearranged for the bound C function.

```blech
@[EntryPoint]
activity Main () ()
    let s2 = "hello"
    var s1: string
    stringCopy(s2)(s1)

    await true
end
```

When we call `stringCopy` from Blech we actually we like to call `strcpy` in C directly.
This is currently not possible.

## Proposal 

Specifiy the full C function by indexing Blech identifiers

This could be done by using the parameter names in a macro-like fashion.

```blech
@[CFunction (binding = "strcpy($2, $1)" , header = "string.h")]
extern function stringCopy (formString: string)(toString: string)
```
The Blech identifiers in the extern declaration can be addressed via `$i`.

`$0` is `stringCopy`, `$1` is `fromString`, `$2` is `toString`.

For code generation we would create the C macro by subsituting the Blech parameter names.

```c
#include <string.h>

#define blc_stringCopy(blc_fromString, blc_toString) strcpy(blc_toString, blc_fromString)

```

As usual it is the reponsibility of the programmer to guarantee correct types, additionially the indexing of identifiers must be correct.


If `strings` will become `structs` with `len` field and a `buf` reference.
The extern declaration could look like the following:

```blech
@[CFunction (binding = "do { strcpy($2.buf, $1.buf); $2.len = $1.len; } while (0)" , header = "string.h")]
extern function stringCopy (formString: string)(toString: string)
```

which would create the following macro

```c
#include <string.h>

#define blc_stringCopy(blc_fromString, blc_toString) \ 
    do { strcpy(blc_toString.buf, blc_fromString.buf); blc_toString.len = blc_fromString.len; } while (0)
```

As always with C code, this code is unsafe, because Blech cannot check the buffer sizes - actually the compiler does not know anything about copying or the semantics of the function call.

Perhaps we should also allow multi-line strings in attributes and later on in string literals, for better formatting of long strings.



