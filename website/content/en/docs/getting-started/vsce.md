---
title: "Blech Language Services - the VS Code extension"
linkTitle: "Blech Language Services"
weight: 20
description: >
    We use Visual Studio Code as an editor for Blech sources. 
    Learn how to build and install the Blech Language Services VS Code extension from source.
---

## Visual Studio Code and the Blech Language Services

We package the Blech Language Servicex as an extension for VS Code that provides two functionalities: 
- syntax highlighting, and 
- a language server which checks the code every time it is saved.

This gives you editing support like code snippets, correct indentation, type checking or causality checking. 
In case of errors, it returns error messages to the user.
It also supports a few basic IDE functionalities.

In order to use this, install Visual Studio Code (a.k.a. VS Code) either from https://code.visualstudio.com/ or from https://github.com/VSCodium/vscodium/releases. 
It can be installed locally without admin rights. 

## Build the extension from source

The build from source needs **.NET Core** and **NodeJS** for the Blech Language Services.

If you [built the Blech compiler from source](/docs/getting-started/blechc/#build-blechc-from-source) .NET Core is already installed.

To install NodeJS [download and install the Long Term Support version](https://nodejs.org/).
Enclosed is a version of the Node Package Manager `npm`.

Test it with:
```
npm --version
```

`npm` is frequently updated. In order to keep it up-to-date run:
```
npm install npm@latest -g
```

In most case you should see an upgrade when you run:
```
npm --version
```

## Prerequisites for building the extension

Clone the `blech-tools` repository, including the blech compiler submodule.

```
git clone --recurse-submodules https://github.com/boschresearch/blech-tools.git
```

Change to the `ide` subdirectory.

Install the node package `vsce`, which is able to package VS Code extensions.

```
npm -g install vsce
```

Install the Typescript node package. Typescript is a the typed superset of JavaScript, which is used to build the extension.

```
npm -g install node-typescript
```

Install the necessary node modules for this project.
From the `ide` subdirectory run 
```
npm install
```

Optionally: Run the TypeScript compilation. 
```
npm run compile
```

If you like, you can learn more about [the TypeScript language](https://www.typescriptlang.org), which is created by Microsoft.


## Build the extension

Besides syntax highlighting the Blech Language Services consisting of two parts which need to be compiled.

1. A language server written in F#, which is a small wrapper around the Blech compiler.
    
    The language server is build using dotnet. From the `ide` subdirector run:
    
    ```
    dotnet publish -c Release -r win-x64
    ```
    Choose your runtime above as necessary (`linux-x64`, `osx-x64`).

2. A VS code extension, which runs a client to the language server.
    To build and package the client and the server as an extension run: 
    
    ``` 
    vsce package
    ```  
    
    If you get a security warning when using Windows powershell. Try running it from `cmd`.


This gives you a `blech-language-services-0.<i>.<j>.vsix` file in the same directory. 


## Install the extension 

You can install the Blech Language Services VS Code extension via the commandline or interactively.

From the command line go to the `ide` subdirectory run
```
code blech-language-services-0.<i>.<j>.vsix
```
with the correct version number.

If VS Code is already running: 
Open the Extension section, go to the `...` menu, and select `Install from VSIX...`.
Select the `blech-language-services-0.<i>.<j>.vsix` file to install the extension.

Verify it works by opening some `*.blc` file. 
If the keywords are coloured, it works. 
Furthermore, if you hover over an activity name, you should see its signature in a tooltip.
