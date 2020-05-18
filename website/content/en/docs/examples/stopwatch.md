---
title: "Stopwatch"
linkTitle: "Stopwatch"
weight: 30
description: >
    Small example that shows the use of synchronous preemptions and uses an external C function.
---

This example illustrates synchronous control flow by means of a stopwatch: the `s` button starts and stops the measurement of time; the `r` button resets the watch to zero if no measurement is currently running, otherwise it shows the lap time.

The example is discussed in detail in the paper ["Blech, Imperative Synchronous Programming!"](https://doi.org/10.1007/978-3-030-31585-6_9).

There various modifications of the example are discussed as well as some aspects of software engineering practice.
The code sample provided here implements the final result from the paper.
The provided c file and build script are tailored towards the Microsoft Windows system using the `cl` compiler.

[Code samples (zip)](CompleteStopwatch.zip)

