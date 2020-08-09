---
title: "Error handling"
linkTitle: "Error handling"
weight: 30
description: >
  Evolution proposals for Blech error handling.
---

{{% pageinfo %}}
The error handling proposal is work in progress.
{{% /pageinfo %}}


## Inspiration

The following documents about error handling are worth reading:


Joe Duffy's Blog on Modori's [Error Model](http://joeduffyblog.com/2016/02/07/the-error-model/#reliability-fault-tolerance-and-isolation)

Swifts [Error Handling Rationale and Proposal](https://github.com/apple/swift/blob/master/docs/ErrorHandlingRationale.rst)

Pony's [Errors](https://tutorial.ponylang.io/expressions/errors.html)

Zig's [Errors](https://ziglang.org/documentation/master/#Errors)

V's [Option/Result types & error handling](https://vlang.io/docs#option)

C++ proposal [Zero-overhead deterministic exceptions: Throwing values](http://www.open-std.org/jtc1/sc22/wg21/docs/papers/2018/p0709r0.pdf)


## Error categories: bugs and recoverable errors

Blech makes a difference between recoverable errors and bugs.

Furthermore Blech makes a difference between debug and release code.

Bugs are not recoverable. Typical examples are: index out of bounds, division by zero, arithmetic overflow, but also wrong program logic. Such errors may damage the program's state, and are even often not easily detectable, if the program just continues.

In debug code, bugs abandon (terminate) the program. Buggy code fails fast and therefore simplyfies testing and validation. In release code, we assume all bugs have been found, and remaining bugs are mitigated: saturation arithmetic,division by zero returning zero, index-saturation for array accesses, etc. are means for this purpose.

In order to fight wrong program logic, we use```assert``` and ```assume```. Since Blech programs execute in steps we can also add invariants, to be checked ```before``` or ```after``` every ```await```. Similar to bugs, wrong assertions, assumptions and invariants should abandon the program in debug code. In release code, we assume all contracts have been tested, validated or verified, and we do not execute checks at all.

Abandonment is not always appropriate. There are many situations where an error occurs, that can be recovered reasonably. We propose to use ```error types``` for this purpose, which will be used similar to checked exceptions and code-generated with error return codes.

Before we dive into the details, we like to bring to mind the experience with [Midori](http://joeduffyblog.com/2016/02/07/the-error-model/#reliability-fault-tolerance-and-isolation).
1. Method with contracts outnumber exceptional methods by 10:1
2. Simple exceptional subprogram with one failure mode outnumber multi-failure-mode ones by another 10:1.
3. Abondenment covers the lion's share of cases and for most subprograms there is no need for exceptions.
4. Ecouraging single modes of failure for subprograms can simplify a whole system dramatically.

## Total and partial subprograms

An ```activity``` or a ```function``` that never fails is called a total subprogram. Nevertheless at total subprgram can lead to program abandonment, when a bug occurs or a contract is violated. We assume that all bugs are eliminated - or mitigated - in the release code for a total subprogram.

A subprogram that throws a recoverable error - or failure for short - is called a *partial* subprogram. For certain inputs, it may terminate with a recoverable error. Partial subprograms - and operators - are marked with a ```?``` behind the name. In the following we distinguish single-mode and multi-mode failures.

## Single-mode failures

A single-mode-failure partial subprogram has to be marked with ```?```, and is then allowed to fail with a ```throw``` statement.

```blech
function f ? () returns bool 
    if <some thing is wrong> then 
        throw
    end
    return true
end
```

Furthermore a subprogram that potentially fails, ```?```,  is allowed to call another partial subprogram.
```blech
function g ? () returns bool
    var flag: bool
    flag = f?()
    return flag
end
```

Calling a partial subprogram is also marked with ```?```, in order to make control-flow, caused by errors, visible.  It is a type error to forget the ```?``` when calling a partial subprogram. It is also a type error to forget to classify the calling subprogram as partial with ```?```. 

In order to make the calling subprogram a non-partial subprogram an error handler is neccessary.

```blech
function g () // does not throw an error
    var flag: bool
    try 
        flag = f?()
    else
        flag = false
    end
    return flag
end
```
An error handler statement consist of a ```try``` block and an ```else``` part which does the recovering in case of a thrown error. Ommitting the optional ```else``` block just handles the error without any recovering. In order to do any cleanup in both cases, there is also an optional ```then``` block.

```blech
function g () // does not throw and error
    var flag: bool
    try 
        flag = f?()
    else // recover
        flag = false
    then // finally do
        flag = true
    end
    return flag
end
```

The shaping of error handlers is inspired by error handling in [Pony](https://tutorial.ponylang.io/expressions/errors.html)

It is important to understand that, similar to ```return```, throwing an error across concurrent ```cobegin``` blocks is not allowed. Therefore a ```cobegin``` block either requires an error handler or only can call non-partial subprograms.

```blech
cobegin // not allowed, throws across cobegin statement
    f?()
    await true
with // ok, all errors handled
    try 
        f?()
        await true
    end
with // ok, no throwing subprograms called
    g()
    await true 
end
```

Calling two single-mode-failure subprograms inside one handler, does not allow to differentiate thrown errors.

```blech
try 
    f?()
    run a?()
else 
    // no clue if f or a has thrown an error
end
```

or 

```blech
activity b ? () // no clue what is signaled to the caller
    f?()
    run a?()
end
```

This is the reason for multi-mode-failures and checked error types.

## Multi-mode failures

The simplest case for a multi-mode failure is an error with "payload".

```blech
function fRange ? () returns int32 throws RangeError
    var result: int32 = <operation on range>
    if <too small> then
        throw RangeError.TooSmall
    elseif <too big> then
        throw RangeError.TooBig
    end
    return result
end
```

```RangeError``` is just a type classified as an error type, which means is allowed to be thrown.

```blech
error enum RangeError
    TooSmall
    TooBig
end
```

Different to normal types, error types have a run-time representation - usually a statically known address - to allow for type comparison in generated code. Error type declarations are restricted to value types, in order to allow error handling via return values in generated code. When thrown, the value is lifted to an error which is essentially a pair of the value and the error type pointer. Non-error types can not be thrown. 

Handling the thrown error with "payload" can be done by matching the predefined ```error``` variable. In order to match the error, the type must be a ```RangeError``` and the payload value is bound - similar to events.

```blech
function gRange ()
    var flag: bool
    try 
        flag = f?()
    elseif let re: RangeError = error, re == RangeError.TooSmall then
        flag = false
    else
        flag = true
    end
    return flag
end
```

It is a type error to match on an error type that does not match with the possible error types in the ```try``` block. That means it is statically known which error types are possibly thrown inside the try block. The ```error``` variable is local to every handler, its type is the union of all possibly thrown error types.

If a subprogram calls several subprograms, that might throw errors of different types, we get a true multi-mode-failure subprogram.

```blech
error typealias DecodeError = int8

function fDecode ? () throws DecodeError
    ...
    error 2
    ...
end

function caller ? () throws (RangeError | DecodeError)
    fRange?()
    fDecode?()
end

function callerWithHandler ()
    try
        fRange?()
        fDecode?()
    elseif let re: RangeError = error then

    elseif let de: DecodeError = error then
        
    else // handle all other errors; none here.

    then // do always, even on throw in else or elseif part

    end
end

```

An error handler (```try```) handles all possible errors. It is the responsibility of the programmer to do an exhaustive error matching. All non-matched errors are silently disregarded. Handlers do not re-throw automatically.

Since 
> The unavoidable price of reliability is simplicity. (C. Hoare).

we recommend using single-mode failures and local error-management instead of complex multi-mode failures and raising errors accross several call-boundaries. 

## Realtime Errors

For realtime systems it is convenient to be able to throw a built-in `RealtimeError` in order to handle deadline misses in the program.

A realtime error is not an error in the usual sense. It is thrown if a deadline miss is detected.

In order to keep throwing realtime errors deterministic, there are 2 ways of detecting a realtime error.

Either 

1. a reaction takes too long and an `await` is reached after the next tick has arrived,

or

2. a reaction is already starting from an `await` after the next tick has arrived, which is even worse.

Both situation can be detected via the generated code.
In principle this works like the following:

Just before an `await` is reached, the code "asks" the environment if the next tick has already arrived.
If yes, it throws a realtime error. This is similar to a weak abort, of the code that is currently executed.

When a reaction is started, before anything else is evalutated, the code "asks" the environment if the next tick has already arrived.
If yes, it throws a realtime error.
This is similar to a strong abort of the code, that otherwise would be executed.

(?? Maybe we should differentiate these two kinds of realtime errors)

There are two aspects of realtime errors to consider:

1. Since a deadline miss can occur anywhere in a program, it is not useful to be prepared to handle a deadline miss everywhere.
2. Once we get a delayed finish or - even worse - a delayed start at an `await` somewhere in the code, all finishes or starts that follow are also delayed.

In order to handled realtime errors in a structure way we propose
to declare realtime-critical activities in the following way.

```
activity DoSomethingCritical ? () throws RealtimeError

    await condition 

end
```

The generated code then checks deadline misses at the start and the end of every reaction - which is marked by `await`.
Activities, which are not marked as real-time critical do not check deadline misses and do not throw realtime errors.

Any calling activity up in the call-chain, can handle the realtime error

```
activity DeadineMissHandler ()
    try
        DoSomethingCritical ? ()
    else
        handleDeadlineMiss()
    end
end
```

If a deadline is missed, all realtime-critical running activities which are "too late" will throw and their callers
must handled the deadline miss.
In this way a deadline miss can be handled locally and deterministically, with individual countermeasures.

Of course you need a strategy to cope with realtime errors.
A very simple strategy would be a restart initiated via the entry point activity.
In principal, you can implement an individual strategy for every realtime critical activity.

Functions cannot throw realtime errors implicitly because they cannot await.
Maybe we should also have a library function to query a deadline miss.

```
function testForDeadlineMiss ? () throws RealtimeError
    if deadlineIsMissed() then 
        throw RealtimeError
    else
        doTheCalculation()
    end
end
```

## Expression handlers

In order to simplify local error handling we propose to allow handlers also inside expressions

```blech
    x = try f?() else false
```

Similar to an elvis operator for optionals a local handler catches all errors and supplies a default value.
With this possibility it seems useful, to simplify the language and to remove built-in option types.

For orthogonality reasons we also propose a ternary expression, to simpify decisions local to expressions

```blech
    c = a + (if condition then 42 else -42) + b
```

Both expression forms do not have optional parts.

## Code generation

Due to the static nature of Blech, all error types need a run-time representation. 
This can be implemented as a statically fixed address of a memory location.

A union of error types can be implemented by a C union type. The tag field can be implemented as an address, that allows to distinguish between error types. 

The result of a partial function is a union of the return type and all the error types.
A successful termination can be indicated by a null-pointer in the tag field.
A failure termination is indicated by any non-null address, which additionally identifies the error type.

In this way, the return value of a C-function can be used for successful and failure termination of partial subprograms. (See also the [C++ proposal](http://www.open-std.org/jtc1/sc22/wg21/docs/papers/2018/p0709r0.pdf) cited above).




