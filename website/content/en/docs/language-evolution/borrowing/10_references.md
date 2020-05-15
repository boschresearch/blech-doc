---
title: "References in Blech"
linkTitle: "References"
weight: 10
description: >
    Adopt the ideas of borrowing in Rust to Blech
---

## Parameters are references

Semantically, Blech passes parameters by reference.

Imagine the following Blech program

```blech
function outIsInPlus1 (a: int32) (b: int32)
    b = 1
    b = a + b 
end

activity godUsage ()
    var i = 42: int32
    var j: int32
    outIsInPlus1(i)(j) // 43 --> j
    await true
end
```
So far so good, the program has the expected behaviour: `j` gets `i + 1`. 

But if we call the same function with the same `variable` as input and output we get a strange behaviour.

```blech
activity badUsage ()
    var i = 42: int32
    outIsInPlus1(i)(i)
    await true
end
```

If Blech would allow this code and we assume call-by-reference semantics, `i` has value `2` after the execution of the function.

This would be an unexpected behavior both from the implementation and the usage point of view.

The implementation does not take into account that `a` and `b` may point to the same memory location.
The point of usage we know nothing about the actual implementation. 
The implicit assumption, input `a` and output `b` must no be the same memory location is not transparent.

In order to prevent such errors, Blech forbids this usage.

```
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
function outIsInPlus1 (let ref a: int32) (var ref b: int32)
    b = 1
    b = a + b 
end
```

Blech forbids taking a read-only reference and an read-write reference to the same memory location at the same time.

Since the compiler rejects such programs, the code generation is free to pass input parameters of functions by value or by reference.
Currently, simple types are passed by reference while composed types are passed by reference.

Activity parameters have the same pass-by-reference semantics. Due to the nature of activities input parameters must always be passed by-reference in the code generation


## Return values

Return values of functions and activities are always passed by value.

The generated code can either use the stack for simple type returns of functions or write directly to a result location for returned composite values and returned simple values of activities.



## Reference definitions

Blech also allows references definitions. They are a restricted form of pointers for expressing aliases and associating data structures.

### The benefit of references

References can be used to express aliases.

```blech 
struct S
    var buffer: [3]int32
end

...
    var s: S

    do 
        let i: nat8 = 1
        if s.buffer[i] > 0 then
            s.buffer[i] = s.buffer[i] + 1
        end
    end

    do 
        let i: nat8 = 1
        var ref elem = s.buffer[i]
        if elem > 0 then 
            elem = elem + 1
        end
    end

```
This prevents repetition and make a program better readable.

References can also be used to associate data structures

```blech

struct S
    var ref buffer: [3]int32
end


...
    
    var array: [3]int32
    var s: S = {buffer = array}
```
The variable `s` is associated to (points to) the variable `array` via the read-write reference `s.buffer`.

### References are not first-class types

References only occur implicitly as parameters or explicitly as reference definitions.

Blech implicitly takes references and de-references them if necessary.
There is no such thing like an adress operator `&` or a de-referencing operator `*` as known from other imperative languages.

References must be initialised at their declaration.

This is done when
1. an actual parameter is supplied in a subprogram call, or
2. an initialiser is given in a reference declaration.

This enables the compiler to conservatively track reference relationships across the program and in turn enables causality analysis. 

It prevents dangling references and circumvents pointer aliasing problems.

The `ref` in a reference declaration is also **not** a type constructor, that might occur anywhere in type expressions.
It is an additional property of a memory location or a value.


### The problem with references

The use of references can make a program difficult to reason about.

If we do the same thing as above in sequential code,

```blech
var i: int32

let ref a = i
var ref b = i

b = 1
b = a + b
```

we run into the same problems: `a` is a read-only reference to `i`, `b` is a read-write reference to `i`.
When we change `i` via `b` we implicitly change the value we get from `a`.

Even in the simple case 
```blech
var i: int32

let ref a = i

b = 1
b = a + b
```
where we have a read-only reference to `i` while at the same time we can change `i` directly, we run into the same problems, when reasoning about a program.

Having a read-only access to a memory location, would not guarantee, that the underlying value does not change. 

With references we need to be able to rule out calls like
```blech
    var i: integer
    let ref a = i
    var ref b = i

    run anActivity(a)(b)
    run anActivity(b)(i)
    run anActivity(i)(b)
    run anActivity(a)(i)

    aFunction(a)(b)
    aFunction(b)(i)
    aFunction(i)(b)
    aFunction(a)(i)

    cobegin 
        run fstTread(a)(i)
    with
        run sndThread(a)(b)
    end
```
due to read-write and write-write conflicts.

With references causality errors might be very difficult to understand and even sequential code is already confusing.

Luckily there is way of handling these problems at compile time.
In Rust this is called [**Borrowing Analysis**](../20_borrowing).









