---
title: "Statements"
linkTitle: "Statements"
weight: 30
description: >

---

In its core, Blech is an imperative language.
Blech strictly separates between _statements_ that govern the flow of control and _expressions_ that evaluate to a value.
Both, a statement and an expression may have side-effects.

## Activities and functions

Control flow is organised with two kinds of procedures: _activities_ and _functions_.
Functions are used like in any other imperative language.
In Blech they have two parameter lists to support causality analysis.

See the section on [subprogram declarations](../declarations/#subprograms) for more details.

Functions must terminate within a reaction. Therefore they are said to be instantaneous.

Activities are called similarly to functions but their execution continues until it reaches a pause to end the current reaction.
In the next reaction they resume from the location they have paused and continue execution until the next pause.
Each reaction of an activity must end after finitely many computation steps.
However the activity itself may perform an unbounded number of reactions and never terminate.
It may also terminate after a finite number of reactions.
In any case, activities must not be instantaneous---they need to pause at least once before termination.
The values of local variables in activities are stored from one reaction to the next.

Activities may call other activities or functions.
Functions however can only call other functions.

## Synchronous statements
Here we discuss statements that are specific to the synchronous paradigm of Blech.
These statements control the reactive behaviour of the program and hence may only appear inside activities, not in functions.

### Await
The aforementioned "pause" is denoted as follows.

```abnf
Pause ::= "await" Condition
```

The `await` statement marks the end of a reaction.
The control flow stops at this statement and the program "waits" for the next reaction to start.
Once an activity resumes its execution at an `await` statement the condition is checked.
If it is true, the control flow proceeds to the next statement.
Otherwise, the reaction ends immediately and the control flow remains at the same location.

#### Example: Simple reactive control flow

```txt {linenos=true}
activity MyAct (in1: bool, in2: float32) (out1: uint8)
    repeat
        await in1
        out1 = (out1 + 1) % 100 // count from 0 to 99
    until in2 < 0.0 end
end
```

Initially, `MyAct` is entered and the control flow proceeds to line 3 and stops (regardless of the inputs).
In the next tick, `MyAct` resumes its execution at the `await` statement in line 3.
It checks the boolean input variable `in1`.
If it is false, the reaction ends immediately, the control flow does not advance.
Otherwise, if `in1` is true, the calculation is carried out in line 4.
This updates `out1` to a new value.
Finally, if input `in2` is indeed less than 0 the activity terminates its execution.
Otherwise the control flow loops around from line 5 back to line 2 and finally the reaction ends again in line 3.

#### Example: Proceed with the next tick

For example in time triggered systems we often just want to await the next period and proceed. This is simply expressed by
```blech
await true
```

### Run
An activity call is given by the following grammar.

```abnf
ActivityCall ::= "run" [Receiver "="] Identifier RhsArgList [LhsArgList]
Receiver ::= (Wildcard | Identifier | ("var" | "let") Identifier [":" Type])
RhsArgList ::= "()" | "(" RhsExpr ("," RhsExpr)* ")"
LhsArgList ::= "()" | "(" LhsExpr ("," LhsExpr)* ")"
```

The `run` keyword indicates an activity call.
Arguments must be provided that match the callee's declaration in number and type.
If the callee does not declare any outputs the second pair of parentheses may be dropped for readability.
Input arguments must evaluate to a value that matches the declared type.
Output arguments must evaluate to a memory location that the callee can read from and write to.
If the callee is an activity that eventually terminates and declares a return value, this return value must be either received into some variable or ignored using a wildcard. The receiving variable is either a mutable variable declared earlier or can be declared inside the `run` statement. In this case it can also be declared as a read-only variable using `let`. The receiver may be used in the code sequentially after the `run` statement.

When control flow reaches a `run` statement the sub-activity is immediately called and the control flow is handed over to the callee.
It remains within the callee for as many reactions as it runs (but at least one reaction).
In every reaction inputs are passed though to the callee and its outputs are propagated outside.
Should the callee terminate, the control flow returns to the caller and proceeds with the next statement.

Example:

```blech
// declaration
activity A (a: [8]int32, b: int32) (c: int32) returns bool
    /* some code */
    ...
end

    /* ... inside another activity ... */
    var result: bool
    var array: [8]int32 = {1, 2, 3, 4, 5, 6, 7, 8}
    var output: int32
    // usage
    run result = A(array, 7)(output)

    // alternative: declare receiver within "run"
    run let result2 = A(array, 7)(output)
```

### Cobegin

Concurrent composition is expressed with the `cobegin` statement.

```abnf
ForkJoin ::= "cobegin" ["weak"] StmtBlock ("with" ["weak"] StmtBlock)+ "end"
```

Using `cobegin` it is possible to compose arbitrary pieces of code.
The goal is not to parallelise to gain execution speed.
Rather this the language construct to express that two (or more) functionalities should be computed within the same reaction.
As such concurrency is rather a modelling concept in Blech.
The code generator will actually sequentialise the code in a causally correct order.

{{< alert title="Note" color="info" >}}
In the future there will be the possibility to specify truly parallel executions in Blech which can be carried out independently.
{{< /alert >}}

#### Example: Concurrent composition

```txt {linenos=true}
activity P ()
    var x: int32
    var y: int32
    var z: int32
    cobegin
        run A(x)(z)
    with
        run B(y)(x)
    end
end
```

Assume the activities `A` and `B` have already been implemented.
In lines 5 -- 9 they are composed concurrently.
This means the control flow of `P` is forked into two control flow points.
One resides in `A` (line 6) and one in `B` (line 8).
With every tick both, `A` and `B`, will perform one reaction.
When both subprograms terminate, `P` regains control in line 9 and, in this example, terminates too.
Of course, more than two branches can be combined using more `with` branches.
Note that the reaction of `B` will be carried out before the reaction of `A` due to causality:
First the unique value of `x` needs to be set by writer `B` before the reader `A` may use it.


The `cobegin` statement is a composite statement like a `repeat` loop or an `if` statement.
Control flow can remain within the `cobegin` branches for multiple reactions.
However in general the various branches can perform a different number of reactions, possibly infinitely many.
We therefore need to control the termination of `cobegin` as a whole using the `weak` qualifiers.

Formally, a `cobegin` statement terminates in the reaction in which all strong branches have terminated.
If all branches are weak, the `cobegin` statement terminates in the reaction in which some branch terminates.

In the above example no branch is `weak`.
We say all branches are "strong".
This means the `cobegin` statement terminates when _all_ of its branches have terminated.
Branches that finish earlier (have fewer reaction to do) will simply do nothing until the last strong branch has terminated.
The following two examples illustrate the usage of the `weak` qualifier.

#### Example: Weak and strong branches

```blech
/* ... inside some activity ... */
var res: nat8
cobegin weak
    // non-terminating branch
    repeat
        await true
        out1 = (out1 + 1) % 100
    end
with
    // terminates once a key is pressed
    res = run ReadKeyStroke()
end
```

The first branch contains an infinite loop in the sense that every iteration ends in a pause but the number of reactions is unbounded.
The loop is placed into a weak branch that allows to terminate the loop at the end of some reaction.
The second branch contains an activity call that is expected to return some value eventually.
In the reaction in which the result is returned the weak branch will be aborted (after it has done one iteration) and the control flow continues with the next statement following the `cobegin`.


#### Example: All branches weak

```blech
cobegin weak
    await isButtonPressed
with weak
    await hasReceivedSignal
end
```

In this example there are no strong branches.
The first branch to terminate will abort all others.
In this example it means as soon as `isButtonPressed` or `hasReceivedSignal` is true (or both are true!) the `cobegin` statement terminates and control flow continues with the next statement.


### Prev

`prev` is not a statement but a special operator which is most useful in the context of a `cobegin` block.

The introductory chapter explained [causality](../moc/#causality).
In short, this means two concurrent branches may not write the same shared memory and furthermore cyclical read-write dependencies are prohibited as well.
Sometimes however we need to express a quasi-cycle wherein one branch starts off with a value that has already been computed in the previous reaction. This is conveniently expressed using the `prev` operator.

#### Example: Previous values

```blech
cobegin 
    run A (prev x)(y)
with 
    run B (y)(x)
end
```

Here, in every reaction, the _previous_ value of `x`, i.e. the result of the previous reaction, is given to `A` which performs a step and produces a new value for `y`. This is then used by `B` to produce a new _current_ value of `x`.

`prev` can only be used where we expect to read a value. It cannot be used on a left-hand-side of an assignment or in an output argument position. `prev` may only be applied to values, identified by a name. It cannot be used on arbitrary expressions.
When used on memory of complex data types, `prev` binds to the outermost part. For a structure `s` the expression `prev s.x` is to be read as `(prev s).x`.

### Abort and reset

There are two kinds of synchronous preemptions built into Blech.

```abnf
Preemption ::= "when" Condition ("abort" | "reset") StmtBlock "end"
```

When control flow enters a preemption the statements in its body, denoted by `StmtBlock` in the grammar, are executed until the reaction ends in an `await` or `run` statement.
Subsequently, when a reaction resumes execution inside the body, first the `when` condition is checked.
If it is false, the execution starts as usual.
Otherwise the body is preempted _before_ any statement is executed or expression is evaluated inside the body.
There are two variants of preemptions.
`abort` means that control flow jumps to the `end` of the preemption statement.
`reset` means that control flow restarts at the beginning of `StmtBlock`.

Note that
```blech
when Condition reset P end
````

is syntactic sugar for

```blech
var hasTerminated = false
repeat
    when Condition abort
        P
        hasTerminated = true
    end
until hasTerminated end
```

where `hasTerminated` is a fresh boolean variable.

It is, of course, possible that the body is left instantaneously within one reaction.
In this case the preemption is irrelevant for the flow of control.

{{< alert title="Important" color="warning">}}
The preemption condition is *not* checked when the control flow enters the body.
The `when` condition is only checked when control flow resumes from within the body.
Wrap the preemption inside an `if` statement in case you want to check the condition before entering the body.
{{< /alert >}}

#### Example: Abort and Reset

```txt {linenos=true}
activity A (in1: bool) (out1: uint8)
    // do something ...
    
    when in1 abort
        out1 = 1
        await true
        out1 = 2
        await true
        out1 = 3
    end
    
    // do something else ...
end
```

The statement in line 4 says that `when` a reaction _starts_ in the block lines 5 -- 9, it is checked whether `in1` is true and in that case the control flow skips to line 10.
Thus when control flow reaches line 4 it will immediately proceed to line 5, set `out1` accordingly and finish this reaction in line 6 (regardless of the value of `in1`).
The next reaction starts by checking the abort condition `in1`.
If it is true we skip the rest of the block and proceed to line 10.
Otherwise, we check the condition of the `await` statement which here is vacuously true and the reaction proceeds to line 7 and finishes in line 8.
The same reasoning applies in line 8: the execution is possibly aborted before setting `out1` to 3.
In any case, the block is left in line 10.

The `abort` statement is useful whenever we want to skip over a sequence of reactions when we detect some issue at the beginning of a reaction.
Sometimes instead of skipping ahead we would like to restart a sequence of reactions.
For this we may use the `reset` statement.

```blech
activity MyAct (in1: bool) (out1: uint8)
    // do something ...
    
    when in1 reset // reset instead of abort
        out1 = 1
        await true
        out1 = 2
        await true
        out1 = 3
    end
    
    // do something else ...
end
```

It behaves just like the `abort` statement except it jumps to line 4 if `in1` is true.


## Imperative control flow
All of the following statements are known from mainstream imperative programming languages.
They may be used inside both, activities and functions.

### Assignment

```abnf
Assignment ::= LhsExpr "=" RhsExpr
```

### Do block

```abnf
DoBlock ::= "do" StmtBlock "end"
```

The `do` block may be used to define local scopes.

#### Example: Local scopes

```blech
function f ()
    do
        var x: int8 = 5
    end
    // x is out of scope here
end
```


### If

```abnf
IfStmt ::= "if" Condition "then" StmtBlock ["elseif" Condition "then" StmtBlock]* ["else" StmtBlock] "end"
```

### While

```abnf
WhileLoop ::= "while" Condition "repeat" StmtBlock "end"
```

When using a loop in an activity, there must be some pause on every control flow path through the loop body.
This is not necessary for loops inside functions.
Note that using `while` loops in activities may lead to unexpected error messages because we deliberately *do not* evaluate the condition at compile time even if it is trivially true or false.

For example:

```blech
activity Toggle()(out:bool)
    while true repeat
        out = not out
        await true
    end
end
```

This program will not compile because the compiler thinks there is a control flow path that does not enter the loop and immediately terminates the activity.
Since activities must not be instantaneous this program is rejected.
Use `repeat` loops instead to avoid this spurious control flow paths that possibly skip the loop.

### Repeat

```abnf
RepeatLoop ::= "repeat" StmtBlock ["until" Condition] "end"
```

`repeat` loops guarantee that control flow does enter the loop body at least once.
Endless loops (without the `until` condition) may only be used in activities.
Again, when using a loop in an activity, there must be some pause on every control flow path through the loop body.
This is not necessary for loops inside functions.

### Return

```abnf
ReturnStmt ::= "return" [RhsExpr] | "return" ActivityCall
```

Void activities and functions can use `return` without an expression to terminate at some point before control flow reaches the last statement.

#### Example: Return from void function

```blech
function setSpeed (velocity: float32) ()
    if velocity < 0 then
        return
    end

    if not isMotorReady() then
        return
    end
    
    halSetSpeed(velocity) // call device driver
end
```

This simple example assumes we implement a wrapper for calling a hardware device driver.
In order to avoid an if-then-else cascade `setSpeed` tests the prerequisites individually and returns in case some of them is not met.

Activities and functions that declare a return type must return a value of this type on every control flow path that reaches the end of the program body.

Activities may only return from their main thread.
In other words `return` must not occur inside a branch of a `cobegin` statement.
This is a design decision which avoids cases in which multiple branches could return a value and it is not clear which one "wins" the race. Furthermore, even if only one branch could return, it still would not be clear whether concurrent branches will execute their reactions entirely or not. For the sake of a clear and easy to understand semantics the above restriction is enforced.

Mind the difference between activity return values and activity output values.
Outputs are set in every reaction of the activity.
A return value is returned precisely once in the reaction that terminates the activity.

#### Example: Return from activity

```blech
activity A (in: int32) (out: int32) returns nat8
    var retcode: nat8
    var x: int32
    cobegin weak
        run B(in)(x)
    with
        retcode = run C(x)(out)
    end
    return retcode
end
```

In every reaction `in` is propagated to `B` and `out` is propagated from `C` to the caller.
Only when `C` terminates the variable `retcode` is updated, the `cobegin` statement is terminated and the `retcode` is returned to the caller.

Activities that simply terminate and pass on the value of their callee may use the syntactic sugar
```blech
return run A()
```
instead of the more verbose
```blech
run let foo = A()
return foo
```

### Function call

```abnf
FunctionCallStmt ::= Identifier RhsArgList [LhsArgList]
```

Blech distinguishes between a function call statement and a function call expression.
On the statement level only void functions may be called.

In summary, a block of statements in Blech is given by the following grammar.

```abnf
StmtBlock ::= 
      Pause
    | ActivityCall
    | ForkJoin
    | Preemption
    | Assignment
    | DoBlock
    | IfStmt
    | WhileLoop
    | RepeatLoop
    | ReturnStmt
    | FunctionCallStmt
    | StmtBlock ";"* StmtBlock
```

Depending on whether statements are used in an activity or a function their use may be restricted or prohibited (see above).
The optional semicolons in the grammar indicate that it is possible to separate statements in a sequence using semicolons.
We suggest to avoid writing any semicolons unless two (or more) statements are written in one line.

### Semicolons in Blech

```blech
function f()
    var x: int8 = 0; // do not clutter your code with superfluous ";"
    var y: int8 = 1  // preferred semicolon free style

    x = 7; y = y + x // ok, but usually it is better to write two lines
    x = 7 y = y + x  // compiles but is hardly readable, do not do that
end
```
