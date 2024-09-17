import { Server } from "socket.io";
import Redis from "ioredis";
import { produceMessage } from "./kafka.js";
interface iMessageFromFrontend {
  message: string;
  senderId: string;
  receiverId: string;
}

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
  private users: { [key: string]: string } = {}; // Map to store userId to socketId

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
        const parsedMessage = JSON.parse(message);
        const { senderId, receiverId, message: msg } = parsedMessage;

        await produceMessage(parsedMessage);
        console.log("Message Produced to Kafka Broker");
        // Emit the message to the specific receiver
        const receiverSocketId = this.users[receiverId];
        if (receiverSocketId) {
          this._io
            .to(receiverSocketId)
            .emit("message", { senderId, receiverId, message: msg });
        }
      }
    });
  }

  public initListeners() {
    console.log("SocketService initListeners");
    this._io.on("connection", (socket) => {
      console.log("New client connected", socket.id);

      // Listen for user registration to map userId to socketId
      socket.on("register", (userId: string) => {
        this.users[userId] = socket.id;
        console.log(`User ${userId} registered with socket ID ${socket.id}`);
      });

      socket.on(
        "event:message",
        async ({ message, senderId, receiverId }: iMessageFromFrontend) => {
          try {
            const result = await pub.publish(
              "MESSAGES",
              JSON.stringify({ senderId, receiverId, message })
            );
            console.log("Message published to Redis", result);
          } catch (err) {
            console.error("Failed to publish message:", err);
          }
        }
      );

      socket.on("disconnect", () => {
        console.log("Client disconnected", socket.id);
        // Remove the user from the mapping
        for (const userId in this.users) {
          if (this.users[userId] === socket.id) {
            delete this.users[userId];
            console.log(`User ${userId} disconnected and removed from mapping`);
            break;
          }
        }
      });
    });
  }

  get io() {
    return this._io;
  }
}

export default SocketService;
