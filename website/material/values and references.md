
# Values and References in Blech

## Value types

### Built-in value types
The built-in simple types are *value types*.

The classification is as follows:
1. Arithmetic types
    * Signed integer types `int8, int16, int32, int64`
    * Unsigned integer types `uint8, uint16, uint32, uint64`
    * Floating-point types `float32, float64`
    * Machine dependent unsigned integer type `usize`

   `usize` is hardware dependent, but can be defined smaller for your platform, e.g. `uint8`.

2. Bit vector types `bits8, bits16, bits32, bits64` 
    <!-- change this in lexer
         idea: allow arbitrary length, also for integers -->

3. The boolean type `bool`

### User-defined value types
The user-defined types built into Blech can also be used as *value types*

These are:
1. Enumerated types

    Enumerated types are always value types.

    For enumerated types are representation can be chosen, which must be one of the simple types above. 
    The default representation type is `usize`. 
    The default `default` is the first case. 

    ```blech
    // see: https://en.wikipedia.org/wiki/8-bit_color
    enum color: bits8
        red   = 0b_111_000_00
        green = 0b_000_111_00
        blue  = 0b_000_000_11
        black = 0b_000_000_00 default
    end

    enum state       // : usize
        one          // = 0 default
        two          // = 1  
        three        // = 2
    end
    ```
    <!-- change the position of default for better readability -->

2. Structural types
    
    Structural types are value types if all named components are value types.
    
    The classification of named components with `var` and `let` is new to get rid of `reftype`.

    ```blech
    struct Pair
        var fst: int32
        var snd: int32
    end
    ```

Structural types are called also called *aggregated* types

### Built-in array value types

Arrays are built-in generic aggregated types.
An array type is a value type, if the element type is also a value type.
Arrays have a statically known length.

```blech
typealias Int8Buffer = [4]int8
typealias SensorValueBuffer = [3]sensorValue
```
Hint: With array alone it is not possible to write functions that work with arbitrary length arrays. We will introduce additional built-in types for this purpose later.

### Naming convention

