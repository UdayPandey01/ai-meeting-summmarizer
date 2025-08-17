import { Hono } from "hono"
import { PrismaClient } from "@/lib/generated/prisma";
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"

const prisma = new PrismaClient();

const app = new Hono()
const JWT_SECRET = process.env.JWT_SECRET || "gbmbubm7tgv"

app.post("/sign-up", async (c) => {
  try {
    const body = await c.req.json()
    const { name, email, password } = body

    if (!name || !email || !password) {
      return c.json({ status: "error", message: "All fields are required" }, 400)
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash: hashedPassword,
      },
    })

    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email },
      JWT_SECRET,
      { expiresIn: "7d" }
    )

    return c.json({ status: "success", user, token })
  } catch (err) {
    console.error(err)
    return c.json({ status: "error", message: "Something went wrong" }, 500)
  }
})

export default app
