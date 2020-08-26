
---
title: "Blech version 0.5.4"
linkTitle: "Blech 0.5.4"
date: 2020-08-28
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
* Some annotations may contain string literals. We now support single and (indented) multi line string literals.

On the technical side we have fixed a few bugs and issues and improved code generation.
The latter now uses "activity contexts" to store activity local data and [program counters](/docs/blechc-development/pctree/) instead of passing around individual values.
This is a preparation for the upcoming module system.