'Small' types - up to 4 bytes - are written in camel case (lower camel case).
'Big' types are written in pascal case (upper camel case).
See [Camel case](https://en.wikipedia.org/wiki/Camel_case).

## Using value types

### Variable Declarations

Variable declarations for value-types allocate memory of the size of the value type.

`var` qualified declarations are read-write. 
User initialization is optional. 
The compiler generates a default initialization.

`let` qualified declarations are read-only.
User initialization is mandatory.

```blech
var x: int32     // var x: int32 = 0 
var c: color     // var c = color.black       
var c2 = .red    // var c2: color = color.red
let red: color = .red //   
let fortyTwo: uint8 = 42
var ib: [4]int8
```
### Initialization

Initializers for aggregated types are generated to code that populates a location.
Depending on the usage position of an initializer a temporary location is required.

```blech
do
    var iBuffer: [4]int8 = {1,2,3,4}
    var iBuffer2: [4]int8 = {[1] = 2, [3] = 4} // partially initialised others are 0
    var myPair: Pair = {snd = 42}[3] // myPair.fst == 0
end
```

### Assignment

Variables of value type can be assigned to. 
The whole value gets copied to the location.

Initializers can also be used as r-values in assignments.
In this case a temporary location is generated.
The temporary location can be reused sequentially.

```blech
do
    var p: Pair 
    let p2 = {fst = 10}
    p = p2          // memcpy from valid location
    ps = {snd = 20} // populate temp. location, memcpy from temp. location 
    
    var ib: [4]int8
    let ib2: [4]int8 = {1,2,3,4}
    ib = ib2        // memcpy, guaranteed to be non-overlapping by construction
    ib2 = {[3]= 42} // populate temp. laction, memcpy from temp. location 
end
```

Block assignment of a structural value type is not possible if it contains a named component that is `let` qualified (read-only).
Such a named component can only be set during initialization.
Assignment can only be done field-wise.

### Parameter passing

Parameter passing for function inputs is by-value.
All other parameters (function outputs, activity inputs, activity outputs are passed by-reference
Results are returned by value.

#### Function calls


Functions take their inputs by-value and outputs by-reference
Assume `VT*` are value types.

```blech
    function f(x: VTin)(y: VTout) return VT
        return vtVal
    end

```
Parameters are implicitly qualified as follows:

```blech
    function f(<let> x: VTin)(<var ref> y: VTout) return VT
        return <r-value> vtVal
    end
```

If an input parameter is needed by-reference inside a function is must be qualified as a `ref`

```blech
function f(ref x: T)(y shares x: T)
    ...
end
```
This function is implicitly qualified as follows

```blech
function f(<let> ref x: T)(<var ref> y shares x: T)
    ...
end
```

`ref` qualified inputs are, for example, necessary if the same location shall be used as actual input and output

```blech
do
    var a: T
    f(a)(a)
end
```

Calling a function with actual parameters does the following:

1. For value input arguments the value is copied to the stack.

2. For reference input arguments, the adress is taken and copied to the stack

3. In order to be shared with an output parameter or a return type, an input parameter has to qualified as a reference


2. It is an optimisation for a input parameter of a composite value type to copy the address instead of the value to the stack. Note: Such a parameter is never allowed to be shared, because it is not qualified as a ```ref```

3. If the input arguments are r-value expressions. A temporary objects is created, that is initialised with the r-value. 

4. It is not allowed to pass an r-value expression to a reference parameter. Actual parameters must be memory locations.

4. For reference functions inputs, and function outputs, the address of the actual argument - the memory location - is copied to the stack

Results are returned by-value.
If a `tmp` location is necessary for aggregated types, that cannot be represented directly in C. 
Return value optimization - a.k.a RVO in C++ - can be applied. 

```c
    void f(VTin x, VTout *y, VT* tmp) {
        memcpy(*tmp, &vtValLocation, size_of(VT))
    }
```

#### Activity runs

Activities take their inputs and their outputs by reference
```blech
    activity a(x: VTin)(y: VTout) return VT
        return vtVal
    end
```

Parameters are implicitly qualified as follows:

```blech
    activity a(<let ref> x: VTin)(<var ref> y: VTout) return VT
        return <r-value> vtVal
    end
```

Different to functions the inputs of activity must be memory locations.
It is not allows to use an r-value expression as actual parameter.

For names the l-value can be used.
For an expression, it is possible to create a memory location by using a `bind` expression. 

```blech
    activity aty(x: int32)(y: int32)
        repeat
            y = x
            await
        end
    end

    do
        var a: int32 = 0
        var b: int32
        cobegin
            repeat 
                a = a + 1 
                print("\(b)") 
            end
        with
            run aty(bind a * 2)(b) // bind a*2, creates a memory a memory location
            run aty(a)(b)     // ok
        end
    end
```



`a * 2` get evaluated in every reaction.

Hint: The activity gets a reference to an r-value as its actual parameter.
A reference to r-value is implemented as a temporary object on the stack.

So far, we have only looked at value types. References occurred implicitly and explicitly in parameter passing. We now look at references.

## References

Causality analysis is tightly connected to alias analysis.

Due to un-decidability of alias analysis when using pointers and general references, Blech restricts their usage.

On the other hand usage of references is already present in Blech in parameter passing.
Furthermore references are also necessary for object-based structuring in use- and contains-relations.

## Using references

Variable declarations can be qualified as references defining a new name for an existing location, of a given type.

```blech
var x: int32
var buf: [4]uint8

var ref xAlias: int32 = x
var ref bufAlias = buf      // type can be deduced
```

`xAlias` is a new name for read-write `int32` location `x`. 
`bufAlias` is a new name for read-write array location `buf`.

References are defined (seated) at their declaration, by initialization. 
They cannot be re-seated, they refer to the same location during their lifetime. 
More simply expressed: References can only be initialized, but cannot be assigned.

The `var` qualification indicates, that the location a reference refers to is read-write. This restricts the initialisation of a reference.
A `var ref` cannot be initialised with a `let` location.

```blech
var x: int32
let c: int32 = 4711
var buf: [4]uint8
let primes: [4]uint8 = {11, 17, 23, 37}

var ref xAlias: int32 = x
var ref bufAlias: [4]uint8 = buf
var ref cAlias = c  // error: read-write expected but c is read-only
let ref cAlias: int32 = c
let ref readFromBuf = buf
```

It is possible to declare an alias for every value-type location bei using a `bind` expression (this is experimental).

```blech
activity a(x: int32)(y: int32)
    let ref xTimes2: int32 = bind x * 2  // a 'bind' is a reference to an r-value
    repeat
        y = xTimes2
        await
    end
end

do
    var a: int32 = 0
    var b: int32
    cobegin
        repeat 
            a = a + 1 
            print("\(b)") 
        end
    with
        run act(a)(b)
    end
end

// prints: 2, 4, 6, 8, 10, ..  as above
```

The local reference `xTimes2` refers to the r-value `x * 2` which gets evaluated in every reaction. 

This can be implemented with temporary stack-allocated location inside the one-step function of `a`. 

Hint: Here the bind is inside the activity, compared to the bind in the activity actual parameter above.

### Return values

Return values of functions and activities are either
values or references.

Returning an value is standard.
```blech
function getFortyTwo(x: [100]int32) return int32
    return x[42]
end

do
    var buffer = [100]int32{[42] = 42}
    var x: int32

    x = getFortyTwo(buffer)  // x = 42
```

Returning a reference is new.

If an reference is returned, it can only be used for
1. reference initialisation,
2. as a further argument, or
3. as a means for method chaining.

```blech
function getFortyTwoLocation(ref x: [100]int32) return ref shares x int32
    return x[42]
end

do
    var buffer: [100]int32 = {[42] = 42}

    let ref x42: int32 = getFortyTwoLocation(buffer)
end
```

The code-generation needs to use RVO (return value optimisation).
Life-time of returned references has to be taken into account.
It is not possible to return a reference to a local location.


########### go on here or move to other document

## Reference types

### User-defined reference types

```blech
ref struct Point
    var x: int32
    var y: int32
end

ref struct MovingPoint
    var x: int32
    let ref y: int32
end

typealias buffer = [10]bits8  // a value type
end

ref typealias Line = [2]Point     // a reference type

type newBuffer = [10]bits8    // a new value type incompatible to its structural type

ref typealias Line = [2]Point     // a new reference type incompatible to its structural reference type

```

An array of reference types is itself a reference type

``` blech
activity ()
    // reference type location declarations are always references
    var p: Point = Point{x = 0, y = 0} 
    var b: buffer = buffer{}  // 10 times 8 zero bits
    var l = Line{p, Point{x = 1, y = 1}}
    var i: int32 = 42 

    let pReadAlias = p 
    var ref bAlias: buffer = b
    let lAlias = l         
    let ref iAlias: int32 = i + 2 // a more complex bind
    let movingY = MovingPoint{x = 3, y = i + 2} // a more complex bind, moves to y = i + 2 in every reaction
    
    // written fully qualified and typed
    let ref movingY: MovingPoint = MovingPoint{var x = 3, let ref y: int32 = i + 2} // 2 temporary stack objects, is a compiler error.
    var movingY: MovingPoint = MovingPoint{var x = 3, let ref y: int32 = i + 2} // 1 tmp global and 1 temp stack objects
end
```

Hint: There is no need to re-evaluate R-Value references for reference types, because they cannot be changed. Only initializers return reference type r-values. Expressions only return references to reference types which are l-values.

Types could be omitted, because they are deduced from the initializers.

### Built-in reference types

Arbitrary length arrays

Slices

## Object-based programming

### Members

```blech
ref struct Class    // a class
    var m: valueType
    let ref p: Point        // reference to an existing value type location
end
```

### Methods

```blech
ref struct Class 
    var m: valueType
    let ref p: Point
with // static part

    // initialization function
    function initialize(<let> someVT: valueType, <let ref> someP: Point) returns shares someP Self
        return {m = someVT, p = someP}
    end

    // non-mutating and mutating functions and activities
    function readsfromSelf (<let> ref self: Self)
        ... self ...
    end

    function writesToSelf () (<var ref> self: Class)
        ... self ...
    end
    // static constants
end
```

Usage

```blech
do
    var v: valueType       // default zero initialized
    var p: Point = {} // Fields are default initialized
    var obj: Class = Class.initialize(v, p)  // reference type instance
end
```

Hint: An aggregated type that contains a reference-type component must be a reference.
This is also true for arrays. 

```blech
do
    ...
    let objs: [3]Class = { Class.initialize(v, p1), 
                           Class.initialize(v, p2), 
                           Class.iniitalize(v, p3) }  // a read-only reference type, must be completely instantiated
end
```

### Initializers

### Static constants

### Local types

### Qualifier and type deduction

