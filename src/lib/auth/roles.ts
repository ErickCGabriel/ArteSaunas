import type { User } from "@/db/schema";

export const ROLE_LABELS: Record<User["role"], string> = {
  admin: "Administrador",
  gerente: "Gerente",
  analista: "Analista",
};
