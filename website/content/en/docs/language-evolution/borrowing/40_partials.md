---
title: "Partial borrowing and borrowed parts"
linkTitle: "Partials"
weight: 40
description: >
    Adopt the ideas of borrowing in Rust to Blech
---


## Partial borrow from a struct

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
But not for arrays.

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


## Structs with references 

A struct may contain a field that is a reference in order to define an alias or an associated data type.

Structs with references contain borrowed fields.

```blech
struct RefStruct
    var a: int32
    let ref b: int32
end
```

Return a struct with references requires to define which references a borrowed by the struct.

```blech
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
function initRefStruct(refb: int32) returns RefStruct shares refb
    var r: RefStruct = {a = 42, b = refB}
    return r
end
```
The return value is a shallow copy of the struct.


The borrow checker conservatively overestimates all possible borrowing if the return value is constructed through different control path.

```blech
function initRefStruct(refb: int32, refother: int32) returns RefStruct shares refb, refother
    if aB < aB2 then
        return {a = 42, b = refb}
    else
        return {a = -42, b = refother}
    end
end
```

It also overestimates the sharing if the `shares` refers to an output, although the `RefStruct` value immutably borrows `refb`.
```blech
function initRefStruct()(refb: int32) returns RefStruct shares refb
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

function initRefStruct (refb: int32) returns RefStruct shares refb

function initRefStruct (refb: int32, refOther: int32) returns RefStruct shares refb, refother

function initRefStruct ()(refb: int32) returns RefStruct shares refb

```

Struct with references can only be assigned once, because a references need to be defined at the point of their declaration.

