# OPTIONALS WILL BE REMOVED FROM BLECH FOR NOW


## Built-in generic optional type


## Optional types

The optional type is a built-in generic option type. That is roughly equivalent to:

```fsharp
type Option<'t>
    | Some of 't
    | None
```

For Blech purposes we call `None` `none` and make `Option` as well as `Some` part of the built-in syntax. An option type is declared by putting a `?` in front of the type.

```blech
var i: int32 = 42
i = none // Error
i = 42   // ok

var iOpt: ?int32
i = none // valid
i = 42   // automatically lifted to Some 42
```

An optional value can be checked for being `none`.

```blech
do
    if iOpt == none then end
    await iOpt ~= none 
end
```

It is a type error to compare an optional value to a non-optional value
```blech
do
    await iOpt == 42   // error iOpt is optional, 42 is not
end
```

Accessing an optional types value is only safely possible if it is not `none` (`Some value`).
In order to make access to an optional safe we offer two solutions

1. For expression we use the Elvis operator
2. For statements we allow optional binding in conditions.

The [Elvis Operator](https://en.wikipedia.org/wiki/Elvis_operator) `?:` allows to return a user-defined default value if the optional is `none`.
The usage in Blech is similar to its usage in [Kotlin](https://kotlinlang.org/docs/reference/null-safety.html)

```blech
iOpt = 42
i = iOpt ?: 0  // i == 42
iOpt = none
i = iOpt ?: 0  // i == 0
```

It can also be used in more complex expressions
```blech

sum = sum + (iOpt ?: 0)
```
 
The Elvis operator is shortened built-in form of pattern matching. Roughly equivalent to:

```fsharp
    let iOpt = Some 42
    match iOpt with
    | Some x -> x
    | None   -> 0
```
The difference is: The Elvis operator works on expressions.

Optional binding in conditions is a way to unwrap an optional and bind its value to a variable. 
It can be used where a condition is required. 
The optional value can be bound to a read-only (`let`) or a read-write (`var`) location.

```blech
if let i = iOpt then
    // i is visible, has a value and can be used here
else
    // i is not visible and can not be used here
end

do 
    await let i = iOpt
    // i is visible and can be used here
    await true
    // even here, across several awaits
end

do
    while var i = iOpt repeat
    // i is visible, has a value and can be used here
    end

    repeat
    ...
    until let i = iOpt end
    // i is visible, has a value and can be used here
end
```
Hint: Conditions are always side-effect free expressions. This means operations neither have output parameters, nor are they `mutating`.

# Conditions lists

Optional bindings and boolean conditions can be combined in one condition. Therefore it is possible
to test on several conditions and optional bindings in one condition expression.

```blech
var array = [10]int32{}
var iOpt: ?int32
do
    ...
    if let i = iOpt, i >= 0, i < #array then
        ... array[i] ...   // saturated if 'i' is out-of bounds
    end
end
```
We regard comma-separated sub-conditions as `and-then` connected. If one condition is false
then the others are not evaluated.

Although conditions are always side-effect free the compiler does not try to normalize boolean expressions for an optimal computation order. 
If the programmer needs control, she should use multiple sub-conditions

```blech
if (a and b) or (a and c) then
    // (a and-then b) or (a and-then c)
    // a will be evaluated twice
end

if a, b or c then
    // a and-then (b or c)
end
```


In many languages logical operators have an `and-then` and an `or-else` semantic (for example [Lua's logical operators](https://www.lua.org/manual/5.3/manual.html#3.4.5)), with `none` representing `false` and every other value representing `true`.

This behaviour can easily be created using optional binding, sub-conditions and the Elvis operator.

```lua
local a
local b
local c = 42
do
    local x1 = a or c          -- if a==none then x1=c else x1=a end
    local x2 = (a or b) or c   -- if a==none and b==none then x2=c elseif a==none then x2=b else x2=a end
    local x3 = a and b         -- if a~=none then x3=b else x3=none end -- might always be none
    local x4 = (a and b) or c  -- if a~=none and b~=none then x4=b else x4=c end  
end
```

```blech
var optA: ?int32
var optB: ?int32
var c: int32 = 42
do 
    let x1: int32 = optA ?: (optB ?: c)
    let x2: int32 = optA ?: c
    var x3: ?int32
    if optA ~= none then x3 = optB else x3 = none end
    var x4: int32
    if let _ = optA, let b = optB then x4 = b else x4 = c end
end
```


# Optional chaining

Safe location access for structural and aggregated optionals is possible with with the optional chaining operator `?`.

```blech
struct Record
    var a: int32
    var b: ?int32
    var c: ?[2]int32
    var d: [3]?int32
end

var p1: ?Record = none
var p2: Record = Record{a=42, b=none, c=[2]int32{0,1}, d=[3]?int32{none, 1, none}} 

let i1: ?int32 = p1?.a     // i1 == None
let i2: ?int32 = p2.b      // i2 == None
let i3: ?int32 = p2.c?[1] //  i3_ = Some 1; if c == none then i3 == none
let i4: ?int32 = p2.d[0]   // i4 == None
let i5: ?int32 = p2.d[1]   // i5 == Some 1
```

The access path returns none a soon as one optional is none, and stops evaluation the rest of the expression. 
The result of the location access always is an optional type.

It is possible to combine all the accesses with the Elvis operator in order to get a non-optional value.

```blech
let j1: int32 = p1?.a ?: 0     // j1 == 0
let j2: int32 = p2.b ?: 0      // j2 == 0
let j3: int32 = p2.c?[1] ?: 0  // j3 == 1
let j4: int32 = p2.d[0] ?: 0   // j4 == 0
let j5: int32 = p2.d[1] ?: 0   // j5 == 1
```

The optional chaining operator also allows to chain method calls. 
```blech
var obj: Class = Class()

do
    let res: ?ResultTypeOfMethod2 = obj.method1()?.method2()
end
```

Hint: Optional method chaining is only possible if methods return references, for example

```blech
struct S
    var x: int32
with
    function self:getX() returns ref int32 shares self
        return self.x
    end
end

do
    var s: S = {x = 42}
    s.getX().methodOnInt()
end
```

## Events are optionals too

Events are a special variant of optional types, which are managed by the run-time system
The payload of an event can be one or more value types.

```blech
event clicked(Record)   // an event allows for a payload

do
    cobegin
        emit clicked(p2)
    with
        await let p = clicked                // awaits presence and binds value
        let i1: int32 = p.a         // safe unpacking the payload, always present
        let i2: int32 = p.b       // type error
        let i3: int32 = p.b ?: 0
        let i4: ?int32 = p.c?[1]     
        await                       // clicked == none from here, but p still available 
        let i2: int32 = p.b ?: 0    // safe unpacking the payload, if none then 0
        let i5: ?int32 = p.b        // again an optional
    end    
end
```

Hint: An event is always an optional, the value of which is `Some payload` for one reaction and reset to `none` by the run-time system.

## Optional is not a first-class type constructor

It is not allowed to define an optional of an optional.

## Optional returns types


## Multiple return types, multiple event payloads

Return types can also be optional. 




Together with multiple return types this allows to do 
error handling.



## Optional value, optional error protocol



## Digression: Side-effect free expressions






