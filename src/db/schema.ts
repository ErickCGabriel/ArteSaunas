import { sql } from "drizzle-orm";
import {
  sqliteTable,
  text,
  integer,
  real,
  index,
} from "drizzle-orm/sqlite-core";

const timestamps = {
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch('subsec') * 1000)`),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch('subsec') * 1000)`),
};

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role", { enum: ["admin", "operador"] })
    .notNull()
    .default("operador"),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  // Bumping this invalidates every existing session cookie for the user.
  tokenVersion: integer("token_version").notNull().default(0),
  ...timestamps,
});

export const contacts = sqliteTable(
  "contacts",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    phone: text("phone"),
    email: text("email"),
    address: text("address"),
    notes: text("notes"),
    createdById: text("created_by_id").references(() => users.id, {
      onDelete: "set null",
    }),
    ...timestamps,
  },
  (table) => [index("contacts_name_idx").on(table.name)]
);

export const budgets = sqliteTable(
  "budgets",
  {
    id: text("id").primaryKey(),
    number: text("number").notNull().unique(),
    title: text("title").notNull(),
    status: text("status", {
      enum: ["rascunho", "enviado", "aprovado", "recusado"],
    })
      .notNull()
      .default("rascunho"),
    contactId: text("contact_id")
      .notNull()
      .references(() => contacts.id, { onDelete: "restrict" }),
    notes: text("notes"),
    validUntil: integer("valid_until", { mode: "timestamp_ms" }),
    createdById: text("created_by_id").references(() => users.id, {
      onDelete: "set null",
    }),
    ...timestamps,
  },
  (table) => [
    index("budgets_contact_idx").on(table.contactId),
    index("budgets_status_idx").on(table.status),
  ]
);

export const budgetItems = sqliteTable(
  "budget_items",
  {
    id: text("id").primaryKey(),
    budgetId: text("budget_id")
      .notNull()
      .references(() => budgets.id, { onDelete: "cascade" }),
    description: text("description").notNull(),
    quantity: real("quantity").notNull().default(1),
    unitPriceCents: integer("unit_price_cents").notNull().default(0),
    position: integer("position").notNull().default(0),
  },
  (table) => [index("budget_items_budget_idx").on(table.budgetId)]
);

export const contactFiles = sqliteTable(
  "contact_files",
  {
    id: text("id").primaryKey(),
    contactId: text("contact_id")
      .notNull()
      .references(() => contacts.id, { onDelete: "cascade" }),
    // Name used on disk (data/uploads/<contactId>/<storedName>) — random, to
    // avoid path traversal / collisions. The original name is kept separately
    // for display and for the download filename.
    storedName: text("stored_name").notNull(),
    originalName: text("original_name").notNull(),
    mimeType: text("mime_type").notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    uploadedById: text("uploaded_by_id").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch('subsec') * 1000)`),
  },
  (table) => [index("contact_files_contact_idx").on(table.contactId)]
);

// Single-row-per-key store for small pieces of app config (Google OAuth
// tokens, connected calendar id, etc.) that don't warrant their own table.
export const appSettings = sqliteTable("app_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch('subsec') * 1000)`),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Contact = typeof contacts.$inferSelect;
export type NewContact = typeof contacts.$inferInsert;
export type Budget = typeof budgets.$inferSelect;
export type NewBudget = typeof budgets.$inferInsert;
export type BudgetItem = typeof budgetItems.$inferSelect;
export type NewBudgetItem = typeof budgetItems.$inferInsert;
export type ContactFile = typeof contactFiles.$inferSelect;
export type NewContactFile = typeof contactFiles.$inferInsert;
