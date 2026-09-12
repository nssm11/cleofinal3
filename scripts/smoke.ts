import "dotenv/config";
import { recommendForQuiz } from "@/lib/experience";
import { runDailyRound } from "@/lib/jobs/daily";
import { sendWelcomeEmail, sendPasswordResetEmail, sendOrderStatusEmail, sendTicketEmail, queueCareSequence } from "@/lib/email/triggers";
import { db } from "@/db";
import { orders, users, supportTickets } from "@/db/schema";
import { eq } from "drizzle-orm";

(async () => {
  const recs = await recommendForQuiz(
    { skin: "sensitive", concern: "peau-sensible", hair: "none", texture: "light", budget: "m" },
    "tn",
  );
  console.log("quiz picks:", recs.length);
  console.log(recs.map((r) => ` - ${r.name} (${r.score}) why: ${r.why.slice(0, 60)}`).join("\n"));

  const [ines] = await db.select().from(users).where(eq(users.email, "client@cleopatre.tn")).limit(1);
  await sendWelcomeEmail(ines.id);
  await sendPasswordResetEmail(ines.email, "demo-token-xyz", ines.id, "tn", ines.firstName);
  const [o] = await db.select().from(orders).limit(1);
  if (o) {
    await sendOrderStatusEmail(o, "order_shipped");
    await queueCareSequence(o);
  }
  const [tk] = await db.select().from(supportTickets).limit(1);
  if (tk) await sendTicketEmail(tk, "ticket_reply", "Votre colis est parti, Inès.");
  const rep = await runDailyRound();
  console.log("daily round:", JSON.stringify(rep));
  const { pool } = await import("@/db");
  await pool.end();
  console.log("✓ smoke complete");
})().catch(async (e) => {
  console.error(e);
  process.exit(1);
});
