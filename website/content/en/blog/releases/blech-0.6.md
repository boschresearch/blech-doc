
---
title: "Blech version 0.6"
linkTitle: "Blech 0.6"
date: 2020-09-01
---

We are happy to announce a new release of the Blech compiler and language services for VS Code.

Language features are:
* The [syntax of the statement `run`](/docs/user-manual/controlflow/statements/#run) has changed. It now allows local variable declarations. [A `return` statement](/docs/user-manual/controlflow/statements/#return) may now have an activity call as an argument:
  * `run foo = Act()` 
  
    used to be `foo = run Act()` 
  * `run var foo = Act()` 
    
    Here `foo` is declared in-place and can be used after the `run` statement.
  * `return run Act()` 
  
    Here the value returned by `Act` is directly returned further up.
* It is now possible to reorder function parameters when linking to external C functions. This is useful to map Blech's input and output parameters to the single parameter list of a C function:

        @[CFunction(binding = "myCfunction($2, $1)")]
        extern function doStuff(a: nat8)(b: nat8)

* Some annotations may contain string literals. We now support single and (indented) multi line string literals. This is useful if you want to define the right-hand side of a macro as your C-binding:
        
        @[CFunction (binding = """
                               do {
                                 *$2 = $1;
                                 *$2 = *$2 + 1;
                               } while (0)
                               """)]
        extern function doStuff(a: nat8)(b: nat8)
        
    Note that you have to follow the Blech-C-interface when accessing Blech parameters from C. 
    `$1` is input parameter `a: nat8` which is passed by value because it has a simple type.
    `$2` is output parameter `b: nat8` which is passed by reference as a pointer.

On the technical side we have fixed a few bugs and issues and improved code generation.
The latter now uses "activity contexts" to store activity local data and [program counters](/docs/blechc-development/pctree/) instead of passing around individual values.
This is a preparation for the upcoming module system.