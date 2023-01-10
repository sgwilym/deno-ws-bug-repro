# Deno Websocket error reproduction case

There is a bug in the Deno's WebSocket implementation which causes messages to
be dropped to remote servers.

`client.ts` opens the local file `test.jpg`, and pipes a readable stream to a
WebSocket, and logs the size of the messages sent.

`server.ts` opens a WebSocket for incoming requests, and for each incoming
websocket message, logs the size. When the Websocket connection is closed, it
logs the total amount of bytes received.

When run locally, each script logs the following:

client.ts:

```
sent 65536 c0afd51b806b4fdf815b017409bf95d0584b2a9d91d54935b97ded16078061c1
sent 65536 b3d8f877ae3dd36aa49b6da898f8895707c2a67f67468b0db9adbfa7df65c3a9
sent 65536 dd8645a7fa54da76a950737e9421e61d70377457ffddc2b94ab52b0bdea45672
sent 65536 98a8964fc7f5089cf9996c1c90b2cf5e102cfcefcef832cd0bb7145305fbfc3e
sent 65536 877b0ede797086d97164b8dc6a6e2afa0311b80f89da31ad2d17754b70043d29
sent 65536 feb76d01d3d3003157dea4167cba5ec38d943569b1dc3e1a1984725e59a3935d
sent 65536 868557507298e6c71f16ea10908ed611c2b0cc3948e4ff1b2d5310d8e02cabfd
sent 10431 b1d0505d6f830262f2a0ca58905194483f118abc765bc91c6093cccdef0ba5ea
Bytes sent
		469183
```

server.ts

```
received 65536 c0afd51b806b4fdf815b017409bf95d0584b2a9d91d54935b97ded16078061c1
received 65536 b3d8f877ae3dd36aa49b6da898f8895707c2a67f67468b0db9adbfa7df65c3a9
received 65536 dd8645a7fa54da76a950737e9421e61d70377457ffddc2b94ab52b0bdea45672
received 65536 98a8964fc7f5089cf9996c1c90b2cf5e102cfcefcef832cd0bb7145305fbfc3e
received 65536 877b0ede797086d97164b8dc6a6e2afa0311b80f89da31ad2d17754b70043d29
received 65536 feb76d01d3d3003157dea4167cba5ec38d943569b1dc3e1a1984725e59a3935d
received 65536 868557507298e6c71f16ea10908ed611c2b0cc3948e4ff1b2d5310d8e02cabfd
received 10431 b1d0505d6f830262f2a0ca58905194483f118abc765bc91c6093cccdef0ba5ea
Bytes received
		469183
```

Which is as expected.

However, when this server is deployed to Fly.io, the server reports the
following:

```
received 65536 c0afd51b806b4fdf815b017409bf95d0584b2a9d91d54935b97ded16078061c1
received 65536 b3d8f877ae3dd36aa49b6da898f8895707c2a67f67468b0db9adbfa7df65c3a9
received 65536 dd8645a7fa54da76a950737e9421e61d70377457ffddc2b94ab52b0bdea45672
received 65536 98a8964fc7f5089cf9996c1c90b2cf5e102cfcefcef832cd0bb7145305fbfc3e
Bytes received
   262144
```

The server only receives the first four messages, stopping at exactly 256kb.

Sometimes it even logs messages like this:

```
received 65536 c0afd51b806b4fdf815b017409bf95d0584b2a9d91d54935b97ded16078061c1
received 65536 b3d8f877ae3dd36aa49b6da898f8895707c2a67f67468b0db9adbfa7df65c3a9
received 65536 dd8645a7fa54da76a950737e9421e61d70377457ffddc2b94ab52b0bdea45672
Bytes received
196608
received 65536 98a8964fc7f5089cf9996c1c90b2cf5e102cfcefcef832cd0bb7145305fbfc3e
```

Where a message is received _after_ the socket is closed.

This bug is present in version 1.29.0 - 1.29.2 of Deno.

If you run this same reproduction in Deno 1.28.3, the server receives _too many_
messages, as it receives the third message twice.

```
received 65536 c0afd51b806b4fdf815b017409bf95d0584b2a9d91d54935b97ded16078061c1
received 65536 b3d8f877ae3dd36aa49b6da898f8895707c2a67f67468b0db9adbfa7df65c3a9
received 65536 dd8645a7fa54da76a950737e9421e61d70377457ffddc2b94ab52b0bdea45672
received 65536 dd8645a7fa54da76a950737e9421e61d70377457ffddc2b94ab52b0bdea45672
received 65536 98a8964fc7f5089cf9996c1c90b2cf5e102cfcefcef832cd0bb7145305fbfc3e
received 65536 877b0ede797086d97164b8dc6a6e2afa0311b80f89da31ad2d17754b70043d29
received 65536 feb76d01d3d3003157dea4167cba5ec38d943569b1dc3e1a1984725e59a3935d
received 65536 868557507298e6c71f16ea10908ed611c2b0cc3948e4ff1b2d5310d8e02cabfd
received 10431 b1d0505d6f830262f2a0ca58905194483f118abc765bc91c6093cccdef0ba5ea
Bytes received
	534719
```
