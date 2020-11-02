---
title: "Programs and modules - the Blech compilation units"
linkTitle: "Modules"
weight: 40
toc_hide: false
description: >
    Modules and programs - proposal for Blech compilation units.
---
{{% pageinfo %}}
The modules proposal is work in progress.
{{% /pageinfo %}}

## Introduction to compilation units

A compilation unit in Blech is a single file.
A file can either be a complete Blech program or a module.
A module can be imported to support the implementation of another module or a program.


### Program files

A program file is a Blech code file (a ```.blc```-file) that needs exactly one activity marked as  an `@[EntryPoint]`.
This activity is the *main* routine of a Blech program.
The name of this entry point to your program can be choosen freely.
A program can use other Blech files for its implementation.
A program is always a top-level file of a Blech application.


### Module files

A module file is a Blech code file that is supposed to be used for the implementation of other modules or programs.

By default, all internals of a Blech code file are hidden.
In order to become a module, a Blech code file must be marked as a `module` and export at least one top-level declaration or a wildcard, see below. TODO: Add a relref here, how?.

Different to other languages we do not use accessibility modifiers in front of declarations.
Instead, we require an explicit declaration of exported top-level declarations.

```blech
module exposes TopLevelIdentifier
```

Every top-level declaration inside a module file can be exported to be used by another module or program file.
All neccessary declared identifiers must also be exported.
Optionally, the exported identifiers can be classified for readability.


```blech
module exposes T, MyActivity

type T = int32

function f(x: T) ... end

function MyActivity(x: T) 
    f(x)
    ...
end
```

In this example the export of activity `MyActivity` also requires the export of type alias `T`.
The compiler checks the correctness of exports.
It is a compiler error, if type `T` is not exported.
For a correct module file an interface file is created that contains all compile-time information that is necessary to compile a Blech file that uses this module file.

```blech
signature

type T = int32

function MyActivity(x: T)
```

## Reusing a Blech file

In order to reuse a blech module file it needs to be imported.
Only exported entities can be used.
The internal - non-exposed - entities are hidden.


### Importing a Blech module file for use in a program or another module

In order to use a module file it needs to be imported by another compilation unit, for example a Blech program.

```blech
import m "mymodule"

@[EntryPoint]
activity MyMain()
    run m.MyActivity()
end
```

Again, `"mymodule"` resembles the file name of the module.
In order order to use it we declare a Blech identifier for the module.
It is fine to use any valid identifier, here `m`.
By default all imports are qualified with this module name.
In order to use an imported name without qualification is must be exposed at the import.

```blech
import m "mymodule" exposes MyActivity

@[EntryPoint]
activity MyMain()
    var t: m.T 
    run MyActivity(t)
end
```

Note: The other exported entity -- type `T` -- can only be used, when qualifed with the module name. 

For exposing everything from an imported module, which is usually neither necessary nor recommended, you can use the short cut `...`.

```blech
import _ "mymodule" exposes ...

@[EntryPoint]
activity MyMain()
    var t: T 
    run MyActivity(t)
end
```

In this case, a wildcard `_` for the module name can be used.

{{% alert title="Warning" color="warning"%}}
Since Blech has a very rigid no-shadowing policy, you cannot redefine an exposed identifier.
Therefore, use unqualified exposed imports sparingly.
{{% /alert %}}

Usually, several `import` declarations are necessary for a module or program file.


### No implicit export for imported modules

Assume the following two modules.

Module file `pair.blc` only exports type alias `Pair`.

```blech
module exposes Pair

type Pair = [2]int32

function fst(p: Pair) return int32
    return p[0]
end

function snd(p: Pair) returns int32
    return p[1]
end
```

Module file `usepair.blc` imports modul `pair`, but cannot access hidden functions `fst` and `snd`.

```blech
import pair "pair"

module exposes sum

function snd(p: Pair) return int32
    return p[2]
end

function sum(p: pair.Pair) returns int32
    return p[0] + snd(p)
end
```

On successful compilation the compiler generates the following signature - the interface of a module - in file `pair.blh`

```blech
signature

type Pair = [2]int32
```

Module `"usepair"` requires an `import` of module `"pair"` and exports function `sum`.

```blech
import pair "pair"

signature

function sum(p: pair.Pair) returns int32
```

For reuse, a program that imports module file `"usepair"` also needs to import module file `"pair"`. 

```blech
import u "usepair"
import p "pair"

@[EntryPoint]
activity Main()
    var p: p.Pair
    _ = u.sum(p)
    await true
end
```

Note: Module `"pair"` is **not** exported indirectly via the import of module `"usepair"`.

The following program cannot be compiled.

```blech
import u "usepair"

@[EntryPoint]
activity Main()
    var p: u.pair.Pair
             ^^^^--- unknown identifier
    _ = u.sum(p)
    await true
end
```

{{% alert title="Info" color="info"%}}
The compiler makes sure that all imports necessary to use a module become become required imports in its signature.
{{% /alert %}}

### Exporting nothing

For development purposes it might be useful to expose nothing until a module can be used.
The `exposes` part is optional for this purpose.

