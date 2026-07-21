import { handle } from "hono/vercel";
import app from "../server";

export const runtime = "edge";
export default handle(app);
