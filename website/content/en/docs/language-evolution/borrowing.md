---
title: "Borrowing"
linkTitle: "Borrowing"
weight: 20
description: >
    Adopt the ideas of borrowing in Rust to Blech
---
{{% pageinfo %}}
The borrowing proposal is work in progress.
{{% /pageinfo %}}

## Borrowing in Rust and Blech

Blech

```blech
function outIsInPlus1 (a: int32)(b: int32)
    b = 1
    b = a + b 
end

activity main()
    var i = 42: int32
    var j: int32
    outIsInPlus1(i)(j) // 43 --> j
    await true
end
```

So far so good, but the following program

```txt {linenos=true}
activity main()
    var i = 42: int32
    outIsInPlus1(i)(i) //  
    await true
end
```

leads to a causality error during compilation.

```txt
error: Read-write conflict. i or an alias thereof occurs both in the input and output list of the sub program call.
  --> incr.blc:3:5 [causality]

3  |     outIsInPlus1(i)(i)
   |                     - Output argument.
3  |     outIsInPlus1(i)(i)
   |                  ^ Input argument.
```

The reason is that all parameters conceptually are passed by reference. 
For pure functions - which do not have output parameters, passing actual parameters by reference can be implemented with pass-by-value which makes parameter passing of simple-types an optimisation.
For impure functions - which have output parameters, the compiler forbids references to overlapping memory regions, as in the example above.



Blech automatically takes references and de-references them if necessary. It decides on mutability through the occurence in the input or output parameter list. Semantically the Blech program has the following form:

```blech
function outIsInPlus1(<let ref> a: int32)(<var ref> b: int32)
    <*> b = 1
    <*> b = <*> a + <*> b 
end

activity main()
    var i = 42: int32
    outIsInPlus1(<&> i)(<&mut> i)  // &mut a reference that can be changed
    await true
end
``` 
which is, as explained before, rejected by the compiler.

This non-pure function is semantically very close to Rust.
Rust also does not allow this call. 
The borrow checker detects an error.

```rust
fn outIsInPlus1(a: &i32, b: &mut i32) {
    *b = 1;
    *b = *a + *b;
}

fn main() {
    let mut i = 42;
    outIsInPlus1(&i, &mut i);
}
```

```txt
error[E0502]: cannot borrow `i` as mutable because it is also borrowed as immutable
 --> src/example.rs:9:11
  |
9 |     outIsInPlus1(&i, &mut i);
  |     ------------ --  ^^^^^^ mutable borrow occurs here
  |     |            |
  |     |            immutable borrow occurs here
  |     immutable borrow later used by call

```

For activities in Blech the causality rules for parameter are the same. The causality checker detects an error in the following example

```blech
activity outIsInPlus1(a: int32)(b: int32)
    b = 1       // b = 1
    b = a + b   // b = 1 + a
    await true
end

activity main()
    var i = 42: int32
    run outIsInPlus1(i)(i)
    await true
end
```

```txt
error: Read-write conflict. i or an alias thereof occurs both in the input and output list of the sub program call.
  --> example.blc:11:5 [causality]

11 |     run outIsInPlus1(i)(i)
   |                         - Output argument.
11 |     run outIsInPlus1(i)(i)
   |                      ^ Input argument.
```

Similar to the function above the activity `outIsInPlus1` has semantically the following form:

```blech
activity outIsInPlus1(<let ref> a: int32)(<var ref>b: int32)
    <*> b = 1       
    <*> b = <*> a + <*> b
    await true
end

activity main()
    var i = 42: int32
    run outIsInPlus1(<&> i)(<& mut> i)
    await true
end
```

There is no such thing as a pure activity.

If we have more uses for borrowing and a **borrowing checker** this could become a **borrowing error** instead of a causality error.


## Call-by-value and return values

The Blech compiler guarantees that we do not pass a `let ref` and `var ref` to the same memory location
at the same time.

Writing a pure function is still possible

```blech
function incr(i: int32) returns int32
    return i + 1
end
activity main()
    var i = 42: int32
    i = incr(i)  
    await true
end
```

Semantically this is 

```blech
function incr(<let ref> i: int32) returns <let> int32
    return <*>i + 1
end

activity main()
    var i = 42: int32
    i = incr(<&> i)  
    await true
end
```

In a pure function call-by-reference is equivalent to call-by-value since the Blech compiler guarantees, that `i` is read-only. The absence of side effects prevents changes on the memory location of the actual parameter.

Therefore we can compile it with call-by-value, which semantically equivalent to call-by-refernce.
This is an optimisation for simple types, which makes sense.

```blech
function incr(<let> i: int32) returns <let> int32
    return i + 1
end

activity main()
    var i = 42: int32
    i = incr(i)  
    await true
end
```

All build-in operators are pure functions.

On the other hand structured value types returned by a function can be implemented with the help
of a reference:

```blech
struct S end
function initS() returns S
    return {}
end

activity main()
    var s: S = initS()
    await true
end
```

