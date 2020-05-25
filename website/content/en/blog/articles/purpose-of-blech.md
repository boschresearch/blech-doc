
---
title: "The purpose of Blech"
linkTitle: "The purpose of Blech"
date: 2020-05-25
---

Blech is a new language that is aims to substantially boost productivity and the quality of applications in the embedded, reactive, safety- and realtime-critical domain.
Referred to in short as the embedded domain.

## Why Blech?

There is a huge difference between the environments of a desktop, a server, or a mobile application and a typical application in the embedded domain. 

### The domain is tough

Embedded applications usually run on dedicated hardware to enable interaction with its specific physical environment.
More often than not, the hardware is resource-constrained in terms of memory and processing power. 
To fulfill safety requirements, the code needs to be safe, secure, reliable, and portable.
Applications must be reactive because of realtime requirements, and deterministic to make reactions predictable and repeatable under test.

This mix of requirements imposes a huge burden on developers in terms of how to program their application.

In principle, there are two ways to organize the code: event-driven or threaded.

Event-driven functions cannot rely on a stack to maintain the state between consecutive events in a task. 
The programmer has to manually *rip* the stack, and maintain the state across multiple events.
Therefore, event-driven programs can be very efficient in terms of memory footprint and they do not need scheduling.
The disadvantage is that they are hard to write and even harder to read and reason about.

Threaded functions are easier to write and comprehend, since the program can be expressed as a sequence of actions, waiting for asynchronous input if needed.
The state between steps is preserved on the stack.
The big disadvantage is that each threaded function needs to allocate its maximum possible required stack during its existence, 
and the composition of threaded functions creates the need for pre-emptive or cooperative scheduling at run-time, which either is non-deterministic or non-reactive.

As a consequence, applications are often written in an event-driven style.

### C programming is like defusing a bomb

Many areas in software development have benefitted from improvements made to programming languages. 
Embedded systems are an exceptions to this. 
C remains to be the de-facto standard for development, although there are many flaws that need to be mitigated by tight coding conventions and static analysis tools.

Of course, there are several languages like Ada, C++, or Rust that have the potential to improve certain aspects of embedded development.
Due to its backwards compatability with C and its maturity, C++ is often preferred and used in many embedded projects.
Nevertheless, C++ as well as older (Ada) and newer (Rust) developments are all general-purpose languages, which only improve certain programming aspects and do not really reduce the complexity of embedded applications.

Blech is different.

## What is Blech?

Blech is a language that is specifically designed for safety- and realtime-critical, reactive, embedded programming. 
The cornerstones of Blech are its model of computation (MoC) and its simple integration with C.
Being a new language, it benefits from the progress in programming languages over the past 4 decades. 
With its domain focus, it is designed to guarantee important properties via the compiler.

### The Blech model of computation

Blech is a synchronous language.

In a nutshell, the synchronous model of computation allows to write threaded functions, which are compiled into an efficiently executable event-driven code that is deterministic.
For this purpose, it incorporates the step-wise execution of typical realtime, reactive applications into the language.

Blech allows to write subprograms, called *activities*, that execute in *steps*, as a sequence of actions which pause once a step is finished.
A synchronous language regards the trigger events that initiate these steps as the *ticks* of a clock. 
The ticks can either be periodically triggered by time, or aperiodically triggered by events.
The synchronous model of computation (MoC) assumes a minimum inter-arrival time between ticks, which defines the maximum execution time in order to complete a step.
Based on this assumption, which is very suitable for realtime-critical, reactive applications, the programming model can be abstracted to a perfect model, where every step, as a reaction to a tick, is executed immediately and runs to completion, before the next tick occurs.

A Blech activity is a sequential control flow of statements that finishes a step by pausing at an *await* statement. 
The await statement guards the continuation of the control flow with a condition, as soon as the next step is triggered by a tick.
These subprograms can be composed sequentially via normal control flow and concurrently via synchronous parallel composition.
The compiler guarantess deterministic execution of concurrently composed subprograms.

Actually, a concurrently composed application compiles to a sequential program that is driven by a clock.
A clock can be anything that drives a reactive application, for example
- a main loop
- a time-triggering environment
- an event-triggering environment

This MoC regains the simplicity of threaded programs, the composability of sequential subprograms, and the efficiency of event-driven program organisation. 

### Blech is a companion to C/C++

Blech compiles to *clean* C - the common subset of C and C++.
Therefore, Blech programs can easily be integrated into existing embedded projects.

Embedded hardware usually comes with driver software written in C.
Useful libraries written in C/C++ already exist, for almost everything.
There is no need to rewrite everything in Blech, existing C libraries can be used from Blech programs directly.

This 2-way integration simplifies the necessary separation between
- an asynchronous environment that drives the Blech program
- and the synchronous application written in Blech with the support of further C/C++ libraries.

Blech is a German word and roughly translates as bare metal.
As its name suggests, a Blech program can run in pretty much anything:

- directly on "the Blech" in an embedded device,
- on top of a realtime OS,
- as a safety-critical component integrated via some middleware,
- in combination with a simulation model.

### Blech is made for the safety- and realtime-critical, reactive, embedded domain

There is a list of requirements for Blech that has found its way into the language design:

- time-driven and event-driven program execution,
- predictable and deterministic semantics,
- synchronous concurrency,
- hard real-time,
- predictable memory usage and execution time,
- compile-time mechanism for structuring and variants,
- safe shared memory,
- safe type system,
- expressive and productive programming,
- a "cool" development environment.

The Blech core language is designed to resolve frequently encountered issues with C/C++.
With its domain focus and the synchronous MoC, we restrict the language to: 

- no global variables,
- no undefined behaviour,
- no pointer aliasing problems,
- no address arithmetic,
- no machine-dependent types,
- no overflow, underflow, division-by-zero,
- no index out of bounds,
- no integer promotion,
- no unsafe casts,
- no side-effects in conditions,
- no dynamic memory allocation,
- no uninitialised variables,
- no shadowing,
- no race-conditions in concurrent code,
- no dynamic thread generation.

These properties are guaranteed by the type system and several further compile-time analyses.
Virtually anything that is usually required by embedded, realtime, or safety-oriented coding-conventions like MISRA C/C++ can be handled by the compiler.


### The future

Blech, as currently released, is a working first step.
There is a longer road map for making it a richer language.

Some parts of the core language have not been implemented yet: 
- enumeration types,
- references as a tractable alternative to pointers,
- synchronous events, which can be emitted from the program and are reset by the run-time system.

Currently we are working on the module system, that incorporates cycle-free dependency management of separately compilable modules into the language.
The module system shall support, information hiding, black-box reuse and white-box testing.
It allows to deliver Blech modules as pre-compiled libraries with C header files and Blech module signatures.

We have planned mechanisms for: 
- error handling,
- object-based programming,
- borrow-checking,
- type-safe generics with predictable code size.

Besides the already working VS Code language server plug-in we envision a set of specific tools for Blech: 
- a test framework for regression tests of Blech components,
- a build system for mixed Blech/C projects,
- a time-travel debugger for concurrent and parallel programs,
- a deployment support tool.

To follow upon and participate in the development visit the Blech homepage: [www.blech-lang.org](www.blech-lang.org).
The documentation, examples, and plans for the evolution of the language can be found on the website.

We are convinced and we hope that Blech can substantially boost productivity and the quality of safety- and realtime-critical, reactive, embedded applications.

Stay tuned or - even better - participate.

