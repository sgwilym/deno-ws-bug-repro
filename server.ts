import { serve } from "https://deno.land/std@0.171.0/http/mod.ts";

serve((req) => {
  const { socket, response } = Deno.upgradeWebSocket(req);

  let bytesReceived = 0;

  socket.binaryType = "arraybuffer";

  socket.onerror = (err) => {
    console.log(err);
  };

  socket.onmessage = async (event) => {
    const bytes = new Uint8Array(event.data);
    const hash = await crypto.subtle.digest("SHA-256", bytes);
    const hashArray = Array.from(new Uint8Array(hash));
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    console.log("received", bytes.byteLength, hashHex);

    bytesReceived += bytes.byteLength;
  };

  socket.onclose = () => {
    console.group("Bytes received");
    console.log(bytesReceived);
    console.groupEnd();
  };

  return response;
});
