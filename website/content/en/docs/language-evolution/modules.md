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
import m = "mymodule"

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
import m = "mymodule" exposes MyActivity

@[EntryPoint]
activity MyMain()
    var t: m.T 
    run MyActivity(t)
end
```

Note: The other exported entity -- type `T` -- can only be used, when qualifed with the module name. 

For exposing everything from an imported module, which is usually neither necessary nor recommended, you can use the short cut `...`.

```blech
import _ = "mymodule" exposes ...

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
import pair = "pair"

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
import pair = "pair"

signature

function sum(p: pair.Pair) returns int32
```

For reuse, a program that imports module file `"usepair"` also needs to import module file `"pair"`. 

```blech
import up = "usepair"
import p = "pair"

@[EntryPoint]
activity Main()
    var p: p.Pair
    _ = up.sum(p)
    await true
end
```

Note: Module `"pair"` is **not** exported indirectly via the import of module `"usepair"`.

The following program cannot be compiled.

```blech
import up = "usepair"

@[EntryPoint]
activity Main()
    var p: up.pair.Pair
              ^^^^--- unknown identifier
    _ = up.sum(p)
    await true
end
```

### Exporting nothing

For development purposes it might be useful to expose nothing until a module can be used.
A wildcard `_` can be used for this purpose.

```blech
module exposes _

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

### Exporting abstract types as new types

Sometimes it is useful to hide the implementation of a type, from its importers.
You can create a `newtype` for this purpose.

```blech
module exposes Pair, set, fst, snd

newtype Pair = [2]int32

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

Since the internal structure is unknown additional functions must be exposed.
The module's signature does not expose the internal type structure.

```blech
signature

newtype Pair

function set(fst: int32, snd: int32) returns Pair

function fst(p: Pair) returns int32

function snd(p: Pair) returns int32
```

### Non-cyclic import hierarchy

The compiler takes care for non-cyclic import dependencies.
Cyclic-import dependencies are flaged as a dependency error.

In order to compile a program or module file, every imported module is compiled recursively, if necessary.
Every imported module only needs to be loaded once.


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

