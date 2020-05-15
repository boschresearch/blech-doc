## Aggregated types

### Arrays

Arrays are built-in generic aggregates types, that require statically known size of type `usize` and an element type.

An array instance is a value-type if its element type is a value-type.
An array instance is a reference-type if its element type is a reference-type.

A `let`-bound array is read-only, i.e. its elements are read-only.
A `var`-bound arras is read-write, i.e. its elements are read-write.

The static size of an array can be requested by the length operator `#`

```blech
ref struct Point
    var x: float32
    var y: float32
end

var ints: [4]int32   // a value type
var points: [5]Point = {p1, p2, p3, p4, p5}  // a reference type

let config: [3]int32 = {2, 4, 8}
let fixedLine: [2]Point = { 
    {x = 0.0, y = 0.0}, 
    {x = 10.0, y = 25.0}
}
```

Arrays have default initialisers, as used above.

```blech
typealias Line
    [2]Point
end

function length(line: Line) returns float32
    let a = line[0]
    let b = line[1] 
    return Float.sqrt( (b.x - a.x)^2 + (b.y - a.y)^2 )
end
```

### Sequences

Sequences essentially wrap fixed-size arrays.

They are reference-types, represented by a dynamically known length, a pointer into a fixed-size array, and a dynamically known capacity.

Sequences allow for generic functions that work on arrays with arbitrary length and fixed element type.

Sequences are initialized from fixed-size arrays by the built-in slicing initializer `[,]`, which creates an r-value for use as an initializer or an r-value reference.

Indexing a sequence automatically indexes the underlying fixed-size array.
The dynamic length can be extracted by the length operator `#`.
The maximum size (capacity) can be determined by the capacity operator `##`.

```blech
function sum(seq: []int32) returns int32
    var sum: int32
    for let i: usize = 0, #seq - 1 do
        sum = sum + seq[i]
    end
    return sum
end

function fill()(seq: []int32)
    for let i: usize = 0, #seq - 1 do
        seq[i] = seq[i] * 2
    end

do
    var fixed: [10]int32
    var variable: []int32 = []fixed
    let constant = []fixed

    let s1 = sum([5]fixed) // r-value reference, creates a temporary object
    let s2 = sum(variable)
    let s3 = sum(constant)
    let s4 = sum(fixed)     // error, fixed is not a variable size array


    fill()([]fixed)         // error: []fixed is an l-value
    fill()(variable)        // ok
    fill()(constant)        // error constant is read-only

    let i1 = fixed[7]       // ok, static size check
    let i2 = ([]fixed)[7]   // error: []fixed is an l-value, this also syntatically not possible
    let i3 = variable[7]    // ok, dynamic size check
    let i4 = constant[7]    // ok, dynamic size check
    
    fixed[7] = 77           // ok, static size check
    variable[7] = 77        // ok, dynamic size check
    constant[7] = 77        // type error, constant is read-only

    let l1: usize = #fixed
    let l2: usize = #variable
    let l3: usize = #constant
end
```

### Operations

Inspired by Lua's [table manipulation package](https://www.lua.org/manual/5.3/manual.html#6.6)
and Go's [generic slice operations](https://blog.golang.org/go-slices-usage-and-internals) 


```blech
module Sequence

ref type Sequence{T}

function insert {T : type} (pos: usize, value: T) (seq: Sequence{T})
function remove {T : type} (pos: usize) (seq: Sequence{T}) returns T
```


### Initialisers

Arrays are initialised with array literals
```blech
do
    var buffer: [5]int32 = {0, 1, 2, 3, 4}  // complete array initialization
    var buffer: [5]int32 = {[2] = 3}    // partially specified initialization
    var buffer: [5]int32 = {1, 2, [4]=4}

    var from: Point = {x = 0.0, y = 0.0}
    var to: Point = {x = 5.0, y = 1.0}
    var line: [2] ref Point = {from, to}
    var line: [2] ref Point = {[1] = to}  // error reference line[0] undefined
end
```

Fields can be initialised selectively. There are no uninitialised fields. For value types, non-specified fields are initialised with the value type's default value by the compiler. For arrays of a reference type assignment is not allowed. Non-specified `ref` fields are not allowed.

Sequences are initialised from arrays or from other sequences
```blech
do
    var buffer: [5]int32
    var seq: []int32 = [0, 5]buffer   // first buffer[0], length 5, capacity 5
    var otherSeq: []int32 = [2, 2]seq // first seq[2], length 2, capacity 3 
end
```
`seq` and `otherseq` share the same underlying array `buffer`.

### Safe code

The default behaviour for safe array/sequence access is abandonment in debug code and and saturation at array/sequence boundaries in release code. If the array index is a compile time constant the compiler detects an index out of bounds error.

```blech
var a:[4]int32 = {0, 1, 2, 3}

do
    let v = a[i]   // v == a[0] if i < 0, v == a[3] if i >= #a
    let v2 = a[4]  // type error, index out of bounds
end
```

Since this safe behaviour is not suitable for any application, we introduce a second index operator `array[index]?` that throws. Safe access to the value then needs a try expression

``` blech
let try10 = try array[10]? else array[3]  // the else case is safe!
```

Saturation may be defined as follows:
buffer[index]  returns the indexed value or a "saturation" value

```blech
x = buffer[index]

let tmp_index = index
if tmp_index < 0 then 
    x = buffer[0]
elseif tmp_index >= #buffer then
    x = buffer[#buffer-1]
else
    x = buffer[tmp_index]
end
```

Instead of saturating the index, recoverable indexing throws


Assignment to an index out of bound, should be discarded.

```blech
buffer[x] = expression

let tmp_expr = expression
let tmp_x = x
if tmp_x >= 0 and tmp_x < #buffer then
    buffer[x] = tmp_expr
end
```

Throwing variants of indexing work as follows.

```blech
x = buffer[index]?

let tmp_index = index
if tmp_index >= 0 and tmp_index < #buffer then 
    x = buffer[tmp_index]
else
    throw
end
```

```blech
buffer[x]? = expression

let tmp_expr = expression
let tmp_x = x
if tmp_x >= 0 and tmp_x < #buffer then
    buffer[x] = tmp_expr
else
    throw
end
```
