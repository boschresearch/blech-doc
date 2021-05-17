---
title: "Modules"
linkTitle: "Modules"
weight: 70
description: >

---

## Compilation units
A Blech program may be split into multiple files: a program file and so-called *module* files.
The purpose of modules is to encapsulate the implementation of a certain aspect (functionality) in a given software project.

Both a program file and a module file have the `.blc` extension.
However a file representing the program must contain an [entry point activity](../declarations/#subprograms).
There must not be a [module declaration](#modules) in a program file.

Vice versa, a module file will declare a module (see below) and must not contain an entry point.

This difference is best understood when looking at the compilation results.
The compilation of the *program file* produces C code with an *init* and a *tick* function which form the API towards the environment.
Additionally, the compilation result of a Blech program will also contain a *context* data structure which contains all program counters and local variables of that program.

A Blech module, by contrast, is supposed to be *used* by some Blech program or another module.
Therefore all its activities reply on context information passed on from the caller.

Module implementations encapsulate code.
- Modules are namespaces for code entities.
- Module interfaces are automatically generated from implementations and their import/export declarations.
- Module interfaces hide implementation details.
- The import hierarchy is always a directed acyclic graph, supporting a layered modular software structure.
- Every layer is separately testable and reusable.
- The compiler recursively compiles programs and modules along the dependency hierarchy.
- Optionally importing all implementation details allows for white-box testing.
- Modules can be packaged to libraries - called *boxes*.
- Boxes are namespaces for modules.
- Boxes can hide internal implementation modules.
- The syntax for modules is light-weight.
- Reasoning about the modular structure is easy.
- Modules and boxes map to files and directories.
- All static analysis is designed to work with separate compilation.

Files: Programs have an entry point vs modules

## Modules

A Blech module is a `.blc` file.
Modules cannot span several files nor can a file contain several modules.
A module constitutes a name space within which various [declarations](../declarations) may appear.
All declarations *within* a module are visible.
In particular, implementations details such as the fields of a structure are visible.

By contrast, no declaration is visible *outside* the module unless it is explicitly *exposed*.

```abnf
Module ::= "module" ["exposes" IdentifierList] DeclarationList
IdentifierList ::= Identifier ["," IdentifierList]
DeclarationList ::= "" | StructDeclaration | DataDeclaration | ProgramDeclaration
```

Note that the module itself has no identifier. Client code which uses this module will *find* it by its file name and *give* it some local name when [importing](#Imports) the module.

Also, remember that the [qualifiers](../declarations/#qualifiers) `let` and `var` must not appear on the top-level scope - no globals in Blech.


Example of a module:

```blech
module exposes initialise, push, average

const Size: nat8 = 10

struct RingBuffer
    var buffer: [Size]nat32
    var nextIndex: nat8
    var count: nat8
end

/// returns an initialisation value for a ring buffer
function initialise () returns RingBuffer
    return { nextIndex = 0, count = 0 }
end

/// pushes a new value to the ring buffer
/// displaces the "oldest" value if the ring buffer is full
function push (value: nat32) (rb: RingBuffer)
    rb.buffer[rb.nextIndex] = value
    rb.nextIndex = rb.nextIndex + 1
    if rb.count == Size then // ringbuffer is completely filled
        rb.nextIndex = rb.nextIndex % Size
    else
        rb.count = rb.count + 1
    end
end

/// calculates the average value of all values stored in the ring buffer
function average (rb: RingBuffer) returns nat32
    var idx: nat8 = 0
    var avg: nat32 = 0
    while idx < rb.count repeat
        avg = avg + rb.buffer[idx]
    end
    return avg / rb.count
end
```

This module encapsulates the implementation of a ring buffer.
The ring buffer is represented by the `RingBuffer` structure that holds a buffer of fixed size.
Three functions are implemented to initialise the buffer, add values to it, and calculate the average over all values currently stored in the ring buffer.
The module exposes the functions `initialise`, `push` and `average` to client code that will use this module.
However it hides the size of the buffer and the details of its data structure because `Size` and `RingBuffer` do not appear in the list of exposed names.
The name `RingBuffer` is implicitly visible outside as the name of an opaque type, see below.

## Signatures
The compiler translates a Blech module into C code.
But it also automatically generates a *signature* which is saved under the same name but with a `.blh` extension.
Signatures are never manually written by the software developer.

A signature describes the API of the module.
It contains the explicitly exposed constants, types and procedure prototypes.
Furthermore implicitly exported names of types, singletons or procedures are listed.
Finally, imports that are necessary to use the exposed procedures also appear in the signature.

Signatures are used by the compiler when compiling client code.
The compiler in principle does not need to have the sources of imported sub-modules, instead all semantic checks can be done using the signatures only.
In the future, this allows to pre-compile modules into object files for a target platform and ship those object files together with the signature files to the customer.
Since Blech programs cannot be imported in other `.blc` files, no signatures are generated for them.

Types which are not explicitly exposed by a module but are used by some exposed function or activity appear in the signature as *opaque* (or *abstract*) types.
Opaque types only have a name but do not reveal their inner implementation details. 
The declaration of the name is required by the client code so that it can "pass around" values of the opaque types between procedures even though the content cannot be accessed directly.

Here is an example of the generated signature for the module in the previous section.

```blech
signature

@[StructType]
type RingBuffer

/// returns an initialisation value for a ring buffer
function initialise () returns RingBuffer

/// pushes a new value to the ring buffer
/// displaces the "oldest" value if the ring buffer is full
function push (value: nat32) (rb: RingBuffer)

/// calculates the average value of all values stored in the ring buffer
function average (rb: RingBuffer) returns nat32
```

The type `RingBuffer` was not exposed by the module but it is used by the exposed functions. For instance, it is the return type of the exposed function `initialise`.
Therefore the type name `RingBuffer` appears in the signature.
The annotation `@[StructType]` is not part of the Blech language but merely a hint to the C code generator.

Furthermore, signatures contain import declarations (see [below](#Imports)) that are necessary to use this module.
This is the case when, for example, an exposed function uses a type from an imported module.
Then, in order to declare a prototype of this function in the signature, an import is required to access the type name.

Finally, signatures also declare *opaque singletons*.
These are the names of procedures which are singletons themselves, not explicitly exposed, but used in exposed procedures.

Example:
```
module exposes f

singleton x
@[CFunction (binding = "foo()", header = "bar.h")]
extern singleton function y ()

singleton [x] function f()
    y()
    //...
end
```

Accordingly, the signature contains an opaque singleton `y` without specifying that it was an (external) function.
```
signature

singleton x

@[CFunction(binding = "foo()", header = "bar.h")]
singleton y

singleton [x, y] function f ()
```
Also note, how the declaration of `f` contains the *full* list of singletons that it depends on.

## Imports

A module needs to be imported by the down stream client code if the latter want to use the exposed members.

Following our previous ring buffer example, its usage might look like this:
```blech
import rb "/data_structures/ringbuffer"

module exposes SlidingAverage 

param Threshold: nat32 = 10000 // Application parameter

/// Calculates the average of the latest values in every tick
/// Values outside a fixed threshold are ignored.
activity SlidingAverage (value: nat32) (average: nat32)
    var buf: rb.RingBuffer = rb.initialise() 
    repeat
        if value <= Threshold then
            rb.push(value)(buf)
        end
        average = rb.average(buf)
        await true
    end
end
```
Here we assume that in the root `/` of the current project there is a `data_structures` folder which contains a `ringbuffer.blc` module file. (The extension is omitted on purpose).
In order to use its exposed members the local name `rb` is introduced.
Now we can refer to the opaque data type `rb.RingBuffer` or the functions `rb.initialise` etc...

Formally, the import declaration is as follows:
```abnf
Import ::= "import" ["internal"] Identifier QUOTE ImportPath QUOTE ["exposes" IdentifierList] 
ImportPath ::= ["/" | ".."] Path
Path ::= Identifier ["/" Identifier]*
```

local name

path formats (indicate box packaging is future work)
explain project path, relative imports, remark it is not fully supported by IDE yet

exposes

Rules:
- no self import
- no circular import
- no double import

## Whitebox import
