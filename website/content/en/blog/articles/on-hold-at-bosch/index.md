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

After careful search for existing alternatives, we started the endeavour to create a new language - now called Blech - with the focus on compile-time guarantees and the conviction that synchronous programming can simplify the life of embedded developers. From the beginning, we knew that a language can only be developed as a minimal viable product (MVP) that is a fully functional product - albeit a "minimal" one - that should not disappoint first users. Our plan was to get feedback, to iterate and evolve Blech into its full vision. We carefully chose our tools and practices, built a compiler that runs on all operating systems, did a lot of automated testing, and created a minimal development environment in the form of a language server plugin for Visual Studio Code. 

When we started Blech we had no academic connections in the area of synchronous languages. Quickly we found friends of Blech in the academic synchronous language community. We have been invited for conference keynotes and the traditional "family" meetings of the synchronous language researchers. Together we worked on Blech's semantics and the automated visualization of modes expressed in Blech programs. We found academic partners willing to use and promote Blech in their research and their teaching.

The latest release of Blech (Blech 0.7.0) was the first substantial evolution of the MVP. It added a state-of-the-art module system to the language. The new release brought many big and small improvements - the number of commits was substantially bigger then in the first release - and thus demonstrates the viability of our compiler.

## The bad news and the good news

Sadly, time and money for Blech at Bosch Research is used up. We can no longer develop Blech during our working hours. A language and compiler for series development requires a strong, long-term backing before it can be used. This long-term backing is beyond the mission of Bosch Research.

Nevertheless, we think that Blech is helpful for many embedded programming problems. We are thankful, that Bosch gave us the chance to develop Blech. We are still encouraged to maintain the current release. 

Despite all, Blech is open-source and will soon find a new home to evolve the MVP in the GitHub [blech-lang](https://github.com/blech-lang) organisation.

Stayed tuned.
