# Extensions

## Background 

Chalmers lecture notes on [overloading and type classes in Haskell](http://www.cse.chalmers.se/edu/year/2018/course/TDA452/lectures/OverloadingAndTypeClasses.html)

Papers that discuss different kinds of generics
[Language Support for Generic Programming in Object-Oriented Languages: Design-Challenges](http://ispras.ru/proceedings/docs/2016/28/2/isp_28_2016_2_5.pdf)
[Lightweight, Flexible Object-Oriented Generics](http://www.cs.cornell.edu/~yizhou/papers/genus-pldi2015.pdf)
[Modular implicits](https://pdfs.semanticscholar.org/b142/4ac6552d238485ca1f9665ce7f9fc847e8e0.pdf)
[Pitfalls of C# Generics and Their Solution Using Concepts](http://ispras.ru/proceedings/docs/2015/27/3/isp_27_2015_3_29.pdf)
Papers of [Julia Belyakova](https://julbinb.github.io/)

## Extensions are Scopes

An extension in Blech is a named scope containing ```const```, ```param```, ```function``` and ```activity``` declarations
Tbd. : Do we also allow ```type``` alias declarations

```blech
extension UInt32
    function increment()(value: uint32)
        value = value + 1
    end
end

extension UInt8
    function increment()(value: uint8)
        value = value + 1
    end
end
```

As a short-cut an extension can also be added to the declaration of a new type.

```blech
struct Count
    var count: uint32 = 0
extension   
    function inc () (count: Count)
        UInt32.inc(count.count)
    end

    function read (count: Count) returns uint32
        return count.count
    end

    function bump () (count: Count)
        inc()(count)
        return read(count)
    end
end 
```

This actually declares a ```struct``` type and an ```extension``` both named ```Count```.

A similar ```struct``` type with an ```extension``` is the following ```ByteCount```.

```blech
struct ByteCount
    var count: uint8 = 0
extension   
    function inc () (byteCoutner: ByteCount)
        UInt8.inc() (byteCount.count)
    end

    function read (byteCount: ByteCount) returns uint32
        return byteCount.count
    end

    function bump () (byteCount: ByteCount) returns uint32
        inc()(byteCount)
        return read(byteCount)
    end
end 
```

The return value of function ```read``` is automatically casted to ```uint32``` without loss of information.

## Overloading resolution for implicit member accesses

We can now use the defined ```struct``` types.

```blech
function useCount ()
    var c: Count 
    var bc: ByteCount
    _ = Count.bump()(c)
    _ = ByteCount.bump()(bc)
end
```

Having both ```Count``` and ```ByteCount``` in scope, we can use implicit member access as a short-cut.

```blech
function useCount ()
    var c: Count 
    var bc: ByteCount
    _ = .bump()(c)
    _ = .bump()(bc)
end
```

The implicit member access ```.bump``` is overloaded because it occurs in extensions ```Count``` and ```ByteCount```.
Since ```Count.bump``` expects a variable of type ```Count```, while ```ByteCount.bump``` expects a variable of type ```ByteCount```, the compiler can select the correct code. This is called *overloading resolution*.

Although Blech does not allow more than one declaration of a name within the same scope, which usually woukd be called *overloading*.
We access the same name in different scopes by implicit member access. 


## Extensions have interfaces

The contents of an extension is only visible inside the module, where it is declared, even if it is exported

```blech
module Counts exposes Count, ByteCount

extension UInt32
    ...
end

extension UInt8
    ...
end

struct Count
    ...
end

struct ByteCount
    ...
end
```

Consequently the module's signature looks like the following
```blech
signature Counts

struct Count
extension
end

struct ByteCount
extension
end
```
Nothing is visibile outside. Neither the contents of the ```struct``` type nor the contents of the ```extension```.


If we want to make the contents of an extension accessible from an importing module, we need to expose its contents.

```blech
module Counts exposes Count, ByteCount

extension UInt32
    ...
end

extension UInt8
    ...
end

struct Count
    ...
extension exposes inc, read, bump
    ...
end

struct ByteCount
    ...
extension exposes inc, read, bump
    ...
end
```

The extensions functions are exported. The internal implementation of the ```struct``` types is still hidden. The ```extensions``` ```UInt32``` and ```UInt8``` are purely internal.

The signature makes this visibile.

```blech
signature Counts

struct Count
extension
    function inc () (count: Count)
    function read (count: Count) returns uint32
    function bump () (count: Count) returns uint32
end

struct ByteCount
extension
    function inc () (byteCoutner: ByteCount)
    function read (byteCount: ByteCount) returns uint32
    function bump () (byteCount: ByteCount) returns uint32
end
```

The ```extension``` declaration in the ```signature``` and the extension definition in the ```module``` indicate or witness the implementation of an interface.

If we abstract from the type these functions are working on, we can define the abstract interface common to both extensions.

## Interfaces

Actually we can define several abstract interfaces describing the functions that are implemented via the given ```extension```s.

```blech
interface Counter [type T]
    function inc () (count: T)
    function read (count: T) returns uint32
    function bump () (count: T) returns uint32
end

interface Incrementer [type T]
    function increment () (value: T)
end
```

We see that ```extension Count``` and ```extension ByteCount``` implement ```interface Counter```. 
The names of the parameters are not relevant for type-checking and only serve documentation purpose. This is in contrast to the name of the functions, which are essential for the interface definition.

We also see that ```extension UInt8``` and ```extension UInt32``` implement ```interface Incrementer```.

To be more precise:
```extension UInt8``` implements ```interface Incrementer [uint8]```.
```extension UInt32``` implements ```interface Incrementer [uint16]```.
```extension Count``` implements ```interface Counter [Count]```
```extension ByteCount``` implements ```interface Counter [ByteCount]```

We can also retroactively create an extension that implements ```interface Counter [uint8]```
Since we already have an incrementing implementation as function ```increment``` we can alias it.

```blech
extension UInt8Count exposes inc, read, bump
    function inc = UInt8.increment
    
    function read()(value: uint8) returns uint32
        return value
    end
    
    function bump()(value: uint8) returns uint32
        inc()(value)
        return read(value)
    end
end
```

We can only do this in the same ```module Counts```. If we want do this in an importing module, ```extension UInt8``` must expose ```increment``` and module ```Counts``` must expose ```extension UInt8```.

## Polymorphism

Up until now we introduced ```interface``` definitions and pledged that a certain ```extension``` implements a certain ```interface```. 
We did not use an ```interface``` and did not check that an ```extension``` implements an ```interface```.

As the examples indicate an ```interface``` is a constraint on one or more types, that tells which functions are expected from an implementation expressed in an ```extension```.

Interfaces on types and type parameters can be used to express *parametric* and *ad-hoc* polymorphism.

### Parametric polymorphism

Parametric polymorphism im Blech means that a program entity takes a compile-time type parameter. 
These entities are often called *generics*.

### Generic subprograms

```blech
function select [type T]
                (flag: bool, this: T, that: T) returns T
    var result: T 
    if flag then
        result = this
    else 
        result = that
    end
    return result
end
```

Function ```select``` is polymorpic and can work with any value-type ```type T```.
Since Blech has no representation of polymorphic values at run-time, which usually would require boxing and dynamic memory allocation,function ```select``` cannot be called directly.
We need an monomorphic instance for every usage of ```select```. In order to make monomorphization predictable for the programmer, the programmer creates monomorphic instances explicitly.

```blech
function boolSelect = select [bool]
function int32Select = select [int32]

...
var b: bool
var i: int32

b = boolSelect(b, true, false)
i = int32Select(b, i, 42)
...
```

Function select can be regarded as a type-safe template. From this template two monomorphic code instances ```boolSelect``` and ```int32Select``` are created.
Monomorphized instances are structurally equivalent. A third instance ```select [bool]``` would use the same code as ```boolSelect```.
Explicitly creating monomorphic instances is less comfortable than real parametric polymorphism, but still allows to use generic algorithms and makes code size predictable.


### Generic types

Type definitions can also be parametric over types.

```blech
struct S[type T]
    var x: T
end

type SBool = S[bool]

function SBoolSelect = select [SBool]
function SInt32Select = select [ S[int32] ]
```

Now we have two instance of ```struct S``` and - in the meamtime - four instances of generic ```function select```.

## Ad-hoc polymorphism

The full power of polymorphism comes with *ad-hoc* polymorphism. The kind of generics allow to write polymorphic code that expects the implementation of certain operations for a type.  In other words, any type that can be used, must have an extension that implements a given interface.

As with type parameters, extension parameters are compile-time parameters. As with type parameters, extension parameters must be supplied to create monomorphic instances.

```blech
activity selectCounter [type T] {counter: Counter[T]} 
                       (flag: bool, this: T, that: T) () 
                       returns T
    var copyThis: T = this
    var copyThat: T = that
    var count: uint32 = 0    
    repeat 
        if flag then
            count = counter.bump()(copyThis)
        else 
            count = counter.bump()(copyThat)
        end
        await true
    until count > 20 end
    return count
end
```

```blech
activity selectCount = selectCounter [Count] {Count}
activity selectByteCount = selectCount [ByteCount] {ByteCount}
activity selectUInt8 = selectCount [uint8] {UInt8Count}

activity main()
    var flag: bool

    cobegin
        var a: ByteCount
        var b: ByteCount
        run selectByteCount(flag, a, b)
    with
        var c: Count
        var d: Count
        run selectCount(flag, c, d)
    with
        var i: uint8
        var j: uint8
        run selectUInt8(flag, i, j)
    end
end

```

We have three instances for which code is generated. Again instances are structurally equivalent. Again creation of monomorphic instances happens at compile time. There is no representation of ad-hoc polymorphism at run-time.

Although more restricted than dynamic approaches, it offers increased flexibility in composing embedded programs from generic parts.

## Type families
