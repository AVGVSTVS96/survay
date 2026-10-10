import { loadEnvConfig } from "@next/env"
import { count } from "drizzle-orm"
import { drizzle } from "drizzle-orm/node-postgres"
import { Pool } from "pg"
import { questions, survey } from "../lib/db/schema.ts"

loadEnvConfig(process.cwd())

const pool = new Pool({ connectionString: process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL })
const db = drizzle(pool)

const [{ n }] = await db.select({ n: count() }).from(questions)

if (n > 0) {
  console.log(`Skipped: the survey already has ${n} questions.`)
} else {
  await db.transaction(async (tx) => {
    await tx.insert(survey).values({ id: 1, title: "A few quick questions" }).onConflictDoNothing()
    await tx.insert(questions).values([
      {
        kind: "single",
        prompt: "Are you scared about AI?",
        options: ["yep", "nah", "its a fucking computer bro stfu", "sillycon mafia"],
        required: true,
        position: 0,
      },
      {
        kind: "single",
        prompt: "bruh..",
        options: ["what bro?! relax.. smh..", "chill dude."],
        required: true,
        position: 1,
      },
      {
        kind: "text",
        prompt: "write a 1200 page essay on mannerisms and honeybees",
        description: "zip it! 🤐",
        position: 2,
      },
      {
        kind: "multi",
        prompt: "how do you feel about cheeseburgers disappearing from existence?",
        options: ["fucking terrified mate", "a little bothered but i’ll survive", "couldnt care less mate"],
        required: true,
        position: 3,
      },
    ])
  })
  console.log("Seeded the demo survey.")
}

await pool.end()
