import { db } from "@infra/config/drizzle/database";
import { apiKeys } from "@infra/config/drizzle/schema";
import { randomBytes } from "crypto";
import { eq } from "drizzle-orm";

async function main() {
  const adminExists = await db.query.apiKeys.findFirst({
    where: eq(apiKeys.role, "ADMIN"),
  });

  if (adminExists) {
    console.log("[Script] Admin já existente.");
    process.exit(0);
  }

  const adminKey = `sk_admin_${randomBytes(16).toString("hex")}`;

  await db.insert(apiKeys).values({
    client: "Super Admin (Bootstrap)",
    key: adminKey,
    role: "ADMIN",
    isActive: true,
  });

  console.log(`KEY: ${adminKey}`);
  process.exit(0);
}

main();
