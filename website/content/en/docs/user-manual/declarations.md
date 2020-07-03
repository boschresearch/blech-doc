---
title: "Declarations"
linkTitle: "Declarations"
weight: 40
description: >

---

Declarations introduce new names for entities in the program.
Declarable entities include

* activities
* functions
* types
* data storage

In the future more of such entities may be added to the language such as clocks and physical units.

Every declaration exists in a _lexical scope_.
Scopes define the visibility of a name.
The top-level or file scope is the most global scope in Blech.
Functions, activities and types are defined here.
Entities in the top-level scope are visible everywhere in the file.
Every block introduces a sub-scope.
For example, a function body is a local scope.
Variables defined in this scope are visible in this function but not outside of it.
Composite statements, such as the `repeat` loop introduce their statement-local scope. This allows to introduce a variable that is visible during the iteration through this loop and not outside of it.

{{< alert title= "Note" color="info" >}}
Once we implement a module system for Blech, the mechanisms for controlling visibility will need to be elaborated in more detail.
{{< /alert >}}

In Blech, declarations not only introduce a name but also _define_ what this name represents. For example, a function declaration will specify a function body.
That is the block of statements that are executed when this functions is called.
The definition may refer to names that were previously declared.

{{< alert title="Important" color="warning">}}
Declare before use! Even if, for example, functions are defined on the same scope, a function can only call other functions that have been declared before.
{{< /alert >}}

In the following we discuss the various entities that can be defined in a Blech program.

## Data

Data declarations consist of an access and placement qualifier, an identifier, a data type and an initialisation.

```abnf
DataDeclaration ::= Qualifier Identifier ":" Type "=" Init
```

A variable declaration:

```blech
var x: int32 = 17
```

