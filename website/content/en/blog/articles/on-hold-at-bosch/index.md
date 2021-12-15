---
date: 2021-12-15
draft: true
title: "Blech will move on"
linkTitle: "Blech will move on"
description: >
    Blech is no longer under active development at Bosch Research, but it is open-source and will evolve.
author: Franz-Josef Grosch
---

Although the Blech community is small, we want to send a message to all Blech users that explains why the Blech repositories saw almost no activities in the last 5 month. The bad news is: Blech is no longer under active development at Bosch Research. The good news is: Blech is open-source.

## The story so far

Blech started with the academic idea of synchronous programming which originated in the 80s and is most prominently represented by Esterel and Lustre. Only the invention of sequential constructiveness - first made usable in SCCharts - opened the door to create an imperative synchronous language that can easily be adopted by experienced embedded developers without the need to deny their C origin.

After a careful search for existing alternatives, we started the endeavour to create a new language - now called Blech - with the focus on compile-time guarantees and the conviction that synchronous programming can simplify the life of embedded developers. From the beginning, we knew that a language can only be developed as a minimal viable product (MVP) that is a fully functional product - albeit a "minimal" one - that should not disappoint first users. Our plan was to get feedback, to iterate and evolve Blech into its full vision. We carefully chose our tools and practices, built a compiler that runs on all operating systems, did a lot of automated testing, and created a minimal development environment in the form of a language server plugin for Visual Studio Code. 

When we started Blech we had no academic connections in the area of synchronous languages. Quickly we found friends of Blech in the academic synchronous language community. We have been invited for [conference keynotes](/blog/events) and participated in the annual [Open Synchron Workshops](/blog/events) - the traditional "family" meetings of the synchronous language researchers.

The [release of Blech 0.7.0](https://github.com/boschresearch/blech/releases/tag/v0.7.0) was the first substantial evolution of the MVP. It added a state-of-the-art module system to the language. The new release brought many big and small improvements - the number of commits was substantially bigger then in the first release - and thus demonstrates the viability of our compiler.

## The bad news and the good news

Sadly, the development of [Blech at Bosch Research](https://github.com/boschresearch/blech) and its [accompanying tools](https://github.com/boschresearch/blech-tools) is on hold. This means, we can no longer develop Blech during our working hours. Blech reached the state of an MVP, but there are many things missing and there is still a long way to go to make it suitable for series development.

Nevertheless, we think that Blech is helpful for many embedded programming problems. We are thankful, that Bosch gave us the chance to develop Blech into an MVP which we are still encouraged to maintain.

Despite all, Blech is open-source and will soon find a new home in the GitHub [blech-lang](https://github.com/blech-lang) organisation to evolve the current MVP.

Stayed tuned.
