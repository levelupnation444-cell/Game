import { handle } from "hono/vercel";
import app from "../server.js";

export const runtime = "edge";
export default handle(app);
