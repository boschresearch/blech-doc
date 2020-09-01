---
title: "Model of execution"
linkTitle: "Model of execution"
weight: 10
description: >

---

## Reactive execution

Unlike classical desktop applications that solve a given task, a Blech application does not run in isolation by itself.
It interacts with a so-called _environment_ that triggers a _reaction_ of the Blech program.

Typically, the environment provides a set of _inputs_ to a Blech program. These inputs may, for example, be sensor readings.
The environment then expects the Blech program to perform some computations and finally return a set of updated _outputs_.
Outputs can be interpreted by the environment, for example, as set points for actuators.

We deliberately use the generic word "environment" because depending on the use case it may have a different form. 
It ranges from just a loop that calls the Blech application as soon as the last reaction has finished to a sophisticated real-time operating system which manages several tasks, timers and event queues.

The Blech program maintains its state from one reaction to the next.
Thus a reaction does not merely depend on the given inputs but also on the state of the program itself.

## Synchrony
Blech is a _synchronous_ language.
That means its semantics adhere to the "synchrony assumption".
In simple terms it states that a reaction happens instantaneously (takes no physical time).
Thus program execution proceeds in discrete reactions and there is no observable behaviour in between.

This is of course not implementable in reality but rather a guideline for semantics that has implications on language design and induces a set of crucial properties that make the programmer's life easier.

One implication is that inputs keep their value throughout the reaction. This prevents a volatile behaviour where two readings of the same variable in the same reaction may produce two different values.

The other implication  is that concurrent computations adhere to a [strict consistency](https://en.wikipedia.org/wiki/Consistency_model#Strict_consistency) notion.
In essence, this means that "a write to a variable by any thread needs to be seen instantaneously by all threads [...] it assumes concurrent writes to be impossible".
Therefore race conditions are excluded by design.
Since each concurrent thread of execution perceives the others as instantaneous, every shared variable must assume precisely one value throughout the reaction.
It must not be possible for a reader to read two different values for a shared variable within one reaction.
This would discern computation into (at least two) different logical time steps and violate the assumption that the computation happened instantaneously.

This semantics is very attractive to the programmer because concurrent programming becomes simple to understand and debug.
It is the single most crucial distinctive feature of synchronous programming languages in general, and Blech in particular.
Usually in asynchronous, thread-based programming this strict consistency notion is impossible to achieve in practice.
However strict consistency becomes possible in our setting because of two ingredients usually not present in asynchronous concurrent programming:
the distinction of individual reactions; and the distinction of a thread-local view and a global view on shared memory.

Synchronous languages differ in what programs they admit such that strict consistency is guaranteed. 
Such programs are called causally correct or simply _causal_.
The next section explains what this means for Blech.

## Causality

The strict consistency memory model excludes write conflicts by definition.
Since we think of program execution as reaction steps, this means causal programs must have at most one writer per shared variable in one reaction.
In Blech we restrict this even further and require that there is at most one writer within a fork-join scope which is potentially executed for multiple reactions.
This is made more precise in the chapter when we [explain the `cobegin` statement](../statements/#cobegin).

Furthermore, there is a "thread-local" view of shared variables and a "thread-global" view.
We require that in the thread-global view every shared variable is set to one value by the writer that all other threads may read.
However the writer-thread may update (and read) the variable multiple times locally.
Thus multiple values exist in the thread-local view but they are not observable by concurrent threads nor by the environment and the "illusion" of instantaneous updates is maintained.
Only the last written value is communicated to the concurrent readers.
Of course, "last" is to be understood with respect to the current reaction.
In essence, for every variable there is a write-before-read policy in every reaction.
This allows for normal sequential imperative programming within a thread and at the same time leverages the expressiveness and simplicity of synchronous concurrent programming.
Note that this deliberately excludes programs where threads are mutually (cyclically) dependent within a reaction.

{{% alert title="Important" color="warning" %}}

There is at most one writer per shared variable. The writer must finish its last writing operation to a shared variable in the current reaction before concurrent readers may read it.

{{% /alert %}}

The compiler phase that statically ensures a given Blech program is causal is called _causality analysis_.

