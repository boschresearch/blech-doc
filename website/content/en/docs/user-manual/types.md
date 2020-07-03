---
title: "Types"
linkTitle: "Types"
weight: 50
description: >

---

A _type_ defines a _domain_ -- a set of _values_ -- a _representation_ for those values and a set of _operations_ on those values.

Often the domains overlap between types.
Also operations may be overloaded for multiple types.
This provides the programmer with some versatility:

For example, signed integers and unsigned integers share some interval in which calculations may be carried out and interpreted as either one.
Another example is that operations such as addition may have different implementations depending on type (and machine architecture): addition of 16-bit unsigned integers on a 16-bit machine invokes a different set of machine instructions than addition of 32-bit unsigned integers on that same machine.
Yet the same symbol `+` denotes both computations in program text.
The same operator also covers additions of numbers for a completely different domain such as floats.

This versatility comes at a price: the programmer has to pay attention to value ranges, make representation changes explicit and make sure that a unique implementation of an operation (such as `+`) can be selected by the compiler.

Blech is a type safe language which assists the programmer with a powerful type checker that prevents most type related errors at compile time.
It enforces type annotations and explicit casts whenever the type of an expression is not obvious or when a representation needs to be changed before the expression fits the context of an operation.

The following sections precisely describe which types exist, what their domains and representations are, which operations they define and which types may be combined or transformed into one another.

## Boolean type

Blech distinguishes a `bool` type with two values: `true` and `false`.
Boolean values may be combined using the binary `and` and `or` operators.
A Boolean value is inverted by the unary `not` operator.
All comparisons are admissible.
Expressions which evaluate to a Boolean value are called _conditions_.

In Blech, it is required that conditions that determine the control flow must be side-effect free.
For example, the statements `await`, `abort`, `reset`, `repeat..until`, `while`, `if` all require side-effect free conditions.
The reason is that the evaluation of a condition should not change the program's state.
It would contradict the synchronous semantics if a program's state changed although no reaction was performed in case an `await` condition evaluated to `false`.
The same reasoning applies to other synchronous control flow statements such as `abort` and `reset`.
Other imperative control flow statements such as loops or the `if` statement follow the same logic for consistency and clarity of the program text.

## Integer types

Integer types are divided into three categories: natural numbers, signed integer numbers and "bits".
Each one exist in four sizes that indicate the number of bits needed in a machine to represent a value of this type: 8, 16, 32, 64.

| Integer types |
| -- | -- |
| `nat8`, `nat16`, `nat32`, `nat64` | Natural numbers |
| `int8`, `int16`, `int32`, `int64` | Signed integer numbers |
| `bits8`, `bits16`, `bits32`, `bits64` | Bits |

The distinction of three integral types has the following motivation.
As usual, we would like to distinguish non-negative numbers of the length `N` with a range of `0` to `2^N -1` from integer numbers centred around 0 with a range of `2^(N-1)` to `2^(N-1) -1`.
However, by design, the operations on both kinds of numbers prohibit overflows.
Computations must stay within the representable domain. 
*In a future implementation an overflow either causes the program to crash or to mitigate it using saturation arithmetic depending on the build mode.*
In order to allow writing algorithms that do rely on overflowing non-negative integers as in C, as well as bit-masking and bit-shifting the `bitsX` type is introduced.
The bits types of length `N` have the same value range as the natural numbers of the same length.

It is possible to cast between all three types without information loss so long as the size remains unchanged.

All integral types types admit all arithmetic and comparison operators.
The `bitsX` types additionally admit bitwise operations.

## Floating-point types
Blech provides the two most commonly used floating point types `float32` and `float64`.
The language assumes an implementation of these according to IEEE standards.
In the generated code they are mapped to C's `float` and `double` respectively (see section on [blechconf.h](#blechconfh) below).

Note that the C standard does not guarantee an IEEE compliant implementation of its floating point types nor does it require that `float` and `double` are distinct types at all.
It is the system integrators responsibility to ensure that the C compiler at hand does fulfil Blech's assumptions.

Floating point types admit all arithmetic and comparison operators.

## Array types
The array data type is parametrised by a fixed "shape" and a payload data type.
The shape of an array is its dimensionality and length in each dimension.
It is not possible to declare an array data type with an unspecified length.

### Arrays

```blech
function f(a: [4][5]float32)
    /* ... */
end
```

The function `f` expects one read-only argument `a`.
It is a two dimensional array (a table) with 4 rows and 5 columns.
Each cell contains a `float32` number.