```blech
module

type Pair = [2]int32

function fst(p: Pair) returns int32
    return p[0]
end

function snd(p: Pair) returns int32
    return p[1]
end
```


### Exporting everything

Sometimes it might be useful to expose everything in a module.
There is a shortcut `...` for this.

```blech
module exposes ...

type Pair = [2]int32

function fst(p: Pair) returns int32
    return p[0]
end

function snd(p: Pair) returns int32
    return p[1]
end
```





### Non-cyclic import hierarchy

The compiler takes care for non-cyclic import dependencies.
Cyclic-import dependencies are flaged as a dependency error.

In order to compile a program or module file, every imported module is compiled recursively, if necessary.
Every imported module only needs to be loaded once.





## Information hiding and abstract types

Sometimes it is useful to hide the implementation of a type, from its importers.
You can do this by implicititly exporting the type.


### Keeping the implementation of a type hidden

Instead of exporting the type itself, you only export the functions and activities that act on this type.
Imagine the following contents in file `"pair.blc"`

```blech
module exposes set, fst, snd

type Pair = [2]int32

function set(fst: int32, snd: int32) returns Pair
    return {fst, snd}
end

function fst(p: Pair) returns int32
    return p[0]
end

function snd(p: Pair) returns int32
    return p[1]
end
```

The generate module's signature file `"pair.blh"` not only contains the exposed functions but also the necessary type `Pair` with a hidden internal structure.
In theory this is called an abstract type or an existential type.

```blech
signature

type Pair

function set(fst: int32, snd: int32) returns Pair

function fst(p: Pair) returns int32

function snd(p: Pair) returns int32
```

An client of this module is restricted concerning the operations on this type.
It can 
* create a variable
* initialise it 
* call operations on variables of this type

```blech
import p "pair"

activity Main()
    var ab: p.Pair = p.set(1,2)

    var i = p.fst(ab)
    var j = p.snd(ab)
    await true
end
```

The importing program has no knowledge about `p.Pair`'s internal structure. 
The implementation can be changed without changing any importing clients.
The API is not broken.
For example you could use a `struct` instead of an array with 2 elements.

```blech
module exposes set, fst, snd

struct Pair
    var fst: int32
    var snd: int32
end


function set(fst: int32, snd: int32) returns Pair
    return {fst = fst, snd = snd}
end

function fst(p: Pair) returns int32
    return p.fst
end

function snd(p: Pair) returns int32
    return p.snd
end
```

The generated signature file would be the same as before.

{{% alert title="Info" color="info"%}}
In general the compiler exports all types needed for the exported functions as abstract types, if they are not exported explicitly.
{{% /alert %}}



### No abstract types for constants

When a module besides types, functions and activities also exports constants (`const`) or parameters (`param`), the type of these constants cannot be abstract.
Let's look at the `pair` example.

```blech
module exposes Zeroes, set, fst, snd

struct Pair
    var fst: int32
    var snd: int32
end

const Zeroes: Pair = {fst = 0, snd = 0}

function set(fst: int32, snd: int32) returns Pair
...
function fst(p: Pair) returns int32
...
function snd(p: Pair) returns int32
...
```

If the type `Pair` is exported as an abstract type, we cannot export the initial value of the constant, because its representation might change.
The only valid signature would be 

```blech
signature

type Pair

const Zeroes: Pair

function set(fst: int32, snd: int32) returns Pair

function fst(p: Pair) returns int32

function snd(p: Pair) returns int32
```

Without the initial value we cannot do compile-time evaluation in importing modules. 
The situation would even be worse, if we would add compile-time evaluated functions to Blech - which we eventually will do.

If we want to export a constant, we also need to export the internals of its type.
```blech 
module exposes Pair, Zeroes, set, fst, snd
...
```

Then, the signature looks like the follwing.

```blech
signature

struct Pair
    var fst: int32
    var snd: int32
end

const Zeroes: Pair = {fst = 0, snd = 0}

function set(fst: int32, snd: int32) returns Pair

function fst(p: Pair) returns int32

function snd(p: Pair) returns int32
```

Together with the constant, the implementation details of the type are revealed to the importing module.

As alternative we might also hide the constant itself, use it only for internal implementation purposes, and keep the type `Pair` abstract.

{{% alert title="Info" color="info"%}}
The compiler makes sure that all types of exported constants are exported explicitly, thereby revealing the types' implementation.
Furthermore, if the initialiser uses another constant, the compiler checks if this constant is explicitly exported too.
{{% /alert %}}



## File structure

### Compiling a Blech module

The compilation of a Blech module file, for example `module.blc`, generates the following files:

* A Blech signature file `module.blh`,
* a C header file `module.h`, and 
* a C implementation file `module.c`.

The Blech signature file contains all static information for name checking, type checking and causality analysis.
The C header and implementations files are used to compile a Blech program.


### Compiling a Blech program

A Blech program file is not a module. Therefore, it cannot be imported. 
The compilation of a Blech program file, for example `program.blc`, generates only

* A C header file `program.h`, and
* a C implementation file `program.c`.

### Hierarchical organisation of a Blech project

A Blech project consists of modules and program files, that are hierarchically structured.


## Abstract types and the diamond import problem

