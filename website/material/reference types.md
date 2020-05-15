# References and reference types

## References

References are aliases for memory locations.

```blech
var i: int32 = 42
var ref iAlias: int32 = i
```

In the above example, `i` is a memory location for an `int32`. `iAlias` is a reference to the memory location of `i`, essentially `iAlias` is implemented as a pointer to `i`. This pointer can never be changed, it is assigned once at the point of its declaration.

A reference can also be initialised by the result of a function.

```blech
function eitherOr(ref x: int32, ref y: int32) returns ref shares x, y int32
    if x > y then
        return x
    else
        return y
    end
end

var a: int32 
var b: int32
var ref eitherAorB: int32 = eitherOr(a, b)
```

Different to normal function inputs the actual parameters for `x` and `y` need to be called by-reference because they are shared with the result.
Input paramters marked with `ref` - different to normal input value parameters - require an l-value (a memory location) as their actual parameter. 
Note: With the execption of function inputs all other parameters in Blech - activity inputs, activity output and function outputs - are implicitly called by-reference.

For causality analysis this means: Threads that write `eitherAorB` potentially write `a` and `b`.

A reference can only be taken from a memory location in a lower region. 
Therefore the following program will be rejected by the Blech compiler due to a region error.

```blech
function wrongEitherOr(x: int32, y: int32) returns ref int32
    var a: int32 = x
    var b: int32 = y
    if x > y then
        return a // region error
    else
        return b // region error
    end
end

var a: int32 
var b: int32
var ref eitherAorB: int32 = wrongEitherOr(a, b)
```

This also means, Blech needs region information during static analysis.

## Reference types

Reference types are composite types that contain references.

```blech
ref struct MeOther 
    var me: int32
    var ref other: int32
end
```


Because a variable of a reference type contains references to other memory locations, these references can only be initialised once at the point of the variable's declaration.

```blech
var significantOther: int32

var mo: MeOther = {me = 42, other = significantOther}
```

After initialisation, the reference to `significantOther` can not be changed.
Since it is a `var ref` its contents can be changed via `mo.other`.

Again the initialisation value can be the result of a function.
```blech
function meAndOther (me: int32) (theOne: int32, theOther: int32) returns shares theOne, theOther MeOther
    if me > 42 then
        return {me = me, other = theOne}
    else
        return {me = me, other = theOther}
    end
end

var a: int32
var b: int32

var mo: MeOther = meAndOther(42)(a, b)
```

For causility analysis this means, subprograms that write `mo` potentially also write `a` and `b`.

Again, it is an error to initialise a reference type variable with references from a higher region.

```blech
function wrongMeAndOther(me: int32) returns MeOther
    var a: int32
    var b: int32
    if me > 42 then
        return {me = me, other = a}  // region error
    else
        return {me = me, other = b}  // region error 
    end
end

var mo: MeOther = wrongMeAndOther(42)
```

It is correct to create an object in a higher region and return it by value for intialisation of an variable in a lower region. 

```blech
function correctMeAndOther (me: int32) (theOne: int32, theOther: int32) returns shares theOne, theOther MeOther
    let mo: MeOther = {me = me, 
                       other = if me > 42 then theOne else theOther}
    return mo
end

var a: int32
var b: int32

var mo: MeOther = correctMeAndOther(42)(a, b)
```

It would be wrong to return the object by reference because it would require to create an alias to an object in a higher region.

```blech
function incorrectMeAndOther (me: int32) (theOne: int32, theOther: int32) returns ref shares theOne, theOther MeOther
    let mo: MeOther = {me = me, 
                       other = if me > 42 then theOne else theOther}
    return mo // region error
end

var a: int32
var b: int32

var ref mo: MeOther = incorrectMeAndOther(42)(a, b)
```

## Initialisers are just functions

With the ability to return values of reference types, initialisers become normal functions. 
We can discard the special syntax for initialisers.


## Bind expression
BIND EXPRESSIONS ARE VERY PRELIMINARY

In order to be able to bind an expression to an reference input paramter we propose bind expressions

```blech

activity (a)(b) 
    repeat
        b = a
        await true
    end
end

do 
    var x:int32 = 0
    var y:int32
    cobegin
        repeat 
            x = x+1
            await true
        end
    with
        run forward( bind x+1 )(y)
    end
do
```

A bind expression creates a temp (anonymous) location that is updated on every tick, by evaluating the bound expression. That means, a bind expression is a memory location.
It can be used where a memory location is required. Since the expression itself writes to this memory location it can only be written sequentially.

```blech
do
    let x: int32 = 0
    var ref z: int32 = bind x * 2
    print(z)    // 43
    repeat
        x = x + 1
        print(x) // 1, 2, 3, 4
        print(z) // 2, 4, 6, 8
        await true
    end
end
```

The value of `z` is evaluated on every read in the writing thread (sequentially constructive) and once before every reading access in concurrent threads. In the reading thread bind is like call-by-name.



