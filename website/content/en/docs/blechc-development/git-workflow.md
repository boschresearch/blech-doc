---
title: "Git workflow"
linkTitle: "Git workflow"
weight: 30
description: >
  This explains how we use branches to enable our git workflow.
---

## Branches

For the Blech compiler development we use branches and follow the article: [A successful Git branching model](https://nvie.com/posts/a-successful-git-branching-model/).


The contained [workflow diagram](https://nvie.com/img/git-model@2x.png) visualizes this in a nice way.

The main branches with a permanent lifetime are:
* `master` 
* `develop`

The branch `develop` reflects the latest development steps, that are successfully build and tested.

Since we did not release a stable version until now, the `master` branch reflects the evolution of the language and is tagged for pre-releases.


