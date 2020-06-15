---
title: "Programs and modules - the Blech compilation units"
linkTitle: "Modules"
weight: 40
toc_hide: true
description: >
    Modules and programs - proposal for Blech compilation units.
---

## Introduction to compilation units

A compilation unit in Blech is a single file.
A file can either be a complete Blech program or a module.
A module can be imported to support the implementation of another module or a program.


### Programs

A program file is a Blech code file (a ```.blc```-file) that needs exactly one activity marked as  ```@[EntryPoint]```.
This activity is the *main* routine of a Blech program.
A program can import other Blech modules for its implementation.
A program itself cannot be imported by another Blech program - it is not a module.
A program is always a top-level file of a Blech application.


### Modules

A module is a Blech code file that is marked as a module in the first code line

```blech
module mymodule
```

By default, all internals of module are hidden, nothing is exposed.
Inside a module everything is accessible in the normal declare-before-use order.

Every top-level declaration inside a module can be exposed to be used by an importing module or program.
Different to other languages we do not use accessibility modifiers in front of declarations.
Instead we require an explicit declaration of exposed top-level declarations.

```blech
module mymodule exposes myActivity

function f() ... end

function MyActivity() 
    f()
    ...
end
```

For exposing everything inside a module, which in usually is neither necessary nor recommended, there is a short cut `...`.


```blech
module myothermodule exposes ...  // every thing can be used by an importing compilation unti
```

In order to use a module it needs to be imported by another compilation unit, for example a Blech program.

```blech
import mymodule

@[EntryPoint]
activity MyMain()
    run mymodule.MyActivity()
end
```

By default all imports are qualified with the module name.
In order to shorten this, the imported module can be renamed.

```blech
import mymodule as mm

@[EntryPoint]
activity MyMain()
    run mm.MyActivity()
end
```

In order to use an imported name without qualification is must be exposed at the import

```blech
import mymodule exposes MyActivity

@[EntryPoint]
activity MyMain()
    run MyActivity()
end
```

For exposing everything from an imported module, which is usually neither necessary nor recommended, you can use the short cut `...`.

```blech
import mymodule exposes ...

@[EntryPoint]
activity MyMain()
    run MyActivity()
end
```

{{% alert title="Warning" color="warning"%}}
Since Blech has a very rigid no-shadowing policy, you cannot redefine an exposed identifier.
Therefore, use unqualified exposed imports sparingly.
{{% /alert %}}


### Signatures



### Test programs

### Test signatures

### File structure


