import { Hono } from "hono";
import { handle } from "hono/vercel";
import user from "./user";
import uploadRoute from "./upload";
import meeting from "./meeting";
import uploadAndSummarize from "./uploadAndSummarize";
import sendEmail from "./send-email";

const app = new Hono().basePath('/api')

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const routes = app
    .route("/user", user)
    .route("/upload", uploadRoute)
    .route("/meetings", meeting)
    .route("/upload", uploadAndSummarize)
    .route("/send-email", sendEmail);

export const GET = handle(app)
export const POST = handle(app)
export const PATCH = handle(app)
export const DELETE = handle(app)

export type AppType = typeof routes