This can be compiled as

```blech
struct S end

function initS()(<var ref> result: S)
    *result = {}
    return 
end

activity main()
    var s: S
    initS()(<&>s)
    await true
end
```

## Returning a reference

A function might also return a reference. This is mainly necessary to initialize references.

```blech 
function oneOutOfTwo(a: int32, b: int32) returns ref int32
    if a > b then 
        return a
    else 
        return b
    end
end

// use
    var x: int32
    var y: int32
    var ref z = oneOutOfTwo(x, y)
```
The compiler conservatively can deduce for causality analysis, that `z` shares memory with `x` or `y`.

Semantically this gets compile to

```blech 
function oneOutOfTwo(<let ref> a: int32, <let ref> b: int32) returns ref int32
    if <*>a > <*>b then 
        return a
    else 
        return b
    end
end

// use
    var x: int32
    var y: int32
    var ref z = oneOutOfTwo(<&> x, <&> y)
```
Note that the call-by-value optimisation is not possible here, because a reference is returned as result.

Returning references should also be possible with external variables.

```blech 
function localOrExternal(a: int32) returns ref int32
    @[CInput(...)]
    extern let external: int32
    if a > external then 
        return a
    else 
        return external
    end
end

// use
    var x: int32
    let ref z = localOrExternal(x)
```

## Borrowing

Passing parameters by-reference is essentially borrowing a reference.

There are several combinations

| Blech | Semantics | Blech call | Call semantics |
| --- | --- | --- | --- |
| function f (a: T)() | function f (let ref a: T) | f(x)() | f(&x)() |
| function f ()(b: T) | function f ()(var ref b: T) | f()(x) | f()(&x) |
| activity a (a: T)() | activity a (let ref a: T) | run a(x) | run a(&x) |
| activity a ()(b: T) | activity a ()(var ref b: T) | run a()(x) | run a()(&x) |

In case of an input parameter it is a non-mutable borrowing. In case of an output parameter it is a mutable borrowing.

## Borrowing via reference declarations

Borrowing not only occurs when passing parameters, but also when declaring references.
We also plan this for Blech.

```blech
activity main()
    var x: int32 = 42
    let ref y = x
    x = y + 1 // x == 43, y == 43 
    await true
end
```

This would be a strange behaviour in Blech, when reasoning about this program. Especially since `y` is a read-only reference, but changes its value via the assignment. Rust forbids this by the borrow checker.

```rust
fn main() {
    let mut x: i32 = 42;
    let y: &i32 = &x;
    x = *y + 1;
    println!("x:{}, y:{}", x, y);
}
```

```txt
error[E0506]: cannot assign to `x` because it is borrowed
 --> src/main.rs:4:5
  |
3 |     let y: &i32 = &x;
  |                   -- borrow of `x` occurs here
4 |     x = *y + 1;
  |     ^^^^^^^^^^ assignment to borrowed `x` occurs here
5 |     println!("x:{}, y:{}", x, y);
  |                               - borrow later used here
```
In Rust you cannot use `x` after it has been non-mutably borrowed to `y`.

We propose to adopt the ideas of borrowing from Rust to Blech, in order to benefit from the guarantees the borrow checker gives for your program.


## Behaviour of the borrow checker

