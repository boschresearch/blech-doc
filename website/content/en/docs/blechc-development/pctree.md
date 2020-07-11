---
title: "Program counter trees"
linkTitle: "PC trees"
weight: 20
description: >
  This explains the how "program counter" variables are used to memorise the control flow location(s) a Blech program resides in and how such program counters are managed in a tree structure in the code generator.
---

## Program counters
An activity's program state is given by the position(s) which control flow resides in and the evaluation of local variables and parameters.

This information is stored in a data structure which we call the *activity context*.
In particular, the control flow position(s) are given by those fields in the activity context which we call *program counters*.

Remember that the control flow of an activity is decomposed into a block graph after causality analysis. 
The individual blocks are *scheduled* (ordered) according to a topological sort algorithm. *(Details on the block graph are to be documented elsewhere)*.

The value of a program counter identifies the block that the control flow of an activity is currently in. 
For block number `i` the corresponding program counter has value `2i` if control flow is about to enter this block in the current reaction step. 
The program counter has value `2i + 1` if block `i` will be entered in the *next* reaction.
A program counter which is `0` indicates that control flow has terminated (in the corresponding thread of execution, see below).

An activity may contain concurrent code (expressed by the `cobegin` statement) and therefore control flow may be forked into several *threads of execution*.
This is why an activity may reside in *several* control flow points at the same time.
Each thread is represented by an individual program counter.
Thus there is always at least one program counter for the activities *root thread* and possibly more for subthreads which are forked by `cobegin`.

## PC tree
The Blech compiler constructs a so-called program counter tree (pc tree) for every activity.
```fsharp
type PCtree =
    {
        mainpc: ParamDecl
        thread: Thread
        subPCs: PCtree list
    }
```
A pc tree corresponds to a thread and maintains the program counter `mainpc` for this `thread`.
If this thread forks control flow then `subPCs` contains a list of corresponding subthread program counter trees.
The activity context of a single-threaded activity will only have a flat pc tree in which `subPCs` is an empty list.

{{< alert title="Note" color="info" >}}
A pc tree corresponds to one activity only.
Subactivities which are possibly called have their own activity context with their own pc trees.
{{< /alert >}}
{{< alert title="Note" color="info" >}}
The pc tree will be flattened to a list during the generation of C code. This is because the tree structure is helpful *during* code generation but the generated C code itself does not benefit from a nested tree structure and would only clutter type definitions.
{{< /alert >}}

## Constructing the tree
The only function for constructing pc trees which is used outside the `CodeGenContext.fs` file is `Compilation.addPc`.
Every time a new block is translated in `ActivityTranslator.fs` this function is called once:
```fsharp
curComp := Compilation.addPc !curComp block pc
```
The given `pc` is a `ParamDecl` which contains all info about the program counter variable itself.
The given `block` is a `Block` instance corresponding to this program counter and contains all necessary thread information.
`addPc` returns a new `Compilation` instance.

The logics of `addPc` are rather simple:
 - if the given compilation does not yet have an activity context (i.e. we have just started translating the very first block of this activity), create a new context with a new pc tree.
 - if the given compilation has an activity context and its pc tree already contains the given program counter, do nothing and return the unmodified compilation (happens when we translate the second, third,... n-th block along the same thread of execution)
 - otherwise there is an activity context with a pc tree which however does not yet have this particular program counter --> call `PCtree.add`.

The 'magic' happens in `PCtree.add`:
 - given the thread information, a list of ancestors (root to given thread) is constructed
 - the list is used to navigate through the pc tree to find to ancestor to which a new sub tree is added

## Using the pc tree
