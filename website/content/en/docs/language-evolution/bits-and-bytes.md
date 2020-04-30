---
title: "Bits and bytes"
linkTitle: "Bits and bytes"
weight: 20
description: >
    The `bitsN` datatype and bitwise operations.
---

## Bits and bytes

Some notes on [C's integers](https://blog.feabhas.com/2014/10/vulnerabilities-in-c-when-integers-go-bad/)

### Rename the exponentiation operator `^`

The exponention operator `^` should be renamed to `**` - maybe right associative.

Maybe it would be better to deprecate the exponentiation operator completely.
A good argument for this change is given by the [C# FAQ](https://devblogs.microsoft.com/csharpfaq/why-doesnt-c-have-a-power-operator/)

With this change `^` becomes available for the standard bitwise XOR (exclusive or) operation.

### Rename `uint` to `nat`

Inspiration [Motoko](https://sdk.dfinity.org/language-guide/index.html)

Reason: `uint` is not allowed to overflow and saturates in release code or panics in debug code.
The name `uint` addresses the wrong association.
Therefore we should rename `uint` to `nat`

NOTE: Maybe we should rename `bitsN` to `wordN`. 
Those types occur only in 4 different sizes. 
The name `bits` might be associated with an arbitrary number.
Additional inspiration, a [word](https://whatis.techtarget.com/definition/word) is a unit of data of a defined bit length.
Therefore we should rename `bits` to `word`.


### Allow a type annotation `:<type>` for expressions 

It is mainly needed for literals.
It is consistent with type annotation in declarations.

IMPORTANT: This is not a cast or a conversion, but only a type annotation, to give literals different meanings.

### Eliminate `floatLiteral32` 

Instead of using the specific `floatLiteral32` we should use a type annotation.
With a type annotation any number literal can be used as a checked float literal.
This especially simplifies generic code.
Type annotation are anyway needed for binary, octal and hexadecimal literals.

By default a floatLiteral and hexFloatLiteral are of type `float64`.

NOTE: Check that hexfloat literals are precise representations for their type.
NOTE: Maybe the default should be `float32` for embedded systems?

Any `natLiteral` can be annotated with a float type.
The range is checked, to get a precise float representation.

The following are all valid float literals.

```blech

(42: float64)
(42: float32)

(-17: float32)
(-1.2: float32)

42.0 // has type float64
(42.0: float32)
```

### Bit types

Bit types allow bitwise, relational, and arithmetic operators.
Arithmetic operators wrap-around.

Different to `nat` types which must not over- or underflow.

### Bitwise operators

Blech provides the standard set of [bitwise operators known from C](https://en.wikipedia.org/wiki/Bitwise_operations_in_C).
Different to C these operators work on `bitsN` types instead of unsigned `natN` or signed `intN` types.

#### Unary bitwise operator

For N = 8, 16, 32, 64

Bitwise negation: `~`
Type: `function (bitsN) returns bitsN`

#### Binary bitwise operators

More info on [bitwise operations](https://en.wikipedia.org/wiki/Bitwise_operation).

For N = 8, 16, 32, 64

Bitwise and: `&`
Bitwise or: `|`
Bitwise xor: `^`

Type: `function (bitsN , bitsN) returns bitsN`

#### Shift and rotate operators

Standard shift operators

shift left: `<<`
shift right: `>>`

Type: `function (bitsN, AnyNat) returns bitsN`

Additionally Blech should provide advanced shift operators

Arithmetic shift right: `+>>`
left rotate: `<<>`
right rotate: `<>>`

Type: `function (bitsN, AnyNat) returns bitsN`

These operators can be defined as Macros. 
If the macro has a suitable form, C compilers can translate circular shifts into one machine instruction.
C compilers recognize the [circular shift idiom](https://en.wikipedia.org/wiki/Circular_shift#Implementing_circular_shifts).

The shift and rotate amount is a general unsigned integer type. 
It is considered modulo the `bitsN` width `N`.

#### Arithmetic operators

As arithmetic types, `bitsN` types implement numeric wrap-around (modulo `2**N`).


#### Implicit conversion

[Implicit conversion in C](https://www.guru99.com/c-type-casting.html) is complicated.

Implicit conversion is only allowed if no representation change is necessary.

- `int8` -> `int16` -> `int32` -> `int64`
- `float32` -> `float64`
- `nat8` -> `nat16` -> `nat32` -> `nat64`
- `bits8` -> `bits16` -> `bits32` -> `bits64`

IMPORTANT: The representation of `char` is still not decided

#### Safe conversion using `as`

Conversion using the operator `as` can be used for values.
That means: 

- for right-hand side values
- for function input parameters
- for activity input parameters of simple type: `intN`, `natN`, `bitsN`, `floatN`, `char`

Conversion with representation change is only allowed if no information is lost (has the same bit-size).


#### No subtyping for `bitsN` types

Whenever <exp> has type T and T <: U (T subtypes U) then by virture of implicit subsumption, <exp> also has type U (without extra syntax).

In general, this means that an expression of a more specific type may appear wherever an expression of a more general type is expected, provided the specific and general types are related by subtyping.

`bitsN` types are in no subtype relation with each other.

`bitsN` types are in no subtype relation with other arithmetic types.

### Literals

Binary, octal and hexadecimal literals have type `AnyBits`.
Decimal literals have type `AnyInteger`.

All literals of type `AnyBits` need a type annotation in order to become an appropriate `bitsN` type.

A type annotation can be ommited if an assignment determines the type.

For negative values of type `AnyInteger` the two's-complement representation is used to create the bits.

IMPORTANT: The two's-complement representation for `intN` is not mandatory in C.

```blech
let b1: bits8 = 0x1
let b2 = 0x1 : bits8
let b3 = (0x1 : bits8) << 2  // 0x4 as bits8
let b32 = 0x1A4: bits8   // type error not representable in bits8
let b4: bits8 = 255
let b5 = 255 : bits8 
let b6: bits8 = -129   // type error, no representable as 2-complement in bits8
let b7 = -128: bits8   // ok
let b8 = (-50 - 150): bits8 // compile time error, not representable as 2-complement in bits8
```


### Use of operations

Bitwise operatorions and arithmetic operations cannot be applied to values of type `AnyBits`.
Bitwise and arithmetic operations can only be applied to values of type `bitsN`, that means the size has to be fixed before any operation.


```blech
let x: bits8 = -0x1 // type error size of `0x1` not known, for a suitable unary minus.
let x = -(0x1: bits8) // ok, is (0xFF: bits8), by wrap around.
```


### Hacker's Delight translated to Blech

[Hacker's Delight](https://en.wikipedia.org/wiki/Hacker%27s_Delight) is the definitive source of bitwise programming algorithms. 
It should be possible to use these hacks in Blech.

Turn off the rightmost 1-bit in a byte, producing 0 if none (e.g. 0b_0101_1000 => 0b_0101_0000, 0x_00 => 0x_00).

```blech
var x: bits8
x = x & (x - (1: bits8))
// or
x = x & (x - 0x_01)
```

Turn on the rightmost 0-bit in a word, producing all 1's if none (e.g. 0x7AF3 => 0x7AF4, 0xFFFF => 0xFFFF).

```blech
var x: bits32
x = x | (x + (1: bits32))
// or
x = x | (x + 0b_1)
```

