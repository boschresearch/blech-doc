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
In order to become a module, a Blech code file must export at least one top-level declaration.
Different to other languages we do not use accessibility modifiers in front of declarations.
Instead, we require an explicit declaration of exported top-level declarations.

```blech
export TopLevelIdentifier
```

Every top-level declaration inside a module file can be exported to be used by another module or program file.
All neccessary declared identifiers must also be exported.
Optionally, the exported identifiers can be classified for readability.


```blech
export T, MyActivity

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
module "mymodule"

type T = int32

function MyActivity(x: T)
```
In order to allow that an interface file can flexibly be placed in the project or library file structure, an interface file also contains the module name it belongs to.
The module name resembles a hierarchical file name. 
We will discuss the project and file structure later on.

## Reusing a Blech file

The classical way of using a blech module file is by importing it and using it from outside.
The internal details are hidden, only exported entities can be used.

Especially for testing this is sometimes not enough because it only enables black-box test.
For a white-box test, we need to access all the internal details.
For this, we offer a second mechanism reuse mechanism.


### Importing a Blech module file as a black box

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

### Including a Blech module file as a white box

Sometimes it is useful, to be able to access all the internal declarations of a module or program file.

A typical situation, that requires such an ability are white-box tests.
A test activity or function is similar to an addtional declaration inside the module itself.
In order to keep the module clean, we want to able to separate the test.

For this purpose, a Blech file can also be included.
The including Blech file can either be a module or a program.

Lets show the example of a simple test program.

```blech
include m = "mymodule"

activity CreateInput ()(t:T)
    ...
end

@[EntryPoint]
activity MyTest()
    var t: T
    cobegin
        run CreateInput()(x)
    with
        run m.MyActivity(x)
    end
end
```

`include` is very different to `import`.
All entities, also hidden ones, of the blech module file `"mymodule"` are accessible.
Include is for development purposes - like white box testing.
You can only include a blech file, if its source code is available.
In a library, without source code, a module file cannot be included as a white box.

## Importing and including

### No implicit export for imported modules

Assume the following two modules.

Module file `pair.blc` only exports type alias `Pair`.

```blech
export Pair

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
export sum

import pair = "pair"

function sum(p: pair.Pair) returns int32
    return p[0] + p[1]
end
```

On successful compilation the compiler generates the following interface files

Note: It is still open, if we should represent Blech interface files as valid Blech code or in some internal representation.

For black-box use, module `"pair"` only exports type alias `Pair`.

```blech
module "pair"

type Pair = [2]int32
```

Module `"usepair"` requires an `import` of module `"pair"` and exports function `sum`.

```blech
module "usepair"
import pair = "pair"

function sum(p: pair.Pair) returns int32
```

For black-box use, for example, a program that imports module file `"usepair"` also needs to import module file `"pair"`. 

```blech
import usep = "usepair"
import p = "pair"

@[EntryPoint]
activity Main()
    var p: p.Pair
    _ = usep.sum(p)
    await true
end
```

Note: Module `"pair"` is **not** imported indirectly via the import of module `"usepair"`.


## Whitebox reuse creates more dependencies

Let's modify module file  `"usepair.blc"` by white-box `include` of module `"pair"`.
Now, we can use the internal, not exported functions `fst` and `snd`.

```blech
export sum

include pair = "pair"

function sum(p: pair.Pair) returns int32
    return pair.fst(p) + pair.snd(p)
end
```

The interface file for module `"pair"` remains unchanged.

The situation changes if nothing is exported from module file `"pair.blc"`.

```blech
export _

type Pair = [2]int32

function fst(p: Pair) return int32
    return p[0]
end

function snd(p: Pair) returns int32
    return p[1]
end
```

Then, the interface for module `"usepair"` cannot be generated because there is no way to make type `Pair` visible for black-box use.
The compiler reports and error.

In general white-box reuse creates more internal dependencies and makes it more difficult to create a clean black-box interface.

Therefore, it only recommended for development purposes and cannot be used when no source code is availabe. For example, when importing from an installed library.

## File structure


