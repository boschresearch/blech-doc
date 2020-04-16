---
title: "Expressions, conditions, initialisers, constants"
linkTitle: "Expressions"
weight: 10
description: >
  This explains the variants of expressions in Blech.
---

## Equality expressions
Theoretically, every type supports some notion of equality (and inequality). 
This is straightforward for **simple (or primitive) value types** that consist of one memory cell only (booleans and all numeric types of all sizes): 
`a == b` holds iff the value of `a` is the same as the value of `b`. 

For **structured (complex) value types** we can decide equality by comparing every element of data structures recursively.
At compile time the result of a comparison can be evaluated if the arguments are compile time constants. 
Thus it is technically no problem to compare compile time constants of any value type.

At runtime a recursive comparison algorithm is too much of a runtime penalty and what looks like a constant time operation turns out to be growing with the dimension of the structure. 
An optimisation of runtime - not changing the run-time complexity but providing better factors - could be achieved by comparing the data structures byte-wise (`memcmp`).
But this requires to fix padding in structs and then fails in special cases: 
floating point elements may use different bit representations for the same numerical value, e.g. `+0.0` and `-0.0`. 
Consequently, the comparison operator for structured data may not be used at runtime (like in C) and results in a type check error.

*Reference types are not implemented yet but in principle they will have the same behaviour: compare (dereferenced) values for simple types, and disallow comparison for complex types.*

## Using constants
In order to make evaluation work for arbitrary constant expressions the names are resolved by the constant values (literals) they represent. 
Thus at the end of the type check phase the declarations of the consts do exist and can be translated to C but all their usages disappear (being substituted by the value).
This has the drawback of less readable C code but still allows to export constants as #defines and use them in foreign code by including the relevant `.h` file.

In C89, structs can be initialised using structured literals but cannot be assigned new values using structured literals. 
The same is true for arrays in all versions of C. 
Additionally, when calling functions the arguments need to be pointers to memory locations that contain the (structured) data. 
In all these cases, in the generated C code we create a stack local (automatic) temporary variable that is initialised using the literal and then use that variable (or its address) to perform assignments or function calls. 
In summary, literals occur only on the right hand side of initialisation in the generated C code.

## Side effects in conditions are not allowed

It is obvious that testing an `await` condition may not have any impact on the state to implement a synchronous program. 
Additionally, we forbid side effects in conditions of preemption and all standard, imperative statements. 
This clearly seperates concerns of making decision about the current program state and (possibly) triggering other, (possibly) concurrent computation. 
The common programming practice of C where conditions' side effects are used to also advance computation is regarded as bad practice in Blech until proven otherwise.

## Side effects are allowed in initialisers
Despite the urge to restrict the wild programmer, we allow side effects when declaring and initialising a variable. 
Otherwise the following code that declares an immutable variable cannot be written:

```blech
let status = f()(x)
```

Instead, we would have to write

```blech
var status: typeOfF
status = f()(x)
```

which not only is longer and less readable but makes ```status``` a mutable variable which is not the intention of the programmer.