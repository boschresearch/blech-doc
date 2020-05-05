---
title: "Borrowing for references"
linkTitle: "Borrowing"
weight: 20
description: >
    Adopt the ideas of borrowing in Rust to Blech
---

# Borrowing 

The solution to the [problems with references](../10_references/#the-problem-with-references) is **Borrowing analysis**.

## Borrowing in Rust

A Rust program very similar to the introductory example (../10_references/#parameters-are-references)
looks like the following

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

Function `outIsInPlus1` gets a read-only (immutable) reference `a` and a read-write (mutable) reference `b`. 

Rust does not allow this call to `outIsInPlus1`.
The so-called borrow checker detects an error.

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

Rust does not allow to borrow a mutable and an immutable reference to a memory location in the same scope.

In Blech this test is currently implemented as part of the causality analysis.

## Behaviour of the Rust borrow checker

A good overview of how borrowing restricts the usage of variables and references can be found in a [Graphical depiction of ownership and borrowing in Rust](https://rufflewind.com/2017-02-15/rust-move-copy-borrow#comments).

Move semantics can be neglected for the moment because it deals with memory management of heap allocated data. 
Currently Blech does not dynamically allocate heap data for safety and real-time reasons.

For borrowing it distinguishes between *frozen* and *locked* behaviour.

Mutable borrowing, *locks* the original object for the duration of the borrow, rendering it unusable.

Non-mutable borrowing *freezes* the original object, you can still take more non-mutable references, but you cannot move or take mutable references of it.


## Borrowing in Blech 

If we adopt borrow semantics in Blech, the compiler would reject the program, which has been discussed as problematic.

```blech
var i: int32

let ref a = i
var ref b = i

b = 1
b = a + b
```

The analog program in Rust

```rust
fn main() {
    let mut i: i32 = 42;
    
    let a = &i;
    let b = &mut i;
    
    *b = 1;
    *b = *a + *b;
}
```
cannot be compiled due to a borrowing error

```
error[E0502]: cannot borrow `i` as mutable because it is also borrowed as immutable
 --> src/main.rs:5:13
  |
4 |     let a = &i;
  |             -- immutable borrow occurs here
5 |     let b = &mut i;
  |             ^^^^^^ mutable borrow occurs here
...
8 |     *b = *a + *b;
  |          -- immutable borrow later used here
```

For Blech we should also implemented a borrowing check.

## Intuitive behaviour of the borrow checker.

Borrow checking restricts the use borrowed references inside the same scope.

The scope is either a statement scope or the entrance of a subprogram.

In the same scope we can either 
1. take several `let ref`s or 
2. one `var ref`

to a memory location.

In both cases the original name for the memory location is no longer accessible.
If we switch to a separate scope we can take a mutable and after that an immutable borrowing. 
The reason is, that the borrow reference name is no longer visible if the scope is left.

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

## Parameter passing is borrowing too

Passing parameters is also borrowing in a new scope.
All parameters are regarded borrows in the scope of the subprogram.

Therefore the following Blech code would also be rejected by a borrow checker.

The call takes a `let ref` (immutable) borrow and a `var ref` (mutable) borrow at the same time.

```blech
    var i: int32
    outIsInPlus1(i)(i)
```

In order to correct this we need an additional memory location, 

```blech
    var i: int32
    let j = i  // read-only j gets value from i
    outIsInPlus1(j)(i)
```

The implementor of function `outIsInPlus1` can assume that the actual parameters never overlap in their memory location.

This check - which currently is implemented in the causality analysis - can be moved to a borrow checker, which would simplify the causality analysis.