The type is either a built-in type or a name of a user defined type.
Built-in types are discussed in the [Types chapter](../types).
Type declarations are discussed [below](#user-defined-types).

Initialisers are expressions that evaluate to a value that matches this declaration's data type. Expressions (including literals) are discussed in the [Expressions chapter](../expressions).

### Qualifiers

There are four possible qualifiers.

```abnf 
Qualifier ::= "const" | "param" | "let" | "var"
```

`const` qualified data is relevant for the compilation phase only and does not have any representation in memory at run time. 
Typical use cases for `const` are sizes of data structures, addresses in memory, ... 
In C, these are represented by `#define` macros, which, too, have no representation after the preprocessor finishes.
Hence *using const on arrays (or structs containing arrays), albeit possible, is not advisable* and produces inefficient code because temporary variables have to be created (and filled) at runtime for every (non-constant) access to these arrays.
Instead consider `param`.

`param` qualified data has a representation in memory at run time but cannot be changed by the running program for its entire lifetime (it can only be reflashed).
Typical use cases for `param` are characteristics maps or other immutable lookup data structures.
The name "param" indicates that such data is a parameter of the final compilation result.
Tools exist to customise such parameters in a binary file directly in order to adapt the given software to a variant of a product.
Like with `const` data, the `param` value must be initialised with constant expressions.
You cannot write the following

```blech
function f (input: int32)
   param x: int32 = input // error!
end
```

This is because the value of `input` is determined at *runtime* but `x` must be initialised at *compile time*.

`const` and `param` data may be declared at top level as well as inside functions or activities.
The other two qualifiers `let` and `var` indicate local data and may *only* be used inside functions or activities.

`let` declares immutable data in the control flow of a program.
Finally, 'var' declares the usual mutable variable.
Initialisation may be omitted for mutable variables. In this case the Blech compiler will automatically initialise the variable with its type's default value.
The type annotation may be omitted if the type can be unambiguously determined from the initialisation expression.

Example:

```blech
const LEN: int32 = 8
param lut: [LEN]float64 = {1.0, 0.5, 0.25, 0.125} // LEN is constant and may be used here
                                                  // the array literal will be filled with additional 0's up to length LEN.
function f()
    let i = LEN - 7 // i is deduced to be int32
    var x = lut[i] // x is deduced to be float64
                   // and equals 0.5 in this case
end
```

{{< alert title="Note" color="info" >}}
No global variables in Blech!
We deliberately prohibit the use of `let` and `var` outside subprogram scopes because we believe this leads to better understandable, easier to integrate and unit-testable programs.
{{< /alert >}}

{{< alert title="Important" color="warning">}}
Confusion may arise about the difference between `param` and `let`.
They both qualify immutable data in memory.
They could be even stored in the same way which however is a compiler implementation detail and none of the concerns of the programmer.
The crucial difference is that `let` takes values at runtime.
It is immutable throughout the scope where it has been declared.
Once the scope is left and re-entered, the value of that `let` variable may be re-initialised. (In the literature this is sometimes dramatically referred to as "re-incarnation".)
As stated above, ```param``` data cannot be changed by the running program at all, it is completely static.
{{< /alert >}}

{{< alert title="Important" color="warning">}}
The word "parameter" appears in two notions. One is the "formal parameter" of a function or activity.
The other is the "param" qualifier for immutable data.
The first parametrises a function (ar activity), the second parametrises a whole binary.
We try to make clear which one we mean throughout this document. Usually it should be apparent from context however.
{{< /alert >}}

##  User defined types

The programmer may define a data structure using the `struct` keyword.
See the chapter on [struct types](../types/#structure-types) for more details.
{{< alert title="Info" color="info">}}
As the implementation of the compiler progresses there will be more user definable types.
{{< /alert >}}

## Subprograms

Blech discerns two type of subprograms: `activity` and `function`.
Their behaviour is different. Activities must pause at least once whereas functions need to terminate within one reaction. Functions are therefore called "instantaneous".
The precise differences will be worked out in the chapter on Blech statements.
From a syntactic declaration point of view there is hardly any difference.

```abnf
ProgramDeclaration ::= ["singleton"] ProgramType Identifier ParamList [ParamList] ["returns" Type] StmtBlock "end"
ProgramType        ::= "function" | "activity"
ParamList          ::= "()" | "(" ParamDeclaration ("," ParamDeclaration)* ")"
ParamDeclaration   ::= Identifier ":" Type
```

There are two parameter lists. 
The first lists declares formal parameters that may only be read (like `let` variables), the second list declares formal parameters that may be both read and written (like `var` variables).
In particular the two lists are useful for activities which, in every reaction, receive a list of read-only _inputs_, perform some calculation and set the list of read-write _outputs_.
We will therefore often refer to these two parameter lists as "input list" and "output list".

The programming model is that all variables are passed by reference (even though in reality the compiler will optimise this into by-value for simple value typed inputs).

Example: 

```blech
function add (x: int32, y: int32) returns int32
   return x + y
end

@[EntryPoint]
activity A (in: int32)(out: int32)
   repeat
      out = add(in, out)
      await true
   end
end
```

The example above is a valid Blech program that sums all inputs over all time steps.
Note that `add` omits an output list and `A` does not declare any return type.
We call functions or activities that do not return anything "void" but unlike C we do not have a void type in the language.

The `@[EntryPoint]` annotation tells the compiler that `A` is the main program of this file. Every Blech file must have precisely one entry point activity.
_(That is until we have a module system that allows to write libraries that may have no single entry point at all)._

The `singleton` keyword is optional and may be used to indicate that there may exist only one instance of this subprogram in a concurrent context. 
For example, this is useful to indicate early on in the development phase that an activity will have some interaction with the external environment.
The caller of a singleton callee automatically becomes a singleton, too.

## External Declarations
Sometimes it is useful to access global variables or functions of a C program.
This allows for example to make use of existing libraries.
Such variables and functions are _external_ from the point of view of a Blech program.
Annotations are required to tell the compiler how to code-generate access to these external entities.

Formally, we have the following syntax.

```abnf
ExternFunctionDeclaration ::= "extern" ["singleton"] "function" Identifier ParamList [ParamList] [returns Type]
ExternDataDeclaration     ::= "extern" Qualifier Identifier ":" Type
```

Obviously, external functions have no body and external variables cannot be initialised.
As before, external functions may be characterised as `singleton` which means such a function may not be called concurrently. This is useful when the external function to be called is not a pure function because it either returns a volatile value or has some effect on the environment. Calling such a function concurrently would violate the synchrony assumptions and lead to unexpected results.

External declarations additionally require annotations which we introduce by example below.

{{< alert title="Important" color="warning">}}
Note that the type-safety and causality guarantees of Blech vanish once you interact with an external C implementation. That means the Blech compiler relies on the assumption that the specified annotations and interfaces are correct. We'll point out a few caveats below.
{{< /alert >}}

### External constants

In C, constant values may be defined using macros or `const` variables.
In order to make these values available in Blech, external constants may be declared.
External constant declarations may appear in any scope.

```blech
@[CConst (binding = "PI", header = "math.h")]
extern const pi: float64
@[CParam (binding = "characteristics", header = "magic.h")]
extern param map: [10]float32
```

Both Blech qualifiers `const` and `param` are supported.
They require a `CConst` or a `CParam` annotation respectively.
However they have more of a documentation character rather than any functional difference.
Both will evaluate whatever expression is given in the binding at runtime.
This is the reason why external constants cannot be used for constant expression evaluation in Blech -- their value is unknown at compile time.
While you can, for example, use a Blech constant to parametrise an array length, you cannot do so using an external constant.

The `binding` annotation attribute may contain any expression that can be evaluated in C.

By design the Blech compiler generates C code that links with other C code but at no point in time does the Blech compiler "look into" C header or implementation files, nor does it try to evaluate any C-bindings.

### Local external variables

The aforementioned constants may be declared in local scopes as well.
Additionally, local Blech variables that link to external global variables may be declared inside activities (but not in functions).

{{< alert title="Info" color="info">}}
There is no semantical reason why external variables cannot be declared inside functions. It is simply due to compiler implementation pragmatics that we exclude this possibility as of now.
{{< /alert >}}

Access to external variables is useful to keep interfaces slim. That is you do not need to pass all data into the entry point activity and down the call chain to the piece of code that actually needs this data and then propagate the results back up this chain to the entry point to communicate the updated values to the environment.
These variables follow the same rules as the usual activity-local variables.

Read-only external variables are annotated with the `CInput` annotation.

```blech
@[CInput (binding = "PIN_7", header = "head.h")]
extern let isButtonPressed: bool
```

This example assumes there is either a C macro or a C variable `PIN_7` that returns a volatile boolean value indicating a button press.

The declaration creates a local variable inside the enclosing activity.
It serves as a copy-in buffer.
When the activity starts a reaction the value of `PIN_7` is copied into `isButtonPressed`.
Within the Blech program we can only access the buffer `isButtonPressed` and thereby have the guarantee that the value does not change during the reaction.
This corresponds to the semantics of activity input parameters.

An activity that declares an immutable external variable does not become a singleton.
Concurrent instances may exist but they may contain different values for the same external variable if it is volatile.

Read-write external variables are annotated with the `COutput` annotation.

```blech
@[COutput (binding = "PIN_7", header = "head.h")]
extern var isButtonPressed: bool
```

Here at the beginning of a reaction the value of `PIN_7` is copied in.
During a reaction the variable `isButtonPressed` can be modified as usual.
At the end of the reaction the value of `isButtonPressed` is copied out to `PIN_7`.
This guarantees a stable output behaviour. Intermediate changes to the local variable `isButtonPressed` are not observable by the environment.

The `prev` operator may be used on external variables.
It returns the value that the variable held at the end of the previous reaction.
This behaviour corresponds to using `prev` on normal local variables but there is a subtle difference.
External variables may be changed by the environment.

```blech
@[COutput (binding = "PIN_7", header = "head.h")]
extern var isButtonPressed: bool
isButtonPressed = true
await cond // some boolean condition
var x = prev isButtonPressed // is x == true?
```

If `cond` is true immediately in the next reaction then x will be set to `true`.
In general, however we do not know how many reaction it will take until `cond` becomes true.
Yet in every reaction the copy-in and copy-out mechanisms will update the `isButtonPressed` buffer.
If the environment does not change `PIN_7` then surely `x` will be `true`.
But, in general, we cannot assume this.

An activity that declares a mutable external variable automatically becomes a singleton.
Concurrent instances lead to a write-write conflict and compilation is rejected.

### External functions

There are two ways to link to external functions in Blech.

1. Via direct binding to function name declared in an .h file
2. Via a wrapper to be implemented in some .c file.

In the first case we annotate the name of the C function and the file wherein this function is declared.

```blech
@[CFunction (binding = "ceil", header = "math.h")]
extern function ceiling(i: float64) returns float64
```

Inside the Blech program this function is now available through name `ceiling`.

In the second case we annotate which file we intend to implement the C function in.
Actually this information is irrelevant for the Blech compilation itself.
However, it may become useful in the future once a build system can make sense of these annotations and automatically detect which files are required for the compilation of the whole project.


```blech
@[CFunction (source="impl.c")]
extern function myCFunction(i: float64) returns float64
```

Assume the above declaration is written in a Blech file called `MyFile.blc`, then the code generator will produce a header file `MyFile.h` with the following code:


```c
// extern functions to be implemented in C
blc_float64 blc_MyFile_myCFunction (const blc_float64 blc_i);
```

It is up to the C programmer now to include this header in his implementation file `impl.c` and provide an actual definition of this function.

### Remarks on caveats when interfacing with C

#### Types

Blech has no representation of C types. It requires that the C implementation matches the Blech types. This is usually straightforward for simple types. If there is no one-to-one correspondence between types a wrapper has to be implemented in C that marshals the data between Blech and the actual C function to be called.

#### Parameter lists

In Blech, functions have two parameter lists as explained above. 
The Blech compiler ensures that inputs will only be read. 
However the Blech compiler has no chance to check that the external code adheres to this contract.

For example, say we have an external function that takes an array of length 10 and sorts it in-place.
The correct binding would look something like this:

```blech
@[CFunction (binding = "sort", header = "utils.h")]
extern function sort()(arr: [10]int32)
```

In this way, the Blech compiler knows that `sort` will modify the given array. When calling this function in a concurrent context the compiler will prevent write-write conflicts and read-write cycles on the array.

However, the programmer could erroneously declare the same function as follows:

```blech
@[CFunction (binding = "sort", header = "utils.h")]
extern function sort(arr: [10]int32)
```

The code will compile all the same but the causality guarantees are gone because the Blech compiler relies on the assumption that the array will only be read and not modified. At runtime the program may then exhibit unexpected behaviour.

#### Singletons

The `singleton` annotation is a help to the Blech programmer but does not completely prevent concurrent calls to functions with conflicting effects. For example:

```blech
@[CFunction (binding = "foo", header = "head.h")]
extern singleton function doA() 
@[CFunction (binding = "foo", header = "head.h")]
extern singleton function doB() 

/* ... somewhere in an acitivity scope ... */
cobegin
   doA()
with
   doB()
end
```

This example is a valid Blech program because two different singleton functions are called. This is allowed. However the annotation points to the same C function which is obviously a problem. While a linter could in principle check for this _particular_ mistake there are many more possibilities to specify bindings to functions which will have conflicting effects when called concurrently.
It is up to the programmer to know what are the effects of the external functions to be called and to avoid scenarios such as the one above.