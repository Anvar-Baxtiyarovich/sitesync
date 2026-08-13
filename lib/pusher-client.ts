import PusherClient from "pusher-js";

export const pusherClient = new PusherClient(
  process.env.NEXT_PUBLIC_PUSHER_KEY || "mock_key",
  {
    cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "mt1",
  }
);
