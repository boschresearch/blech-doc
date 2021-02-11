---
date: 2021-02-11    
draft: true
title: "No global variables - please."
linkTitle: "No global variables"
description: >
    This article motivates and explains, why and how Blech avoids the use of global variables.
author: Franz-Josef Grosch
---

Much has been written about the problems with global variables.

Steve McConnell, the author of [Code Complete](https://www.amazon.com/Code-Complete-Practical-Handbook-Construction/dp/0735619670), warns us:
> The road to programming hell is paved with global variables.

<!-- Ironically, by Jack Ganssle in his article [Mars ate my spacecraft!](https://www.embedded.com/mars-ate-my-spacecraft/)
> Globals are responsible for all of the evil in the universe, from male pattern baldness to ozone depletion. -->

In his article [A pox on globals](https://www.embedded.com/a-pox-on-globals/) Jack Ganssle refers to greek mythology to advise against globals:
> Globals are the Sirens of embedded systems programming. Don't get sucked in if you don't want to lose your ship or your sanity.

The famous C2 wiki explains why [Global Variables are Bad](https://wiki.c2.com/?GlobalVariablesAreBad):
> Code is generally clearer and easier to maintain when it does not use globals, but there are exceptions.

## Global variables in embedded programming

The requirements for embedded programming seem to justify exceptions to use globals in many situations.

Embedded calculations are usually activated in loops, which are repeated 
* periodicly after a regular time delta -- a periodic timer; 
* sporadicly on the arrival of an event -- an interrupt, a one-shot timer or an incomming message; or even 
* immediately after the end of a calculation -- a main loop.

Between executions, calculations need to save their state. 
This is often implemented with global variables.

Dataflow between embedded calculations uses input and output ports. 
Often implementations of ports are just global variables.

Communication with the environment uses inputs from sensors and interrupt service routines, 
as well as outputs to actuators and asynchronous function calls. 
Often input and output data are represented as global variables.

Globals are so ubiquitous, that embedded developers do not even recognize when they begin to lose their ship and their mental sanity on their way into programming hell.

We are convinced that embedded developers cannot be blamed for this.
With todays embedded technology, the problems with globals can be mitigated but they cannot be eliminated.
In the following we will sketch 
* why the mitigating methods to handle globals in embedded programs are not sufficient,
* how concurrency in embedded programs - tasks and interrupts - increase the problems, and 
* how Blech substitutes globals with local activity variables, synchronous concurrency and control-flow over time steps.

## Ways to avoid or reduce the risk of globals

Philip Koopman's book on [Better Embedded System Software](http://www.koopman.us/) explains in  [Chapter 19, Global Variables Are Evil](http://www.koopman.us/bess/chap19_globals.pdf) the problems with globals and gives pratical advice on how to avoid and reduce their risks:

1. If optimization forces you to use globals, get a better compiler or a faster processor.
2. Move the global inside the procedure that needs it.
3. Make a shared variable quasi-global instead of global.
4. Make the global an object, and provide access methods.
5. If you still have to use a global, spend a lot of effort making it as clean and well documented as possible.


In C, globals as well as static data declarations on file scope or procedure scope allocate storage at or before the beginning of program execution and the storage remains allocated until program termination.

The given advice mitigates problems with globals:
* Static data on procedure scope reduces coupling between procedures.
* Static data on file scope reduce coupling between source files
* Disciplined use of access methods to a global object prevents direct data access.

In general it helps to prevent
* non-locality, where any part of a program can read or modify global data,
* namespace pollution, which creates the need to coordinate variable naming between independent components, and
* implicit coupling, which makes it difficult to test or separate those otherwise independent components.

Despite its undoubted benefit, this advice mainly recommends *hidden globals*, as C2 wiki section calls them, which still can create serious problems when it comes to data flow, concurrency, modularization and testing. 


## Saving state between activations

Lets start with the problem of saving state between activations.

Typically the activation steps in embedded applications are triggered by the environment and need to save their state from one activation to the next.

This is typically handled with the help of a hidden global variable.
The following function `init` is called once in order to initialize the state.
Function `step` is meant to be called unconditionally in every activation.
It uses the `input` and the `state` from the previous activation, 
and updates the `output` and the `state`.

```C
static int state;

void init () {
    state = initialize();
}

void step (int input, int *output) {
    *output = calculate(input, state);
    state = next_state(input, *output, state);
}
``` 

In Blech, all activation steps are expressed in the control flow of an `activity`.

```blech
activity AllSteps (input: int32) (output: int32)
    var state: int32
    state = initialize()  // init
    repeat
        output = calculate(input, state) // step
        state = next_state(input, output, state)
        await true // unconditionally await the next activation
    end
end
```

Variable `state` becomes a local variable in activity `AllSteps`.
First the state is initialized.  
Then the step calculation is repeated in every activation starting with the first immediately after initialization.
The step calculation is repeated unconditionally in every activation.


The functions `init` and `step` cannot be reused in a different contexts, because both functions and all instances share the same hidden global `state`.

If the need for reuse occurs either code duplication or macros - templates in the case of C++ - are the easiest way to cope with this. 
Both need a code rewrite and further test effort and need to introduce manually a separate instance of hidden global `state`.

In Blech, the state is exclusive to every instance of activity `AllSteps`.
Running `AllSteps` in different contexts is just reuse:

```blech
activity TwoContexts (aIn: int32, bIn: int32) 
                     (aOut: int32, bOut: int32)    
    cobegin
        run AllSteps(aIn)(aOut)
    with
        run AllSteps(bIn)(bOut)
    end
end
```

Activity `AllSteps` is instantiated twice with separate local memory.
Both instances run concurrently (`cobegin`) starting with `initialize` and repeatedly calculating one step.

Since every activity lives for subsequent activations the compiler allocates the state for every instance in hidden global memory.
Both instances are completely independent and do not exchange any data.

This brings us to the next problem of globals when implementing dataflow between different computations in an embedded application.

## Dataflow between different functions

Assume a second embedded function `prepare_step` that prepares the input for function `step`.
For this calculation it uses the previous value of parameter `output` and the current `input`.
To simplify the example, we assume it does not need to save internal state from one activation to the next.

```C
void prepare_step (int input, int *output) {
    *output = prepare_calculate(input, *output);
}
```

In order to integrate both functions we need a dataflow variable.

```C
void integrated_step (int input, int *output) {
    static int data_flow;
    prepare_step(input, &data_flow);
    step(data_flow, output);
}
```

Allocating variable `data_flow` on the stack would not be correct.
Function `prepare_step` misuses variable `data_flow` to store the `output` between subsequent activations.
We need variable `data_flow` as a hidden global because function `prepare_step` assumes exclusive write access and uses the previous value of `data_flow` in its calculation.

Furthermore, we have to be careful not to write variable `data_flow` from any other function.
This would destroy the saved state.

<!-- Data flows from function `prepare_step` to function `step` in every activation step. 
Calling both functions sequentially expresses this. -->

In Blech the situation is much more relaxed for the programmer.

Activity `PrepareAllSteps` repeats the the calculation in every activation. 
```blech 
activity PrepareAllSteps (input: int32) (output: int32)
    repeat
        output = prepare_calculate(input, output)
        await true
    end
end
```

Both independent activities are concurrently composed using `cobegin` and a variable for data flow between both activities.

```blech
activity IntegratedSteps (input: int32) (output: int32)
    var data_flow: int32 = 0
    cobegin
        run PrepareAllSteps(input)(data_flow)
    with
        run AllSteps(data_flow)(output)
    end
end
```

Both activities are activated synchronously.
Data flows from the output of `PrepareAllSteps` to the input of `AllSteps` in every activation.

The Blech compiler does all the magic.
* It creates a fresh memory location - as a pre-determined hidden global - for every local variable in an actity.
* It guarantess the single-writer principle - a second activity trying to write to `data_flow` would be detected by the compiler.
* It determines the write-before-read order, which always guarantees a causal data flow.
* It distinguishes input and output parameter lists, where inputs a read-only while only outputs can be written.


## The problem with hidden globals

While hidden globals are an improvement compared to normal globals, functions that use them still change the program state.
This may cause additional problems when it comes to concurrency, modularization and testing.

### Concurrency

<!-- Concurrency and parallelism are obviously related, but actually separate ideas. -->

Following the Go blog post [Concurrency is not parallelism](https://blog.golang.org/waza-talk), 
concurrency is about structuring a program into independent computations, so that you *maybe* can use parallelism to do a better job by executing it with separate hardware, on parallel cores, or distributed control units. 
<!-- explains the differences: 

* *Concurrency* is the *composition* of independent computations. It's about structure and *dealing* with a lot of things at once.

* *Parallelism* is the simultaneous *execution* of (possibly related) computations. Its about execution and *doing* a lot of things at once.
 -->
<!-- concurrency is about structuring a program, so that you *maybe* can use parallelism to do a better job by executing it with separate hardware, on parallel cores, or distributed control units.  -->

<!-- Parallelism is not the goal of concurrency, the goal is a good structure.
Concurrency allows to break a program into independent pieces. 
Communication is the means to coordinate the execution of those pieces.  -->

In this sense, embedded software usually contains a lot of computations that are developed independently and composed concurrently.
Often, these computations are scheduled periodicly or sporadicly by an execution framework and communicate via dataflow.

Functions that implement dataflow via globals are implicitly coupled and cannot be regarded as independent computations, that are easily composed concurrently.
Even if the the dataflow dependencies are injected via hidden globals, an in-depth knowledge about the use of these globals is required in order to coordinate the schedule.

Functions that use hidden globals internally are implicitly coupled in every call. 
To prevent unpredictable or even corrupted state they usually must not be called more than once sequentially, concurrently or in parallel during a periodic, sporadic or main-loop activation.
If functions are scheduled with different rates maintaining a consistent state becomes even more difficult.

In Blech an `activity` is used to structure an independent computation. 
An `activity` represents a potentially infinite sequence of reactions and therefore can save its state in local variables.
There is no need for global variables and Blech does not have them.
Activities are truely independent and dataflow dependencies are injected when activities are called using the `run` statement.

Activities are concurrently composed using the `cobegin` control flow statement.
The compiler generates a causal data flow through all concurrent activities.
If the data flow within one reaction contains a cycle, the compiler detects this and the programmer has to break that cycle by accessing the value of the previous computation with the `prev` operator.

### Modularization

Modularization decomposes a large program into modules that logically group related code.
Modules usually have a narrow interface with clear semantics
and can be reused (imported) in different contexts.

If a module exports functions that directly or indirectly use hidden globals it might loose these benefits.

* The module's interface is not only defined by the exported functions but also by it's hidden state.
* The reuse (import) might be limited to a single context.

In Blech, the absence of globals allows to modularize a large program, according to the principles of high cohesion and low coupling.
Blech modules are usually separately testable and reusable in different contexts.

### Testing

When it comes to testing functions that use hidden globals,
we have to make sure, that every test case sets up the correct internal state.

Large programs that mix globals and hidden globals - which happens more often then you might imagine - tend to become tightly coupled.
In extreme cases it might become impossible to separately test a unit without setting up the state of the whole system.

In Blech, the absence of globals and concurrent composition of activities make testing of independent computations easy.
Typically a test looks like the following:

```blech
activity Test ()
    var input
    var output
    cobegin
        run CreateInputs()(input)
    with
        run ActivityUnderTest(input)(output)
    with
        run TestAgainstExpectedOutput(output)
    end
end
```

## One more thing

In general Blech has no global variables and does not need them.

As soon as a Blech program communicates with its environment by using inputs from sensors and interrupt service routines, 
as well as creating outputs to actuators and asynchronous function calls, Blech makes an exception and allows for external globals.
Nevertheless, these only sum up to a few, well-documented globals.

Furthermore the compiler can detect and prevent concurrent accesses to globals via *singleton inference* - but this is a topic for another article.

