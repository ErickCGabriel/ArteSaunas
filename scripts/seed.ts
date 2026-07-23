import { nanoid } from "nanoid";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

import { db } from "../src/db";
import { users } from "../src/db/schema";

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;
  const name = process.env.SEED_ADMIN_NAME ?? "Admin";

  if (!email || !password) {
    console.error(
      "Defina SEED_ADMIN_EMAIL e SEED_ADMIN_PASSWORD antes de rodar: \n" +
        "  SEED_ADMIN_EMAIL=voce@exemplo.com SEED_ADMIN_PASSWORD=senha-forte npm run db:seed"
    );
    process.exit(1);
  }

  if (password.length < 8) {
    console.error("A senha do admin precisa ter pelo menos 8 caracteres.");
    process.exit(1);
  }

  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email.toLowerCase()))
    .get();

  if (existing) {
    console.log(`Usuário ${email} já existe, nada a fazer.`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await db.insert(users).values({
    id: nanoid(),
    name,
    email: email.toLowerCase(),
    passwordHash,
    role: "admin",
    active: true,
  });

  console.log(`Usuário admin "${email}" criado com sucesso.`);
}

main().then(
  () => process.exit(0),
  (err) => {
    console.error(err);
    process.exit(1);
  }
);
