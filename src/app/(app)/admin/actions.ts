"use server";

import { nanoid } from "nanoid";
import { z } from "zod";
import { and, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { users } from "@/db/schema";
import { requireAdmin } from "@/lib/auth/current-user";
import { hashPassword } from "@/lib/auth/password";

const roleSchema = z.enum(["admin", "operador"]);

const createUserSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome."),
  email: z.string().trim().toLowerCase().email("E-mail inválido."),
  password: z.string().min(8, "A senha precisa ter pelo menos 8 caracteres."),
  role: roleSchema,
});

const updateUserSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome."),
  role: roleSchema,
});

export type FormState = { error?: string };

async function countActiveAdmins(excludingId?: string) {
  const admins = await db
    .select({ id: users.id })
    .from(users)
    .where(
      excludingId
        ? and(eq(users.role, "admin"), eq(users.active, true), ne(users.id, excludingId))
        : and(eq(users.role, "admin"), eq(users.active, true))
    );
  return admins.length;
}

export async function createUser(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  await requireAdmin();

  const parsed = createUserSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, parsed.data.email))
    .then((rows) => rows[0]);

  if (existing) {
    return { error: "Já existe um usuário com esse e-mail." };
  }

  const passwordHash = await hashPassword(parsed.data.password);

  await db.insert(users).values({
    id: nanoid(),
    name: parsed.data.name,
    email: parsed.data.email,
    passwordHash,
    role: parsed.data.role,
    active: true,
  });

  revalidatePath("/admin");
  return {};
}

export async function updateUser(
  id: string,
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const currentUser = await requireAdmin();

  const parsed = updateUserSchema.safeParse({
    name: formData.get("name"),
    role: formData.get("role"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  if (id === currentUser.id && parsed.data.role !== "admin") {
    return { error: "Você não pode remover seu próprio acesso de admin." };
  }

  if (parsed.data.role !== "admin") {
    const target = await db.select().from(users).where(eq(users.id, id)).then((rows) => rows[0]);
    if (target?.role === "admin" && (await countActiveAdmins(id)) === 0) {
      return {
        error: "Precisa existir pelo menos um administrador ativo.",
      };
    }
  }

  await db
    .update(users)
    .set({ name: parsed.data.name, role: parsed.data.role, updatedAt: new Date() })
    .where(eq(users.id, id));

  revalidatePath("/admin");
  return {};
}

export async function toggleUserActive(
  id: string
): Promise<{ error?: string }> {
  const currentUser = await requireAdmin();

  if (id === currentUser.id) {
    return { error: "Você não pode desativar sua própria conta." };
  }

  const target = await db.select().from(users).where(eq(users.id, id)).then((rows) => rows[0]);
  if (!target) return { error: "Usuário não encontrado." };

  if (target.active && target.role === "admin" && (await countActiveAdmins(id)) === 0) {
    return { error: "Precisa existir pelo menos um administrador ativo." };
  }

  await db
    .update(users)
    .set({
      active: !target.active,
      // Desativar também invalida sessões já abertas desse usuário.
      tokenVersion: target.active ? target.tokenVersion + 1 : target.tokenVersion,
      updatedAt: new Date(),
    })
    .where(eq(users.id, id));

  revalidatePath("/admin");
  return {};
}

const resetPasswordSchema = z
  .string()
  .min(8, "A senha precisa ter pelo menos 8 caracteres.");

export async function resetUserPassword(
  id: string,
  newPassword: string
): Promise<{ error?: string }> {
  await requireAdmin();

  const parsed = resetPasswordSchema.safeParse(newPassword);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Senha inválida." };
  }

  const target = await db.select().from(users).where(eq(users.id, id)).then((rows) => rows[0]);
  if (!target) return { error: "Usuário não encontrado." };

  const passwordHash = await hashPassword(parsed.data);

  await db
    .update(users)
    .set({
      passwordHash,
      tokenVersion: target.tokenVersion + 1,
      updatedAt: new Date(),
    })
    .where(eq(users.id, id));

  revalidatePath("/admin");
  return {};
}

export async function deleteUser(id: string): Promise<{ error?: string }> {
  const currentUser = await requireAdmin();

  if (id === currentUser.id) {
    return { error: "Você não pode excluir sua própria conta." };
  }

  const target = await db.select().from(users).where(eq(users.id, id)).then((rows) => rows[0]);
  if (!target) return { error: "Usuário não encontrado." };

  if (target.role === "admin" && (await countActiveAdmins(id)) === 0 && target.active) {
    return { error: "Precisa existir pelo menos um administrador ativo." };
  }

  await db.delete(users).where(eq(users.id, id));
  revalidatePath("/admin");
  return {};
}
