# Embedded realtime programming


## User Manual

### Annotations, pragmas and doc comments

As explained before Blech allows annotations to declarations. 
In principle every declaration can have one or more annotations.

Currently we use annotations for the entry point of a Blech program and for the binding to C implementations.

```blech
@[EntryPoint]
activity ... end

@[CConst(binding="A_C_CONST")]
extern const ABlechConst
```

C bindings have an optional header parameter where the necessary header file can be defined.

In order to prevent repetition we also allow pragmas which are annotations to the current scope. 
Pragmas can occur where members or statements are allowed.
Pragmas are similar to annotations but start with `@@`.

Currently we use pragmas for central C include file definitions in order to prevent repitition of header definitions in annotations.

```blech
@@[CInclude(header="myheader.h")]

@[CConst(binding="A_C_CONST")]
extern const ABlechConst

@[CConst(binding="ANOTHER_C_CONST")]
extern const AnotherBlechConst
```

Pragmas can be used in order to define metadata for a whole compilation unit or to give directives to the compiler - valid to the scope where they occur.
Imagine the following - which is currently not implemented.

```blech
@@[Link(lib="myclib.a")]

function f(x: int32)
    if x > 10 then
        @@[AllowShadowing]
        var x: float32
        x = 42.0
    end
end
```

Annotations also allow to attach doc comments to the abstract syntax tree.
Line doc comments and block doc comments are stored as annotations.

```blech
/// a line doc comment
const myConst = 11

/** 
    a block doc comment
*/
function myDocumentedFunc()
end
```

Parsed doc comments allow to reproduce documentation in `.blh` signature files and in generated code.


### Blech's C interface

C can be bound to Blech via annotations.

In principal every Blech declarable entity can be implemented in C. 
Via an annotation a Blech `extern` declaration can be bound to a C implementation. 
It is the responsibility of the programmer to make sure that the C implementation provides what the Blech definition guarantees. 

Currently we support `extern const` and `extern function`.

```blech
@[CConst(binding = "5 * A_C_CONST", header = "myconsts.h")]
extern const blech_const
```

`blech_const` is implemented as a C constant.
Assume we have the following macro in `myconsts.h`

```c
#define A_C_CONST 42
```

The generated code for the above extern Blech constant is also a macro that requires the include of the appropriate .h-file.

```c
// C headers for extern declarations
#include "myconsts.h"

// extern Blech constants
#define blc_blech_const (5 * A_C_CONST)
```

An extern Blech function comes in two flavours.
- 1. As a direct binding too a C function and its .h-file
- 2. As a wrapper to be written in C.

The first case is easy

```blech
@[CFunction (binding = "ceil", header = "math.h")]
extern function ceiling(i: float64) returns float64
```

The generated code is again simply a macro.

```c
// C headers for extern declarations
#include "math.h"

// extern Blech functions
#define blc_ceiling(blc_i) (ceil(blc_i))
```

The second case defines an extern function without a direct C binding.
Assume the following code in a Blech module `wrapper.blc`

```blech
extern function myCFunction(i: float64) returns float64
```

In this case only a prototype is generated in the module's header file `blech/wrapper.h`.

```blech
// extern functions to be implemented in C

blc_float64 blc_wrapper_myCFunction (const blc_float64 blc_i);
```

The implementation suitable to the generated prototype has to be provided by the programmer. 
To guarantee the interface the generated .h-file has to be included.


Extern declarations could also be used for `type, typealias, param, var, let, activity` and will be incrementally added.

Since Blech does not allow global variables the local usage of `extern var` and `extern let` creates a "static" local - in the sense of C - and requires the surrounding subprogram or struct declaration to be classified as a `singleton`. 
The same should be necessary for activities written in C that only can represent the state from step to step in global variables which make these activities `singleton` too.

