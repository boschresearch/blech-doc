
---
title: "Welcome to the Blech language"
linkTitle: "Welcome"
date: 2020-05-18
---

Blech is a new language that is aiming to substantially boost productivity and quality of safety- and realtime-critical embedded applications.

## The embedded technology stack is tough

There is a huge difference between the resource-rich environments of a desktop, a server, or a mobile and a typical embedded system.

Embedded developers are constantly challenged to cram more into scarce resources - more features into small memory and predictable real-time behaviour into comparably slow processors.
Embedded applications - often safety-critical - are expected to run much more reliable than their desktop and mobile counterparts, a frequent restart or a switch-over is usually not possible.
Different to user-input in desktop-applications and socket-input in server-applications, data arrives from a vast number of asynchronous sources and must get routed as needed. 

The embedded applications itself are usually composed from concurrent functionality:
- even simple systems run interrupt service routines concurrently with a main loop-driven application,
- additionally, mid-size applications concurrently compose time-driven or event-driven tasks scheduled on a single processor system,
- on top of this, large systems compose parallel tasks to applications running on several cores.

The mix of tight resource-limitations and the need for concurrent composition leads to a programming style that tries to combine the memory-efficiency of an event-driven program organisation with the runtime-utilization of preemptively scheduled threads.

Event-driven programs cannot rely on a stack to maintain the state between consecutive events in a task. 
The programmer has to manually *rip* the stack, and maintain state across multiple events.
Therefore, event-driven programs can be very efficient in terms of memory footprint, but they are hard to write and even harder to read and reason about.

Threaded programs are easier to write and comprehend, the program can be expressed as a sequence of actions, waiting for asynchronous input if needed.
Being pre-emptively scheduled, threads do not delay each other, which makes real-time requirements easier to fulfill.
The disadvantage is that each thread needs to allocate it's maximum possible required stack during its existence.

Neither high memory requirements nor delayed real-time reaction are an option for most embedded systems.
Therefore, the typical embedded programming style usually tries to combine low memory usage of event-driven programmming with the good real-time response of pre-emptively scheduled tasks.

The price to pay is high:
- Programs are hard to write, to read, and to reason about.
- State is managed in global variables, which renders reentrancy almost to zero.
- Dataflow between scheduled tasks opens the door to all the known problems of threads and shared memory.
- Multi-core deployments do not fullfil the expectations concerning speed-up.
- The runtime-behaviour is non-deterministic, due to pre-emptive scheduling.

Despite all the tools that try to mitigate these difficulties, the usage of the technology stack for embedded programming remains a tough task.

## Why Blech?

Many areas in software development have benefitted from improvements made to programming languages. 
Embedded systems are an exceptions to this. 
The design of a compelling language to replace C for embedded systems development is largely missing.

There are several languages like Ada, C++, or Rust that have the potential to improve on certain aspects of embedded development.
Due to its backwards compatability to C and its maturity, C++ is often preferred and used in many embedded projects.
Nevertheless, C++ as well as older (Ada) and newer (Rust) developments are all general purpose languages, which only improve on certain programming aspects and do not really reduce the complexity of of the technology stack necessary for embedded programming.
As a consequence C remains to be the de-facto standard for embedded system development.

**Blech is different.** 

It is a language, that is specifically designed for embedded, reactive, real-time critical programming. 
The cornerstones of Blech are its model of computation (MoC) and its simple integration with C.
Being a new language in can profit from the progress in programming languages in the past 4 decades. 
Being focussed on embedded programming it can be designed to support important properties via the compiler.

## The Blech MoC

Blech is a synchronous language.

In a nutshell, a synchronous language incorporates the step-wise execution of an embedded task into the language.
Blech allows to write subprograms (called activities), that execute in time-steps. 
The ticks of a *clock* drive a sequence of actions, that can await conditions to continue the control flow in the next tick.
These subprograms can be composed sequentially via normal control-flow and concurrently via synchronous parallel composition.
The compiler guarantess deterministic execution of concurrently composed subprograms.

Actually, a concurrently composed application compiles to a sequential program if it is driven by one clock and will eventually compile to a parallel program if it is driven by several clocks.
A clock can be anything that drives an embedded application, for example
- a main loop
- a periodic time-triggered task
- a sporadic event-triggered task

This MoC regains the simplicity of threaded programs, the composability of sequential subprograms, the efficiency of event-driven program organisation, 
and the ability to deploy a Blech program to
- a single task
- to several scheduled task
- or to several cores.

## The Blech-C integration

Blech compiles to *clean* C - the common subset of C and C++.
Therefore, Blech programs can easily be integrated into existing embedded projects.

Embedded hardware usually comes with driver software written in C.
There is no need to rewrite everything in Blech, existing C libraries can be used from Blech programs directly.

This 2-way integration simplifies the necessary separation between
- an asynchronous environment that drives the Blech program
- and the synchronous application written in Blech with the support of further C libraries.

## Progress in embedded language design

There is a list of requirements for Blech, that has found its way into the language design:

- Time-driven and event-driven program execution
- Predictable and deterministic semantics
- Synchronous concurrency
- Hard real-time
- Bounded memory usage and execution time
- Parallel programming for multi-core systems
- Support for deployment and variable placement
- Compile-time mechanism for structuring and variants
- Safe shared memory
- Safe type system
- Expressive and productive language
- A "cool" development environment.

The core language is designed to eliminate frequent difficulties with C.
With the embedded focus and the synchronous MoC, we restrict the language to: 

- no global variables
- no undefined behaviour
- no pointer aliasing problems
- no adress arithmetic
- no machine-dependent types
- no overflow, underflow, division-by-zero
- no index out of bounds
- no integer promotion
- no unsafe casts
- no side-effects in conditions
- no dynamic memory allocation
- no uninitialised variables
- no shadowing
- no race-conditions in concurrent code
- no dynamic thread generation

These properties are guaranteed by the type system, and several further compile-time analyses.
Virtually anything that is usually forbidden by embedded coding conventions or MISRA rules shall be handled by the compiler.


## The future

Blech, as currently released, is a working first step.
There is a longer road map for making it a richer language.

Some parts of the core language are not implemented yet
- enumeration types,
- references as tractable alternative for pointers,
- synchronous events, which can be emitted from the program and are reset by the run-time system

Currently we are working on the module system, that incorporates cycle-free dependency management of separately compilable modules into the language.
The module system shall support, information hiding, black-box reuse and white-box testing.
It allows to deliver Blech modules as pre-compiled libraries with C header files and Blech module signatures.

We have planned mechanisms for: 
- error handling
- object-based programming
- borrow-checking
- type-safe generics, with predictable code size

Besides, the already working VS Code language server plug-in we envision a set of tools, specific for Blech: 
- a test framework for regression tests of Blech components
- a build system for mixed Blech/C projects
- a time-travel debugger for concurrent and parallel programs
- a deployment support tool.

One can follow and participate in the development via the Blech homepage: [www.blech-lang.org](www.blech-lang.org).
The documentation, examples and the plans for the language evolution can be found on the website.

We are convinced and we hope that Blech can substantially boost productivity and quality of safety- and realtime-critical embedded applications.

Stay tuned or - even better - participate.

