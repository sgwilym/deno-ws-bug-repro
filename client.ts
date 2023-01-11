import { deferred } from "https://deno.land/std@0.170.0/async/deferred.ts";

//const socket = new WebSocket("ws://localhost:8000");
//const socket = new WebSocket("wss://ws-deno-repro.fly.dev/");
const socket = new WebSocket("wss://useful-dog-20.deno.dev");

console.log(socket.extensions);

const file = await Deno.open("./test.jpg");

const socketReady = deferred();

socket.onopen = () => {
  socketReady.resolve();
};

socket.onerror = (err) => {
  console.log(err);
};

await socketReady;

let bytesSent = 0;

await file.readable.pipeTo(
  new WritableStream({
    async write(chunk) {
      socket.send(chunk);
      const hash = await crypto.subtle.digest("SHA-256", chunk);

      const hashArray = Array.from(new Uint8Array(hash));
      const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0"))
        .join("");

      console.log("sent", chunk.byteLength, hashHex);

      bytesSent += chunk.byteLength;
    },
  }),
);

socket.close();

console.group("Bytes sent");
console.log(bytesSent);
console.groupEnd();
