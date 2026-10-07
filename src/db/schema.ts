import {
  date,
  integer,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

export const residents = pgTable("residents", {
  id: serial("id").primaryKey(),
  fullName: varchar("full_name", { length: 140 }).notNull(),
  email: varchar("email", { length: 180 }).notNull().unique(),
  unit: varchar("unit", { length: 24 }).notNull(),
  role: varchar("role", { length: 24 }).notNull().default("propietario"),
  passwordHash: text("password_hash"),
  phone: varchar("phone", { length: 32 }),
  accountStatus: varchar("account_status", { length: 24 }).notNull().default("al_dia"),
  outstandingBalance: numeric("outstanding_balance", { precision: 12, scale: 2 })
    .notNull()
    .default("0"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const maintenanceTasks = pgTable("maintenance_tasks", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 180 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 64 }).notNull(),
  location: varchar("location", { length: 160 }).notNull(),
  priority: varchar("priority", { length: 24 }).notNull().default("media"),
  status: varchar("status", { length: 30 }).notNull().default("programada"),
  scheduledFor: date("scheduled_for"),
  assignedTo: varchar("assigned_to", { length: 140 }),
  estimatedCost: numeric("estimated_cost", { precision: 12, scale: 2 }).default("0"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const reports = pgTable("reports", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 180 }).notNull(),
  description: text("description").notNull(),
  category: varchar("category", { length: 64 }).notNull().default("Daño"),
  location: varchar("location", { length: 160 }).notNull(),
  priority: varchar("priority", { length: 24 }).notNull().default("media"),
  status: varchar("status", { length: 30 }).notNull().default("recibido"),
  reporterName: varchar("reporter_name", { length: 140 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const expenses = pgTable("expenses", {
  id: serial("id").primaryKey(),
  category: varchar("category", { length: 64 }).notNull(),
  description: varchar("description", { length: 180 }).notNull(),
  vendor: varchar("vendor", { length: 140 }).notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  expenseDate: date("expense_date").notNull(),
  status: varchar("status", { length: 24 }).notNull().default("pagado"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const phFunds = pgTable("ph_funds", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull().default("Fondo común"),
  currentBalance: numeric("current_balance", { precision: 12, scale: 2 }).notNull(),
  monthlyFee: numeric("monthly_fee", { precision: 10, scale: 2 }).notNull().default("40.80"),
  monthlyBudget: numeric("monthly_budget", { precision: 12, scale: 2 }).notNull().default("0"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const ownerAccounts = pgTable("owner_accounts", {
  id: serial("id").primaryKey(),
  residentId: integer("resident_id")
    .notNull()
    .references(() => residents.id, { onDelete: "cascade" }),
  period: varchar("period", { length: 16 }).notNull(),
  dueDate: date("due_date").notNull(),
  dueAmount: numeric("due_amount", { precision: 10, scale: 2 }).notNull().default("40.80"),
  paidAmount: numeric("paid_amount", { precision: 10, scale: 2 }).notNull().default("0"),
  status: varchar("status", { length: 24 }).notNull().default("pendiente"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
