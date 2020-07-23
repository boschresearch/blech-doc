---
title: "Synchronous expressions"
linkTitle: "Synchronous expressions"
weight: 50
description: >
    Allow synchronous expression.
---


## Activity calls

```blech

let x = run Controller()
x = run Controller()
return run Controller()

```

## Emit events

```blech

let payload = 42: bits8
var x: event bits8
let x = emit payload
var x = emit payload

x = emit 43

return emit payload
```

```blech
var ev: event = emit

ev = emit
return emit
```

## Casts and type annotations

```blech

let payload = 42: bits8
var x: bits8 signal
let y = emit payload : event bits16
var z = emit payload : event bits32

x = emit 43

return emit payload

```


```blech

let x = run Controller() : bits16
x = run Controller() : bits16
return run Controller() : bits16

```
