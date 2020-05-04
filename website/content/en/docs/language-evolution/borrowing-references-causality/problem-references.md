---
title: "References need borrowing"
linkTitle: "Reference borrowing"
weight: 10
description: >
    Adopt the ideas of borrowing in Rust to Blech
---

## Parameters are references

Imagine the following Blech program

```blech
function outIsInPlus1 (a: int32)(b: int32)
    b = 1
    b = a + b 
end

activity godUsage()
    var i = 42: int32
    var j: int32
    outIsInPlus1(i)(j) // 43 --> j
    await true
end
```
So far so good, the program has the expected behaviour: `j` gets `i + 1`. 

But if we call the same function with the same `variable` as input and output we get a strange behaviour.

```blech
activity badUsage()
    var i = 42: int32
    outIsInPlus1(i)(i)
    await true
end
```
Semantically Blech passes parameters by reference.

If Blech would allow this code and we assume call-by-reference semantics, `i` has value `2` after the execution of the function.

This would be an unexpected behavior both from the implementation and the usage point of view.

The implementation does not take into account that `a` and `b` may point to the same memory location.
The point of usage we know nothing about the actual implementation. 
The implicit assumption, input `a` and output `b` must no be the same memory location is not transparent.

In order to prevent such errors, Blech forbids this usage.

```txt
error: Read-write conflict. i or an alias thereof occurs both in the input and output list of the sub program call.
  --> incr.blc:3:5 [causality]

3  |     outIsInPlus1(i)(i)
   |                     - Output argument.
3  |     outIsInPlus1(i)(i)
   |                  ^ Input argument.
```

One might wonder, why a simple increment is allowed
```blech
    i = i + 1
```
while the call of the function

```blech
    outIsInPlus1(i)(i)
```
is not.

The reason is, that parameters are passed by-reference.

The input `a` takes a read-only reference to the actual input, the output `b` takes a read-write reference to the actual input.

Semantically the function `outIsInPlus1` has the following form

```blech
function outIsInPlus1 (let ref a: int32)(var ref b: int32)
    b = 1
    b = a + b 
end
```

Blech forbids taking a read-only reference and an read-write reference to the same memory location at the same time.

Since the compiler rejects such programs, the code generation is free to pass input parameters of functions. by value or by reference.
Currently, simple types are passed by reference while composed types are passed by reference.

Activity parameters have the same pass-by-reference semantics. Due to the nature of activities input parameters must always be passed by-reference in the code generation

## References.

Blech introduces references which is a restricted form of pointers for expressing aliases and associating data structures.

If we do the same thing as above in sequential code,

```blech
var i: int32

let ref a = i
var ref b = i

b = 1
b = a + b
```

we run into the same problems: `a` is a read-only reference to `i`, `b` is a read-write reference to `i`.
When we change `b` we implicitly change `a`.
The makes reasoning about programs difficult.

Luckily there is way of handling these problems at compile time.

## Borrowing 

The solution to these problems in **Borrowing analysis**

EXPLAIN RUST'S BORROWING HERE.

With borrowing semantics, the Blech compiler would reject the above program.
In the same scope we can either take several `let ref`s or one `var ref`.
In both cases the original name `i` is no longer accessible.

```blech
var i: int32

do  // increment i via b
    var ref b = i  // read-write (mutable) borrow
    // i is locked
    b = b + 1    
end

// read i via a
let ref a = i     // read-only (immutable) borrow
// i is frozen
```

Parmeter passing is also borrowing.
The call takes a `let ref` (immutable) borrow and a `var ref` (mutable) borrow at the same time.

```blech
    var i: int32
    outIsInPlus1(i)(i)
```
In order to correct this we need an additional memory location

```blech
    var i: int32
    let j = i  // read-only j gets value from i
    outIsInPlus1(j)(i)
```

The implementor of function `outIsInPlus1` can assume that the actual parameters never overlap in their memory location.








