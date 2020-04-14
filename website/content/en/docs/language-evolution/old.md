---
toc_hide: true
title: "Old proposals"
linkTitle: "Old proposals"
weight: 4
description: >
  Old evolution proposals for the Blech language.
---


## Accessing the Blech environment

### Environment variables

Environment variables are either read-only inputs or read-write outputs.
Every environment variables has a counterpart in the Blech environment.
Therefore, they are annotated as `@[CInput ...]` or `@[COutput ...]`.
Environment variables are classified by the keyword `extern`. 
A `extern let` definition must be annotated with a `@[CInput ...]`.
An `extern var` definition must be annotated with a `@[COutput ...]`. 

```blech
@[CInput (binding = "theSensor", header = "sensors.h")]
extern let sensor: uint8 

@[COutput (binding = "spiIsReady", header = "spi.h")]
extern var spiReady: bool
```

Since the external C variables bound to the environment variables live in the environment they do not follow the synchronous semantics. 
They might be `volatile` changing their value during a reaction. 
They might be read or written asynchronously by the environment.

In order to synchronize these C variables, the Blech program holds a buffered value of the external value in the environment variable.

The Blech runtime system takes care of the synchronisation.
Before the reaction, the values of all external C variables are copied into the environment variable.
After the reaction, the values of the `extern var` variables are copied into the external C variables.

The implementation is allowed to distribute these copying operations into the code generated for each activity, that defines `extern` variables.

Environment variables can only be declared in an `activity`.
Functions can only access environment variables via the parameter list.

### External read-write C variables are singletons

An external C variable is a global variable, which is in danger to be accessed concurrently via the environment variable.
While Blech in general prevents this danger by not allowing the declaration of global variables at all, it needs more effort to guarantee this for external C variables.


```blech
activity handleCVariables()
    
    @[CInput (binding = "theSensor", header = "sensors.h")]
    extern let sensor: uint8
    @[COutput (binding = "spiIsReady", header = "spi.h")]
    extern var spiReady: bool

    repeat
        if sensor > 10 then
            spiReady = true
        end
        await true
    end
end
```


In order to comply to the single-writer principle, declaring an `extern var` variable in an activity restricts this activity to be instantiated only once.
The declared variable is a `singleton` and does not allow multiple instances.
An activity that declares a singleton cannot be called concurrently, but only sequentially.
Note that this is only necessary for `extern var` declarations.
An `extern let` variable is *not* a `singleton`.
Different instances of such an activity can have separate buffers of the external C variable, which might have different values in the same reaction if the external C variable is `volatile`.
It is the responsibility of the programmer not to share external C variables in different `extern var` declarations.
Two or more `extern let` declarations are allowed to have the same annotation `@[CInput ...]`.

### Singletons and separate compilation

If a module exports an activity that contains a singleton, the signature needs to reflect this in order to enable a correct causality analysis.
The signature for the above activity `handleCVariables` looks like the following

```blech
singleton handleCVariables.spiReady 
activity handleCVariables()
```

It shows the activities prototype, exposes the unique names of the singletons and shows their annotations. 
Showing the annotations allows to check the binding to C variables also for modules where the implementation is hidden.

### The diamond call problem

If an activity declares a singleton, it still can be called from several activities.

```blech
activity firstUsage()
    run handleCVariables()
end

activity secondUsage()
    run handleCVariables()
end
```

Again `firstUsage` and `secondUsage` can not be called concurrently.

In order to check this via the signature, the calling activities, inherits the singletons from the called activity.
In a module signature these activities occur as follows


```blech
singleton handleCVariables.spiReady
activity firstUsage()

singleton handleCVariables.spiReady
activity secondUsage()

```

If we combine activities with different singletons, they must not be called concurrently, if they share common singletons.
For example assume the following module signature.

```blech
signature Module 

singleton handleOtherCVariable.theExternVar
activity handleOtherCVariable()
```

A calling activity might inherit all singletons
```blech
import Module

activity thirdUsage()
    cobegin
        run handleCVariables()
    with
        run handleOtherCVariable()
    end
end
```

The deduced signature is

```blech
import Module

singleton handleCVariables.spiReady, 
          Module.handleOtherCVariable.theExternVar
activity thirdUsage()
```

Activity `thirdUsage` cannot be called concurrently to `firstUsage` or `secondUsage` because their singletons overlap.

### Structured access to external variables


Environment variables can also be referenced from a `struct` type, like normal Blech variables.

```blech
struct MyCVariables
    var x: int32
    let ref sensor: uint8
    var ref spiReady: bool
end
```


```blech
activity referToCVariables()
    @[CInput (binding = "theSensor", header = "sensors.h")]
    extern let sensor: uint8 

    @[COutput (binding = "spiIsReady", header = "spi.h")]
    extern var spiReady: bool

    var mcvs: MyCVariables = { x = 0, sensor = sensor, spiReady = spiReady }
end
```

If we use both activities `referToCVariables` and `handleCVariables` in a Blech program we obviously made a mistake.
Both activities write to the same external C Variable `"spiIsReady"`.
The single-writer principle is broken.
The semantics of the program is undefined concerning the environment access.
In general working with externals is unsafe.
In this particular case, it is the responsibility of the programmer to take care, not to share the same `COutput` between different `extern var` declarations.

The signatures of both activities cannot reveal this error.
```blech
singleton referToCVariables.spiReady
activity referToCVariables()

singleton handleCVariables.spiReady
activity handleCVariables()
```

Idea: It should be the responsibility. of the compiler to collect the environment of a Blech program across all modules in order to allow for a code review supported by such a description file.


Hints: `extern var` and `extern let` declarations cannot be declared inside functions.
Use `extern let` declarations when possible in order to prevent the propagation of the singletons.

Since signatures are deduced by the compiler, the whole checking of singletons and the generation of appropriate signatures is done by the compiler.

Note: A conventional embedded program is full of singletons, not only created by `extern var` declarations, but especially by global variables.
In order to maintain the single-writer principle by programming discipline it is almost inevitable, that all functions are only called once in a task list. This makes reuse and testing extremely difficult. Only the rather small number of services is reusable and rather easily testable.