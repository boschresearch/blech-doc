---
date: 2021-01-03
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

Embedded calculations are usually executed in loops, which are repeated 
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




## Singleton, Reentrant, Single Writer Multiple Reader