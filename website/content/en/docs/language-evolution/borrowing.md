---
title: "Borrowing"
linkTitle: "Borrowing"
weight: 2
description: >
    Adopt the ideas of borrowing in Rust to Blech
---

## Borrowing in Rust and Blech

Blech

```blech
function outIsInPlus1 (a: int32)(b: int32)
    b = 1
    b = a + b 
end

activity main()
    var i = 42: int32
    incr(i)(i) // --> 43
    await true
end
```

A similar program in Rust.

```rust
fn outIsInPlus1(a: i32, b: &mut i32) {
    *b = a + 1;
}

fn main() {}
    let mut i = 42;
    outIsInPlus1(i, &mut i);
    println!("{}", i);  // --> 43
}
```
No problem with this. Because the input parameter `a` has value/copy semantics.

Blech automatically takes references and de-references them if necessary. It decides on mutability through the occurence in the input or output parameter list. Semantically the Blech program has the following form:

```blech
function outIsInPlus1(<let> a: int32)(<var ref> b: int32)
    <*> b = 1
    <*> b = <*> a + <*> b 
end

activity main()
    var i = 42: int32
    outIsInPlus1(i)(<&> i) // --> 43
    await true
end
```

This is semantically very close to Rust.

We would change the function in Blech if the input `a` should be passed by reference.
Note that references are not implemented in the current compiler.

```blech
function outIsInPlus1(ref a: int32)(b: int32)
    b = 1       // b = 1
    b = a + b   // b = 1 + a
end

activity main()
    var i = 42: int32
    outIsInPlus1(i)(i) // --> 2
    await true
end
```

The value of output `i` becomes `2`, which is not input `i` plus `1`. For functions in Blech this could be allowed, because they do not contain `cobegin`, but it is dangerous and unexpected, especially at the caller side, where you can't see this behaviour by reading the code.

Rust does not allow this call. The borrow checker detects an error.
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

This behavior is similar to the use of parameters in Blech activities. Blech does not allow the following `run outIsInPlus1(i)(i)` statement. The causality checker detects an error.

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

  If this usage is intended, consider using the "shares" keyword when declaring the formal parameters of the subprogram.
```

Blech automatically takes refencences and de-references if necessary. It decides on mutability through the occurence in the input or output parameter list. Input parameters in Blech are semantically passed by-value for functions and passed by-reference for activities. 
Therefore the activity `outIsInPlus1` has semantically the following form:

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
Actually the above causality error is almost equivalent to Rust's borrowing error.

We would argue, that the above function with an input parameter passed by-reference should be marked as an error if called with identical references.

```blech
function outIsInPlus1(ref a: int32)(b: int32)
...
    var i = 42: int32
    outIsInPlus1(i)(i)  // causality error or borrowing error
...
```

If we have more uses for borrowing and a **borrowing checker** this could become a **borrowing error** instead of a causality error.

## Borrowing

Passing parameters by-reference is essentially borrowing a reference.

There are several combinations

| Blech | Semantics | Blech call | Call semantics |
| --- | --- | --- | --- |
| function f (a: T) | function f (let a: T) | f(x) | f(x) |
| function f (ref a: T) | function f (let ref a: T) | f(x) | f(&x) |
| function f ()(b: T) | function f ()(var ref b: T) | f()(x) | f()(&x) |
| activity a (a: T) | activity a (let ref a: T) | run a(x) | run a(&x) |
| activity a ()(b: T) | activity a ()(var ref b: T) | run a()(x) | run a()(&x) |

In case of an input parameter it is a non-mutable borrowing. In case of an output parameter it a mutable borrowing.

## Borrowing via reference declarations

Borrowing not only occurs when passing parameters, but also when declaring references.
We also planned this for Blech.

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

Move semantics can be neglected for the moment since currently only have value types which all allow copying, which in Rust terminology means, they implement the copy trait. Nevertheless move semantics might become important in for Blech's planned reference types.

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
* Passing an input parameter to a function is copying.
* Passing an input parameter to a formal reference parameter is borrowing.

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

Of course we can switch the blocks with the same semantics.

```blech
...
    var original: int32
    cobegin
        var ref updated = original // mutable borrow, original is locked
        run updateValue()(updated)
    with
        run controlValue()(original)
    end
    ...
```

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
We think this is no longer necessary with borrowing, causality and passing inputs to functions by-reference and by-value.


## Todo
### Borrow spitting

[Spitting borrows]https://doc.rust-lang.org/nomicon/borrow-splitting.html

Similar to splitting causality analysis. Ok for structs, not possible for arrays.

Rules for borrow checker like in Rust.


### The `move` operator

[What are move semantics in Rust?](https://stackoverflow.com/questions/30288782/what-are-move-semantics-in-rust)

Move should be handled and clarified separately. It is related to reference types.

### Splitting borrows and partial moves
