import { handle } from "hono/vercel";
import app from "../server.js";

export const runtime = "nodejs";
export default handle(app);
