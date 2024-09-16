import { Server } from "socket.io";
import Redis from "ioredis";
import { produceMessage } from "./kafka.js";

const serviceUri =
  "rediss://default:AVNS_bZyrZ7T9-2PsZX49E8H@caching-972a5c3-sindsa26-d146.l.aivencloud.com:10664";
const pub = new Redis(serviceUri);
const sub = new Redis(serviceUri);

pub.on("error", (err) => {
  console.error("Redis pub error:", err);
});

sub.on("error", (err) => {
  console.error("Redis sub error:", err);
});

sub.subscribe("MESSAGES");

class SocketService {
  private _io: Server;

  constructor() {
    console.log("SocketService constructor");
    this._io = new Server({
      cors: {
        allowedHeaders: ["*"],
        origin: "*",
      },
    });

    // Single listener for Redis messages
    sub.on("message", async (channel, message) => {
      if (channel === "MESSAGES") {
        this._io.emit("message", JSON.parse(message));
        await produceMessage(message);
        console.log("Message Produced to Kafka Broker");
      }
    });
  }

  public initListeners() {
    console.log("SocketService initListeners");
    this._io.on("connection", (socket) => {
      console.log("New client connected", socket.id);

      socket.on("event:message", async ({ message }: { message: string }) => {
        console.log("New message received from client socketio", message);
        try {
          const result = await pub.publish(
            "MESSAGES",
            JSON.stringify({ message })
          );
          console.log("Message published to Redis", result);
        } catch (err) {
          console.error("Failed to publish message:", err);
        }
      });

      socket.on("disconnect", () => {
        console.log("Client disconnected");
      });
    });
  }

  get io() {
    return this._io;
  }
}

export default SocketService;