Unlike C, in Blech the lengths appear before the payload type in the type declaration.

Elements of an array are accessed using a subscription operation `[]`.
The first element has index `0`.
If an array dimension has `N` values, the last index is `N-1`.
The index argument must be an integer number within array bounds.

The contents of one array may be copied to another using assignment provided their shape and payload data type are the same.

### Array operations

```blech
// Initialise the following matrix
//      cols
// rows 0.0  0.0
//      1.2  3.4
//      0.0  0.0
var a: [3][2]float32 = {[1]={1.2, 3.4}}

let r: [2]float32 = a[1] // copy 2nd row of a into r

let x = a[1][1]          // copy 3.4 to x
                         // x is deduced to have type float32
```

## Structure types

Structure declarations introduce a new type identifier.
A structure contains a fixed number of _fields_.
Each field has an access capability (`let` or `var`), a name, some data type and possibly a default value initialiser.

```abnf
StructDeclaration ::= "struct" Identifier Field+ "end"
Field            ::= ("var" | "let") Identifier ":" Type ["=" Expr]
```

If an initialiser is given for a field this value is taken as the default value when constructing an instance of this structure.
The initialisation expression must be a compile time value.
Of course, this default value may be overruled by the initialiser given at the instantiation.

### Mutable and immutable structures

```blech
struct S
   var a: int32 = 7
   var b: int32
end

/* ... somewhere in a local scope ... */
var s1: S    // s1 == {a = 7, b = 0}
s1.b = 17    // ok, now s1 == {a = 7, b = 17}
s1.a = 42    // ok, now s1 == {a = 42, b = 17}
s1 = {}      // ok, reset to default, now s1 == {a = 7, b = 0}

let s2: S = {a = -10, b = 10} // s2 == {a = -10, b = 10}
s2.b = 17                     // error! Cannot change the let variable s2
```

Structure `s1` is declared using a `var` access qualifier.
The fields may be overwritten as well as the structure as a whole.
By contrast, `s2` is declared using `let`.
It cannot be changed after initialisation.

The above example illustrates all operations available on structures.
The dot `.` is used to access a field value inside a structure.
If the value of a field again is a structure it may be further "dotted into".
Structures may be assigned using a struct literal or a name of another struct of the same data type.
Assigning the empty literal `{}` means that all default values are restored.

`let` fields cannot be changed once the structure is instantiated.
Assignment on structures as a whole is only permitted if all (sub-)field have `var` access qualifiers (and the struct itself has been declared using `var`).

### Immutable fields in structures

```blech
struct T
    let a: int32
    var b: int32
end

struct S
    var x: T
    var y: int32
end

/* usage in local scope */
var s: S = {x.a = 7} // ok, s == {x = {a = 7, b = 0}, y = 0}
s.x.b = 42           // ok, s == {x = {a = 7, b = 42}, y = 0}
s = {}               // error! s contains immutable fields
```

Assignments to the struct `s` are prohibited because `s.x.a` is immutable.
You need to individually specify which fields you want to update.
It may be helpful to implement a helper function for this specific data type as shown below.

```blech
function resetS()(s: S)
    s.x.b = 0
    s.y = 0
end

/* usage in local scope */
var s: S
/* ... */
resetS()(s)
```

## blechconf.h

Blech compiles to C.
Hence code generation has to map Blech types to C types.
The file `blechconf.h` specifies this mapping.
It is automatically included (via `blech.h`) in every generated C source file.
The Blech compiler guarantees type safety and correct operational behaviour so long as Blech types are mapped onto C types that fit above representation sizes.
It is up to the system integrator to ensure that this mapping is valid for the C compiler and hardware platform at hand.

A default mapping that makes sense in most cases is shipped with the compiler:

```c
#define BLC_VOID void 
#define BLC_BOOL int 

#define BLC_INT8 signed char
#define BLC_INT16 signed short
#define BLC_INT32 signed long
#define BLC_INT64 signed long long

#define BLC_UINT8 unsigned char
#define BLC_UINT16 unsigned short
#define BLC_UINT32 unsigned long
#define BLC_UINT64 unsigned long long

#define BLC_BITS8 unsigned char
#define BLC_BITS16 unsigned short
#define BLC_BITS32 unsigned long
#define BLC_BITS64 unsigned long long

#define BLC_FLOAT32 float
#define BLC_FLOAT64 double
```

However compilers before the C99 standard may not support `unsigned long long`, for example.

