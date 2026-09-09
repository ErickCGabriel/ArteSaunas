import {
  pgTable,
  text,
  integer,
  real,
  boolean,
  timestamp,
  index,
} from "drizzle-orm/pg-core";

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
};

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  // Login handle — distinct from `name`, e.g. name "Erick Gabriel" / username "erickg".
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role", { enum: ["admin", "operador"] })
    .notNull()
    .default("operador"),
  active: boolean("active").notNull().default(true),
  // Bumping this invalidates every existing session cookie for the user.
  tokenVersion: integer("token_version").notNull().default(0),
  ...timestamps,
});

export const contacts = pgTable(
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

export const budgets = pgTable(
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
    // Solicitante — quem pediu o orçamento, nem sempre é o cliente (contato)
    // vinculado acima.
    requesterName: text("requester_name"),
    requesterPhone: text("requester_phone"),
    // Endereço da instalação, dividido — pode ser diferente do endereço
    // cadastrado no contato (o cliente pode ter mais de um imóvel).
    addressStreet: text("address_street"),
    addressNumber: text("address_number"),
    addressNeighborhood: text("address_neighborhood"),
    addressCity: text("address_city"),
    addressState: text("address_state"),
    // Dimensões do ambiente, em metros.
    roomLength: real("room_length"),
    roomWidth: real("room_width"),
    roomHeight: real("room_height"),
    hasGlassAndStones: boolean("has_glass_and_stones"),
    // Especificações técnicas em texto livre (uma por linha), tipo a lista
    // de revestimento/isolamento/forno etc. que já usam no orçamento em Word.
    technicalSpecs: text("technical_specs"),
    notes: text("notes"),
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

export const budgetItems = pgTable(
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

export const contactFiles = pgTable(
  "contact_files",
  {
    id: text("id").primaryKey(),
    contactId: text("contact_id")
      .notNull()
      .references(() => contacts.id, { onDelete: "cascade" }),
    // Key inside the Supabase Storage bucket (contact-files/<contactId>/<storedName>)
    // — random, to avoid path traversal / collisions. The original name is
    // kept separately for display and for the download filename.
    storedName: text("stored_name").notNull(),
    originalName: text("original_name").notNull(),
    mimeType: text("mime_type").notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    uploadedById: text("uploaded_by_id").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("contact_files_contact_idx").on(table.contactId)]
);

export const budgetFiles = pgTable(
  "budget_files",
  {
    id: text("id").primaryKey(),
    budgetId: text("budget_id")
      .notNull()
      .references(() => budgets.id, { onDelete: "cascade" }),
    storedName: text("stored_name").notNull(),
    originalName: text("original_name").notNull(),
    mimeType: text("mime_type").notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    uploadedById: text("uploaded_by_id").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("budget_files_budget_idx").on(table.budgetId)]
);

export const invoices = pgTable(
  "invoices",
  {
    id: text("id").primaryKey(),
    // Número da nota fiscal emitida no sistema fiscal real da empresa —
    // digitado manualmente, nunca gerado por aqui.
    number: text("number").notNull().unique(),
    budgetId: text("budget_id")
      .notNull()
      .references(() => budgets.id, { onDelete: "restrict" }),
    issueDate: timestamp("issue_date", { withTimezone: true }).notNull(),
    totalCents: integer("total_cents").notNull().default(0),
    status: text("status", { enum: ["emitida", "cancelada"] })
      .notNull()
      .default("emitida"),
    notes: text("notes"),
    createdById: text("created_by_id").references(() => users.id, {
      onDelete: "set null",
    }),
    ...timestamps,
  },
  (table) => [
    index("invoices_budget_idx").on(table.budgetId),
    index("invoices_status_idx").on(table.status),
  ]
);

export const invoiceFiles = pgTable(
  "invoice_files",
  {
    id: text("id").primaryKey(),
    invoiceId: text("invoice_id")
      .notNull()
      .references(() => invoices.id, { onDelete: "cascade" }),
    storedName: text("stored_name").notNull(),
    originalName: text("original_name").notNull(),
    mimeType: text("mime_type").notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    uploadedById: text("uploaded_by_id").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("invoice_files_invoice_idx").on(table.invoiceId)]
);

// Single-row-per-key store for small pieces of app config (Google OAuth
// tokens, connected calendar id, etc.) that don't warrant their own table.
export const appSettings = pgTable("app_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
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
export type BudgetFile = typeof budgetFiles.$inferSelect;
export type NewBudgetFile = typeof budgetFiles.$inferInsert;
export type Invoice = typeof invoices.$inferSelect;
export type NewInvoice = typeof invoices.$inferInsert;
export type InvoiceFile = typeof invoiceFiles.$inferSelect;
export type NewInvoiceFile = typeof invoiceFiles.$inferInsert;
