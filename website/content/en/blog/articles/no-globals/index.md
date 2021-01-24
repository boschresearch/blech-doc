---
date: 2021-01-24    
draft: true
title: "No global variables - please."
linkTitle: "No global variables"
description: >
    This article motivates and explains, why and how Blech avoids the use of global variables.
author: Franz-Josef Grosch
---

Much has be written about the problems with global variables.

Exaggerating, by Steve McConnell, the author of [Code Complete](https://www.amazon.com/Code-Complete-Practical-Handbook-Construction/dp/0735619670):
> The road to programming hell is paved with global variables.

<!-- Ironically, by Jack Ganssle in his article [Mars ate my spacecraft!](https://www.embedded.com/mars-ate-my-spacecraft/)
> Globals are responsible for all of the evil in the universe, from male pattern baldness to ozone depletion. -->

Metaphorically, by Jack Ganssle in his article [A pox on globals](https://www.embedded.com/a-pox-on-globals/)
> Globals are the Sirens of embedded systems programming. Don't get sucked in if you don't want to lose your ship or your sanity.

Substantiating, in the famous C2 wiki's section [Global Variables are Bad](https://wiki.c2.com/?GlobalVariablesAreBad)
> Code is generally clearer and easier to maintain when it does not use globals, but there are exceptions.

## Global variables in embedded programming

The requirements for embedded programming seem to justify exceptions to use globals in many situations.

Embedded calculations are usually activated in loops, which are repeated 
* periodicly after a regular time delta -- a periodic timer; 
* sporadicly on the arrival of an event -- an interrupt, a one-shot timer or an incomming message; or even 
* immediatly after the end of a calculation -- a main loop.

Between executions, calculations need to save their state. 
This is often implemented with global variables.

Communication with the environment uses inputs from sensors and interrupt service routines, and outputs to actuators and asynchronous function calls. 
Often input and output data are represented as global variables.

Dataflow between embedded calculations uses input and output ports. 
Often implementations of ports are just global variables.

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


In C, globals as well as static data declarations on file scope or procedure scope allocate storage at or before the beginning of program execution and the storage remains allocated until progam termination.

The given advice mitigates problems with globals:
* Static data on procedure scope reduces coupling between procedures.
* Static data on file scope reduce coupling between source files
* Disciplined use of access methods to a global object prevents direct data access.

In general it helps to prevent
* Non-locality, where any part of a program can read or modify global data.
* Namespace pollution, which creates the need to coordinate variable naming between independent components.
* Implicit coupling, which makes it difficult to test or separate those otherwise independent components.

Despite its undoubted benefit, the advice mainly recommends *hidden globals*, as C2 wiki section calls them, which still can create serious problems when it comes to data flow, concurrency, modularization and testing. 

## Singleton, Reentrant, Single Writer Multiple Reader


## Saving state between activations

Lets start with the problem of saving state between activations.

Typically the activation steps in embedded applications are triggered by the environment and need to save their state from one activation to the next.

This is typically handled with the help of a hidden global variable.
The following function `ìnit` is called once in order to initialize the state.
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
Explain C code.

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
Explain Blech code


Functions `init` and `step` cannot be reused in a different contexts, because both functions and all instances share the same hidden global `state`.

If the need for reuse occurs either code duplication or macros - templates in the case of C++ - are the easiest way to cope with this. 
Both need a code rewrite and further test effort and need to introduce manually a separate instance of hidden global `state`.

In Blech, the state is exclusive to every instance of `activity AllSteps`.
Running `AllSteps` in different contexts is just reuse:

```blech
struct Inputs
    let aIn: int32
    let bIn: int32
end

struct Outputs
    var aOut: int32
    var bOut: int32
end

activity TwoContexts (inputs: Inputs) (output: Outputs)    
    cobegin
        run AllSteps(inputs.aIn)(outputs.aOut)
    with
        run AllSteps(inputs.bIn)(outputs.bOut)
    end
end
```

Shortly explain Blech code.

Since every activity lives for subsequent activations the compiler allocates the state for every instance in hidden global memory.

In this example both instances of `activity AllSteps` live concurrently with each other, without having any data flow between them.

This brings us to the next problem of globals when implementing dataflow between different functionality in an embedded application.

## Dataflow between different functions

Assume a second embedded function `prepare_step` that prepares the input for function `step`.
For this calculation it uses the previous value of parameter `output` and the `input`.

To simplify the example, we assume it does not need to save internal state from one activation to the next.

```C

void prepare_step (int input, int *output) {
    *output = prepare_calculate(input, *output);
}
```

In order to integrate both functions we need a dataflow variable that can be allocated on the stack.

```C
void integrated_step (int input, int *output) {
    static int data_flow;
    prepare_step(input, &data_flow);
    step(data_flow, output);
}
```
Nevertheless, `function integrated_step` cannot be reused in different contexts because it calls `function step`, that internally uses a hidden global and cannot be used in more than one context.
We also cannot omit the hidden global `data_flow` because function `prepare_step` assumes exclusiv write access and uses the previous value of `data_flow` in its calculation.
Variable `data_flow` is misused to store a state between subsequent activations.

<!-- Therefore, we might as well use a `static int data_flow` variable and allocate it in hidden global memory. -->

Furthermore, we have to be careful not write to variable `data_flow`, from another function.
This would destroy the saved state.

Function `prepare_step` assumes exclusive write access to variable `data_flow`, because it uses the previous value in it's calculation.

<!-- Data flows from function `prepare_step` to function `step` in every activation step. 
Calling both functions sequentially expresses this. -->

In Blech the situation is much more relaxed for the programmer.

```blech 
activity PrepareAllSteps (input: int32) (output: int32)
    repeat
        output = prepare_calculate(input, output)
        await true
    end
end
```

Flexibly combine both functions

```blech
activity IntegratedSteps (input: int32) (output: int32)
    var data_flow: int32 = 0
    cobegin
        run AllSteps(data_flow)(output)
    with
        run PrepareAllSteps(input)(data_flow)
    end
end
```

The Blech compiler 
* creates a fresh memory location - as a pre-determined hidden global - for every local variable in an actity.
* guarantess the single-writer principle. A second activity trying to write to `data_flow` would be detected by the compiler.
* determines the write-before-read order, which always guarantes a causal data flow.
* distinguishes input and output parameter lists, where inputs a read-only while only outputs can be written.

Blech does not need hidden globals. While hidden globals are an improvement compared to normal globals, they create non-reentrant code,
which my cause problems when it comes to concurrency, modularization and testing.


## Concurrency

## Modularization

## Testing



Causality analysis, instance memory, cycle must be broken with prev.

Situation becomes even worse

<!-- Move this to a concurrency example -->
Furthermore we have to make sure, that we do not write to variable `data_flow` from two different functions.
The following integration does something completely different
```C
void one_integrated_step(int input, int *output) {
    int data_flow;
    one_prepare_step(input)(*data_flow)
    one_other_step(data_flow, *dataflow)
    *output = *data_flow
}
```



Again 
