---
title: "`let ref` - immutable references"
linkTitle: "Partial borrow"
weight: 20
description: >
    Adopt the ideas of borrowing in Rust to Blech
---


## Partial borrow from struct

Imagine the following

```blech

struct From 
    var a: int32
    var b: int32
end


activity main()
    var f: From
    run outIsPlus1(f.a)(f.b)
    await true
end
```

The compiler can statically decide on partial borrowing for structs.
But not for arrays

The following code would be rejected
```blech
activity main(i: int32)
    var f: [2]int43
    run outIsPlus1(f[1])(f[i])
    await true
end
```

It cannot be decide at compile-time that `f[1]` and `f[i]` do not overlap.
That means borrowing form arrays borrows the whole array.


## Return values

Return values of functions and activities are always passed by value.

The generated code can either use the stack for simple type returns of functions or write directly to a result location for returned composite values and returned simple values of activities.

## Structs with references

A struct may contain a field that is a reference in order to define an alias or an associated data types.

```blech

struct Refers
    var a: int32
    let ref b: int32
end

function initRefers(aB: int32) returns Refers
    return {a = 42, b = aB}
end

var someB: int32 = 1
var result = initRefers(someB)
// someB is immutably borrowed to result here
```

The result of `initRefers` immutably borrows `ab`.
As a consequence `result` immutable borrows `someB`.
`someB` is consequently locked after `result` is iniatialized.

We could also write `initRefers` in the following way.

```blech
function initRefers(aB: int32) returns Refers
    var r: Refers = {a = 42, b = aB}
    return r
end
```

The return value is a shallow copy of the struct.
The borrow checker conservatively overestimates all possible borrowing if the return value is constructed throug different control path.

Borrow checking makes sure that a memory location that is borrowed by a struct is either locked or frozen.

## No need for reference types

If we introduce a tuple type that has value semantics - i.e. allows assignment, we could
make structs and and arrays non-value types which do not allow whole composite assignment.

This clears the strange behaviour that a struct with let fields cannot be assigned as a whole.
And it introduces a structure - the tuple - that is either immutable or mutable as a whole.

This is similar to Rust where only simple types and tuples of simple types can be assigned.

```blech

var tup: (int32, bool) = {42, true}

if tup._2 then
    tup_1 = tup_1 + 1
end

let otherTup: (int32, bool) = {-42, false}

tup = otherTup
```

References and sub-references need to be defined with their declaration and cannot be changed.


