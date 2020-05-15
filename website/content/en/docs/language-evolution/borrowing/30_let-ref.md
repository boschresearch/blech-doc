---
title: "Immutable references - `let ref`"
linkTitle: "Immutable references"
weight: 30
description: >
    Adopt the ideas of borrowing in Rust to Blech
---
## Read-only references

Different to Rust, Blech takes references and de-references whenever it is necessary.

Althoug Blech semantically uses pass-by-reference it is possible to pass a complete right-hand-side expression for input parameters.

Let's take our example from the introduction

```blech
    var i: int32
    var j: int32

    outIsInPlus1(j + 1)(i)
```

This programm is valid.
Semantically Blech creates a auxiliary memory location from which the read-only reference can be taken.
For a function on simple types the generated code can be optimized and the parameter can be passed by-value.

This is not true for an activity.

```blech
activity outAlwaysIsInPlus1 (a: int32) (b: int32)
    repeat 
        b = 1
        b = a + b 
        await true
        b = 1
        b = a + b
        await true
    end
end
```

```blech
    var i: int32
    var j: int32

    run outAlwaysIsInPlus1(j + 1)(i)
```

In every step the activity gets `j+1` as its input.

For the code generation the auxiliary memory location is necessary.

We imagine the new value is *pumped into* the activity in every step.

## Immutable borrowing in sub-expressions

Due to a causality error the Blech compiler rejects the following program.

```blech
    var i: int32
    run outAlwaysIsInPlus1(i + 1)(i)
```

Furthermore the compiler rejects a similar function call

```blech
    var i: int32
    outIsInPlus1(i + 1)(i)
```

This is different to Rust, because Rust cannot take immutable (read-only) references to right-hand side expressions.

The borrow checker needs to check the occurence of read-only borrowing in right-hand side expressions.

## Pure functions

Pure functions only have input parameters and a return value.

For pure functions pass-by-reference and pass-by-value are semantically the same, because nothing at the call side gets changed.

All build-in operators in Blech are pure functions.


## Read-only references

Since we can pass a right-hand-side expression as an input parameter we should also be able to take a reference to a right-hand-side expression in sequential code.
This makes sense in an activity and is called `bind` in the language Quartz.

```blech 
activity a (i: int32) (j: int32)
    let ref double = i * 2
    repeat
        j = double
        await true
    end
end
```

In order to take a reference to a right-hand-side expression the compiler would generate an additional memory location.

This has roughly the following semantics:

```blech 
activity a (i: int32) (j: int32)
    var aux_double: int32  // not subject to borrow checking
    let ref double = internal_aux_double
    cobegin weak
        repeat
            aux_double = i * 2
            await true
        end
    with 
        repeat
            j = double
            await true
        end
    end
end
```

For the declaration `let ref double = i * 2` we need to apply the borrowing rules for the sub-expression `i`.

For example in the following code would then be rejected. 

```blech
    var i: int32
    var z: int32
    let ref double = i * 2  // immutable borrow of i
    repeat
        z = double
        await true
    until z > 1000 end
    i = i + 1 // i is no longer accessible here 
```
The read-only reference `double` immutable borrows `i`, which locks `i` for further usage. 

As usual a separate scope can solve the problem:

```blech
    var i: int32
    var z: int32
    do
        let ref double = i * 2
        repeat
            z = double
            await true
        until z > 1000
    end
    i = i + 1
```

For purely sequential code that is not *re-entered* on every tick, the contents of the auxiliary memory location gets only assigned once.

It not possible to take a reference for a right-hand-side expression as an output or a `var ref` declaration.