A good overview of how borrowing restricts the usage of variables and references can be found in a [Graphical depiction of ownership and borrowing in Rust](https://rufflewind.com/2017-02-15/rust-move-copy-borrow#comments).

Move semantics can be neglected for the moment since currently only have value types which all allow copying, which in Rust terminology means, they implement the copy trait. Nevertheless move semantics might become important for Blech's planned reference types.

For borrowing it distinguishes between *frozen* and *locked* behaviour.

Mutable borrowing, *locks* the original object for the duration of the borrow, rendering it unusable.

Non-mutable borrowing *freezes* the original object, you can still take more non-mutable references, but you cannot move or take mutable references of it.


### Non-mutable borrow *freezes* original object

```blech
activity main()
    var s: int32 = 42
    do
        let ref r = s  // ok, s is now frozen
        cobegin
            // can non-mutably borrow from r 
            let ref a = r  // ok 
            ...
        with
            // can still &s
            let ref b = s  // ok
            ...
        with
            // cannot &mut s
            var ref c = s // not ok, similar to first example, could read s via r, and write s via c
            ...
        with
            // cannot move s
            // not applicable because s has a value type
            ...
        end
    end
    // all borrows terminated    
    s = s + 1 
    await true
end
```

### Mutable borrow *locks* original object

```blech
activity main()
    var s: int32 = 42
    do
        var ref m = s  // ok, s is locked
        cobegin 
            // can move m
            var ref a = move m // ok, cannot use m anymore, will be discussed later
            ...
        with
            // can downgrade m to read-only
            let ref b = m  // ok, m is now frozen
            ...
        with
            // can borrow mutably from m
            var ref c = m  // ok, m is locked from here
        with
            // cannot copy m
            // not applicable, references are taken and de-referenced implicitly
            ...
        with
            // cannot use s at all, s is locked
            let ref d = s  // not ok
            var ref e = s  // not ok
            let e = s      // not ok
            var e = s      // not ok
            ...
        end
    end
    // all borrows terminated    
    s = s + 1 
    await true
end
```

As shown before, passing parameters can be explained as borrowing

* Passing a parameter to an output list essentially is a borrowing as mutable reference.
* Passing an input parameter in an activity essentially is borrowing as a non-mutable reference. 

As shown here, taking references in various forms can also be explained as borrowing.

Borrowing has a sequential ordering along the program text.
This could be used to enable multiple concurrent writers for specific memory cells.

## Borrowing for sequential parallel writes

The merely theorectical "sequential-parallel-or" operator is dangerous, because it switches off causality analysis completely, for all accesses to memory cells.

Therefore we propose to enable sequential parallel writes for indivual memory locations.
We could use the sequential ordering of borrowing for this.

```blech
...
    var original: int32
    cobegin
        run controlValue()(original)
    with
        var ref updated = original // mutable borrow
        run updateValue()(updated)
    end
    ...
```

What is the semantics?

In every step the activity `controlValue` writes to `original`. We can understand borrowing as a sequential chaining. In every step of the second thread `updated` borrows `original`, which in turn is updated in every step. `original` is locked here and cannot be used. The borrowing defines a sequential write order.  
We can regard both blocks of the `cobegin` as partially sequentialised.


The borrowing `var ref update = original` defines an "update `original` from `updated` edge" for causality analysis. Every writeable location must not have more than 1 incoming update edge. 

Without references and borrowing we need local variables to sequentialise the write accesses in `controlValue` and `updateValue`.
```blech
...
    var original: int32
    var local: int32
    var updated = original
    cobegin
        run controlValue(prev updated)(local)
    with
        run updateValue(local)(updated)
    with 
        repeat
            original = updated
            await true
        end
    end
    ...
```
This solution, which is perfectly correct in the current compiler, is adopted from the [Blech blinker example](https://github.com/frameworklabs/blinker/blob/master/src/blinker.blc).

Compared to the first version the second needs 2 additional memory locations, additional parameters to enable the data flow, a loop that copies the result back to `original` in every step, and additionally `controlValue` and `updateValue` need to copy from input to output in every step. As usual the order of `cobegin` blocks is irrelevant.

The version with references and borrowing can reuse the `original` memory location based on the statically defined sequential order and needs no additional copying loops.

Now, what happens if both threads borrow `original`?

```blech
...
    var original: int32
    cobegin
        var ref controlled = original // mutable borrow
        run controlValue()(original)
    with
        var ref updated = original    // mutable borrow
        run updateValue()(updated)
    end
    ...
```

The location `original` has now 2 incoming update edges from `controlled` and `updated` which is essentially a write-write conflict in causality analysis.


The 'trick' of the sequentialisation is scoping of borrowing. If we need 3 concurrent threads that write to the `original` memory location, we need to scope borrowing, which nicely shows the sequentialisation.

```blech
...
    var original: int32
    cobegin 
        run initialiseValue()(original)
    with
        var ref controlled = original // mutable borrow
        cobegin
            run controlValue()(controlled)
        with
            var ref updated = controlled // mutable borrow
            run updateValue()(updated)
        end
    end
    ...
```
We have update egdes from  `updated` to `controlled` and from `controlled` to `original`.

To make things more interesting we can mix-in causal concurrency.

```blech
...
    var original: int32
    var a: int32
    var b: int32
    cobegin
        run controlValue(a)(b, original)
    with
        var ref updated = original
        run updateValue(b)(a, updated)
    end
    ...
```
Here we get a cyclic write-read path on `a` and `b`. We can use `prev` to break this cycle. Since `original` must be written before `updated`, this only helps if we apply `prev` to the input of activity `controlValue`.

```blech
...
    var original: int32
    var a: int32
    var b: int32
    cobegin
        run controlValue(prev a)(b, original)
    with
        var ref updated = original // mutable borrowing
        run updateValue(b)(a, updated)
    end
    ...
```

Note: Non-mutable borrowing does not imply additional causal constraints. It is simply write before read. But it helps clarifying the program semantics as explained in the introduction.


## Dismiss `shares`

Blech currently proposes to use a `shares` if this an intended behaviour. 
We think this is no longer necessary with borrowing and causality.


## Todo
### Borrow spitting

[Spitting borrows]https://doc.rust-lang.org/nomicon/borrow-splitting.html

Similar to splitting causality analysis. Ok for structs, not possible for arrays.

Rules for borrow checker like in Rust.


### The `move` operator

[What are move semantics in Rust?](https://stackoverflow.com/questions/30288782/what-are-move-semantics-in-rust)

Move should be handled and clarified separately. It is related to reference types.

### Splitting borrows and partial moves
