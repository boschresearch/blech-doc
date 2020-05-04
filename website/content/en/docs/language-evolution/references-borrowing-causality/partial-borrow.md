---
title: "Partial borrowing"
linkTitle: "Partial borrowing"
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
struct RefStruct
    var a: int32
    let ref b: int32
end

function initRefStruct(refb: int32) returns RefStruct shares refb
    return {a = 42, b = refb}
end

var b: int32 = 1
var result = initRefStruct(b)
// b is immutably borrowed to result here
```

The result of type `RefStruct` shares read-only reference `refb`. That means it immutably borrows `refb`.
As a consequence `result` immutably borrows `b`.
Consequently `b` is frozen after `result` is iniatialized.

We could also write `initRefers` in the following way.

```blech
function initRefStruct(refb: int32) returns shares refb RefStruct 
    var r: RefStruct = {a = 42, b = refB}
    return r
end
```

The return value is a shallow copy of the struct.

The borrow checker conservatively overestimates all possible borrowing if the return value is constructed through different control path.

```blech
function initRefStruct(refb: int32, refother: int32) returns shares refb, refother RefStruct
    if aB < aB2 then
        return {a = 42, b = refb}
    else
        return {a = -42, b = refother}
    end
end
```

It also overestimates the sharing if the `shares` refers to an output, although the `RefStruct` value immutably borrows `refb`.
```blech
function initRefStruct()(refb: int32) returns shares refb RefStruct 
    refB = refB + 1
    return {a = 42, b = refB}
end

var b: int32
var rs: RefStruct = initRefStruct()(b)
```

Overestimation is necessary for a rather simple signature.


For separate compilation borrowing in the result must become part of the signature of a function without inspection of the actual code.

The three variants have of `initRefStruct` have the following signatures

```blech

function initRefStruct (refb: int32) returns shares refb RefStruct 

function initRefStruct (refb: int32, refOther: int32) returns shares refb, refother RefStruct

function initRefStruct ()(refb: int32) returns shares refb RefStruct 

```

## Proposal: Tuples

If we introduce a tuple type that has value semantics - i.e. allows assignment, we could
make structs and and arrays non-value types which do not allow whole composite assignment.

This clears the strange behaviour that a struct with let fields cannot be assigned as a whole.
And it introduces a structure - the tuple - that is either immutable or mutable as a whole.

This is similar to Rust where only simple types and tuples of simple types can be assigned.

```blech

var tup: (int32, bool) = {42, true}

if tup._2 then
    tup._1 = tup._1 + 1
end

let otherTup: (int32, bool) = {-42, false}

tup = otherTup
```

With built-in tuples we get a simple composite value type.
We would restrict tuples to only hold value types - simple types and other tuples.
Instead of accessing tuples with build in field names: `_1`, `_2`, an so on, we could also allow named tuples like in F#.


Structures and arrays generally would become reference types which
- do not allow assigment as a whole composite, and
- which cannot be used with `prev`.

Structures would be the only types that are allowed to contain references to other memory locations.







