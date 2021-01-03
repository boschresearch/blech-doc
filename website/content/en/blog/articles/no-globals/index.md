---
date: 2021-01-03
title: "No global variables - please."
linkTitle: "No global variables"
description: >
    This article motivates and explains, why and how Blech avoids the use of global variables and global state.
author: Franz-Josef Grosch
---

Much has be written about the problems with global variables and global state.

Exaggerating, by Steve McConnell, the author of [Code Complete](https://www.amazon.com/Code-Complete-Practical-Handbook-Construction/dp/0735619670):
> The road to programming hell is paved with global variables.

Ironically, by Jack Ganssle in his article [Mars ate my spacecraft!](https://www.embedded.com/mars-ate-my-spacecraft/)
> Globals are responsible for all of the evil in the universe, from male pattern baldness to ozone depletion.

Substantiating, in the famous C2 wiki's section [Global Variables are Bad](https://wiki.c2.com/?GlobalVariablesAreBad)
> Code is generally clearer and easier to maintain when it does not use globals, but there are exceptions.

The requirements of embedded programming seem to justify these exceptions in too many situations. 
Globals are so ubiquitous, that embedded developers do not even recognize that they already entered programming hell, and attribute the loss of their hair to the fact that they are male.
We are convinced that embedded developers cannot be blamed for this.

With todays embedded technology, the problems with globals can be mitigated but they cannot be eliminated.
In the following we will sketch 
* why the mitigating methods to handle global state in embedded programs are not sufficient,
* how concurrency in embedded programs - tasks and interrupts - increase the problems, and 
* how Blech substitutes globals with local activity variables, synchronous concurrency and control-flow over time steps.
