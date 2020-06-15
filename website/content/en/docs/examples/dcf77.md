---
title: "Decoding the DCF77 longwave time signal"
linkTitle: "DCF77 decoding"
weight: 50
description: >
    A decoder for the DCF77 longwave time signal implemented in Blech on bare metal

---

DCF77 is a longwave radio signal which is widely used in Germany for time synchronization of clocks and watches.

This example implements the decoding of the DCF77 signal in Blech on *bare metal* using an [STM32 discovery board](https://www.st.com/en/evaluation-tools/stm32f4discovery.html).

A [blog post](/blog/2020/06/15/decoding-the-dcf77-signal-with-blech/) accompanies the implementation, which explains the implementation details and the simplicity of the structured synchronous top-down design.

The sources are [available on GitHub](https://github.com/mterber/blech-dcf77). 

Thank you very much [@mterber](https://github.com/mterber) for this fine piece of work.

