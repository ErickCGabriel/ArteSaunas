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
  // admin: acesso total + gerencia usuários. gerente: acesso total, exceto
  // gerenciar usuários. analista: cria/edita orçamentos, notas fiscais,
  // contatos, catálogo e calendário, mas não exclui nada nem mexe na
  // integração do Google Calendar.
  role: text("role", { enum: ["admin", "gerente", "analista"] })
    .notNull()
    .default("analista"),
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

// Histórico de anotações do contato — texto livre, datado, somente
// acrescenta (sem editar); excluir é restrito a admin/gerente, pra manter o
// histórico confiável.
export const contactNotes = pgTable(
  "contact_notes",
  {
    id: text("id").primaryKey(),
    contactId: text("contact_id")
      .notNull()
      .references(() => contacts.id, { onDelete: "cascade" }),
    body: text("body").notNull(),
    createdById: text("created_by_id").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("contact_notes_contact_idx").on(table.contactId)]
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
    // Quem da equipe está cuidando desse orçamento — nem sempre é quem
    // criou. Editável, começa com quem cria o orçamento.
    assignedToId: text("assigned_to_id").references(() => users.id, {
      onDelete: "set null",
    }),
    ...timestamps,
  },
  (table) => [
    index("budgets_contact_idx").on(table.contactId),
    index("budgets_status_idx").on(table.status),
    index("budgets_assigned_to_idx").on(table.assignedToId),
  ]
);

// Histórico de manutenções/problemas do contato — saunas exigem revisão
// periódica e nem sempre dá pra prever quando; aqui fica registrado o que
// aconteceu e quando, opcionalmente ligado ao orçamento/instalação de
// origem. Mesma política de exclusão dos contactNotes (só admin/gerente).
export const maintenanceRecords = pgTable(
  "maintenance_records",
  {
    id: text("id").primaryKey(),
    contactId: text("contact_id")
      .notNull()
      .references(() => contacts.id, { onDelete: "cascade" }),
    budgetId: text("budget_id").references(() => budgets.id, {
      onDelete: "set null",
    }),
    description: text("description").notNull(),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),
    createdById: text("created_by_id").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("maintenance_records_contact_idx").on(table.contactId),
    index("maintenance_records_budget_idx").on(table.budgetId),
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
    contactId: text("contact_id")
      .notNull()
      .references(() => contacts.id, { onDelete: "restrict" }),
    // Orçamento de origem — opcional, nem toda nota fiscal vem de um
    // orçamento registrado no sistema.
    budgetId: text("budget_id").references(() => budgets.id, {
      onDelete: "set null",
    }),
    issueDate: timestamp("issue_date", { withTimezone: true }).notNull(),
    totalCents: integer("total_cents").notNull().default(0),
    status: text("status", { enum: ["emitida", "cancelada"] })
      .notNull()
      .default("emitida"),
    notes: text("notes"),
    createdById: text("created_by_id").references(() => users.id, {
      onDelete: "set null",
    }),
    // Quem da equipe está cuidando dessa nota — nem sempre é quem registrou.
    assignedToId: text("assigned_to_id").references(() => users.id, {
      onDelete: "set null",
    }),
    ...timestamps,
  },
  (table) => [
    index("invoices_contact_idx").on(table.contactId),
    index("invoices_budget_idx").on(table.budgetId),
    index("invoices_status_idx").on(table.status),
    index("invoices_assigned_to_idx").on(table.assignedToId),
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

export const contracts = pgTable(
  "contracts",
  {
    id: text("id").primaryKey(),
    // Número interno do contrato, gerado automaticamente (CTR-AAAA-NNNN) —
    // diferente da nota fiscal, não precisa bater com nenhum sistema externo.
    number: text("number").notNull().unique(),
    contactId: text("contact_id")
      .notNull()
      .references(() => contacts.id, { onDelete: "restrict" }),
    // Orçamento de origem — opcional, mesma lógica da nota fiscal.
    budgetId: text("budget_id").references(() => budgets.id, {
      onDelete: "set null",
    }),
    contractDate: timestamp("contract_date", { withTimezone: true }).notNull(),
    totalCents: integer("total_cents").notNull().default(0),
    status: text("status", { enum: ["pendente", "assinado", "cancelado"] })
      .notNull()
      .default("pendente"),
    notes: text("notes"),
    createdById: text("created_by_id").references(() => users.id, {
      onDelete: "set null",
    }),
    // Quem da equipe está cuidando desse contrato — nem sempre é quem
    // registrou.
    assignedToId: text("assigned_to_id").references(() => users.id, {
      onDelete: "set null",
    }),
    ...timestamps,
  },
  (table) => [
    index("contracts_contact_idx").on(table.contactId),
    index("contracts_budget_idx").on(table.budgetId),
    index("contracts_status_idx").on(table.status),
    index("contracts_assigned_to_idx").on(table.assignedToId),
  ]
);

export const contractFiles = pgTable(
  "contract_files",
  {
    id: text("id").primaryKey(),
    contractId: text("contract_id")
      .notNull()
      .references(() => contracts.id, { onDelete: "cascade" }),
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
  (table) => [index("contract_files_contract_idx").on(table.contractId)]
);

export const itemCatalog = pgTable(
  "item_catalog",
  {
    id: text("id").primaryKey(),
    description: text("description").notNull(),
    defaultUnitPriceCents: integer("default_unit_price_cents").notNull().default(0),
    createdById: text("created_by_id").references(() => users.id, {
      onDelete: "set null",
    }),
    ...timestamps,
  },
  (table) => [index("item_catalog_description_idx").on(table.description)]
);

// Cópia local (somente leitura pro resto do app) dos eventos do Google
// Calendar, pra listar/filtrar o calendário sem depender da API do Google a
// cada clique — só é escrita ao criar/editar/excluir um evento (fica em dia
// na hora) e ao rodar uma sincronização manual (botão "Sincronizar", pega o
// que mudou direto no Google fora do app).
export const calendarEvents = pgTable(
  "calendar_events",
  {
    id: text("id").primaryKey(), // id do evento no Google Calendar
    title: text("title").notNull(),
    description: text("description"),
    address: text("address"),
    startAt: timestamp("start_at", { withTimezone: true }).notNull(),
    endAt: timestamp("end_at", { withTimezone: true }).notNull(),
    contactId: text("contact_id"),
    budgetId: text("budget_id"),
    assignedToId: text("assigned_to_id"),
    ...timestamps,
  },
  (table) => [index("calendar_events_start_idx").on(table.startAt)]
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
export type Contract = typeof contracts.$inferSelect;
export type NewContract = typeof contracts.$inferInsert;
export type ContractFile = typeof contractFiles.$inferSelect;
export type NewContractFile = typeof contractFiles.$inferInsert;
export type ItemCatalogEntry = typeof itemCatalog.$inferSelect;
export type NewItemCatalogEntry = typeof itemCatalog.$inferInsert;
export type CalendarEventRow = typeof calendarEvents.$inferSelect;
export type NewCalendarEventRow = typeof calendarEvents.$inferInsert;
export type ContactNote = typeof contactNotes.$inferSelect;
export type NewContactNote = typeof contactNotes.$inferInsert;
export type MaintenanceRecord = typeof maintenanceRecords.$inferSelect;
export type NewMaintenanceRecord = typeof maintenanceRecords.$inferInsert;
