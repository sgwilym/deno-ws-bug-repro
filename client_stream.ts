//const socketStream = new WebSocketStream("ws://localhost:8000");
//const socketStream = new WebSocketStream("wss://ws-deno-repro.fly.dev/");
const socketStream = new WebSocketStream("wss://useful-dog-20.deno.dev");

const file = await Deno.open("./test.jpg");

let bytesSent = 0;

const loggerStream = new TransformStream<Uint8Array>({
  async transform(chunk, controller) {
    const hash = await crypto.subtle.digest("SHA-256", chunk);

    const hashArray = Array.from(new Uint8Array(hash));
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    console.log("sent", chunk.byteLength, hashHex);

    bytesSent += chunk.byteLength;

    controller.enqueue(chunk);
  },
});

console.log(socketStream);

const socketConnection = await socketStream.connection;

await file.readable.pipeThrough(loggerStream).pipeTo(
  socketConnection.writable,
);

console.group("Bytes sent");
console.log(bytesSent);
console.groupEnd();
