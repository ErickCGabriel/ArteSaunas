"use server";

import { z } from "zod";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { db } from "@/db";
import { users } from "@/db/schema";
import { verifyPassword } from "./password";
import { clearSessionCookie, setSessionCookie } from "./session";

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Informe um e-mail válido."),
  password: z.string().min(1, "Informe a senha."),
  next: z.string().optional(),
});

export type LoginState = { error?: string };

export async function loginAction(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    next: formData.get("next"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const { email, password, next } = parsed.data;

  const user = await db.select().from(users).where(eq(users.email, email)).then((rows) => rows[0]);

  // Same generic message whether the email doesn't exist or the password is
  // wrong, and same bcrypt.compare cost either way — no timing/enumeration hints.
  const passwordMatches = user
    ? await verifyPassword(password, user.passwordHash)
    : await verifyPassword(password, "$2b$12$invalidinvalidinvalidinuInvalid1234567890abcdefghi");

  if (!user || !passwordMatches || !user.active) {
    return { error: "E-mail ou senha incorretos." };
  }

  await setSessionCookie({
    sub: user.id,
    role: user.role,
    tokenVersion: user.tokenVersion,
  });

  redirect(next && next.startsWith("/") ? next : "/");
}

export async function logoutAction() {
  await clearSessionCookie();
  redirect("/login");
}
