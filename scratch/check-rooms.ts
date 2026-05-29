import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });
config({ path: resolve(process.cwd(), ".env") });

import { findRoomById } from "../lib/azure/repos/rooms";

async function main() {
  const roomId = "ROOM-buukbt0uvwdjv34arqd7x950";
  console.log(`Querying room by id: ${roomId}`);
  const room = await findRoomById(roomId);
  console.log("Result:", room);
}

main();
