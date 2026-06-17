import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Export auth models (users and sessions tables for Replit Auth)
export * from "./models/auth";
import { users } from "./models/auth";

// Properties
export const properties = pgTable("properties", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  landlordId: varchar("landlord_id", { length: 36 }).notNull().references(() => users.id),
  name: text("name").notNull(),
  ownerName: text("owner_name"), // Property owner name for receipts
  address: text("address").notNull(),
  unit: text("unit"), // apartment/unit number
  city: text("city").notNull(),
  state: text("state").notNull(),
  zipCode: text("zip_code").notNull(),
  propertyType: text("property_type").notNull(), // apartment, house, condo, townhouse, room
  bedrooms: integer("bedrooms").notNull(),
  bathrooms: decimal("bathrooms", { precision: 3, scale: 1 }).notNull(),
  sqft: integer("sqft"),
  rentAmount: decimal("rent_amount", { precision: 10, scale: 2 }).notNull(),
  description: text("description"),
  amenities: text("amenities"), // comma-separated list
  isVacant: boolean("is_vacant").default(false),
  imageUrl: text("image_url"),
});

export const propertiesRelations = relations(properties, ({ one, many }) => ({
  landlord: one(users, { fields: [properties.landlordId], references: [users.id] }),
  tenants: many(tenants),
  applications: many(applications),
  viewings: many(viewings),
  expenses: many(expenses),
}));

export const insertPropertySchema = createInsertSchema(properties).omit({ id: true });
export type InsertProperty = z.infer<typeof insertPropertySchema>;
export type Property = typeof properties.$inferSelect;

// Tenants
export const tenants = pgTable("tenants", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  propertyId: varchar("property_id", { length: 36 }).notNull().references(() => properties.id),
  applicationId: varchar("application_id", { length: 36 }).references(() => applications.id), // Link to original application
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  leaseStart: timestamp("lease_start").notNull(),
  leaseEnd: timestamp("lease_end").notNull(),
  moveOutDate: timestamp("move_out_date"),
  rentAmount: decimal("rent_amount", { precision: 10, scale: 2 }).notNull(),
  securityDeposit: decimal("security_deposit", { precision: 10, scale: 2 }),
  status: text("status").default("active"), // active, past, pending
  archived: boolean("archived").default(false), // for archiving tenants
  notes: text("notes"),
});

export const tenantsRelations = relations(tenants, ({ one, many }) => ({
  property: one(properties, { fields: [tenants.propertyId], references: [properties.id] }),
  payments: many(payments),
  messages: many(messages),
}));

export const insertTenantSchema = createInsertSchema(tenants).omit({ id: true });
export type InsertTenant = z.infer<typeof insertTenantSchema>;
export type Tenant = typeof tenants.$inferSelect;

// Payments
export const payments = pgTable("payments", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id", { length: 36 }).notNull().references(() => tenants.id),
  propertyId: varchar("property_id", { length: 36 }).notNull().references(() => properties.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  paymentDate: timestamp("payment_date").notNull(),
  dueDate: timestamp("due_date").notNull(),
  paymentPurpose: text("payment_purpose").default("rent"), // rent, security_deposit, last_month_rent, utilities, fees, other
  paymentMonth: text("payment_month"), // Format: "YYYY-MM" for month's rent being paid
  isLastMonthRent: boolean("is_last_month_rent").default(false), // Floating last month's rent
  paymentMethod: text("payment_method").notNull(), // cash, check, bank_transfer, card
  status: text("status").default("completed"), // pending, completed, late, partial
  receiptNumber: text("receipt_number"),
  notes: text("notes"),
});

export const paymentsRelations = relations(payments, ({ one }) => ({
  tenant: one(tenants, { fields: [payments.tenantId], references: [tenants.id] }),
  property: one(properties, { fields: [payments.propertyId], references: [properties.id] }),
}));

export const insertPaymentSchema = createInsertSchema(payments).omit({ id: true });
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Payment = typeof payments.$inferSelect;

// Vacancy Applications
export const applications = pgTable("applications", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  propertyId: varchar("property_id", { length: 36 }).notNull().references(() => properties.id),
  // Applicant details
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  // Current residence
  currentAddress: text("current_address"),
  currentCity: text("current_city"),
  currentState: text("current_state"),
  currentRent: decimal("current_rent", { precision: 10, scale: 2 }),
  creditScore: integer("credit_score"),
  // Current landlord
  currentLandlordFirstName: text("current_landlord_first_name"),
  currentLandlordLastName: text("current_landlord_last_name"),
  currentLandlordPhone: text("current_landlord_phone"),
  currentLandlordEmail: text("current_landlord_email"),
  // Employment details
  employerName: text("employer_name"),
  employerCity: text("employer_city"),
  occupation: text("occupation"),
  employmentDuration: text("employment_duration"),
  monthlyIncome: decimal("monthly_income", { precision: 10, scale: 2 }),
  employerPhone: text("employer_phone"),
  employerEmail: text("employer_email"),
  employmentStatus: text("employment_status"),
  // Reason and occupants
  reasonForMoving: text("reason_for_moving"),
  occupants: text("occupants"), // List of people living in unit
  // Reference 1
  referee1FirstName: text("referee1_first_name"),
  referee1LastName: text("referee1_last_name"),
  referee1Phone: text("referee1_phone"),
  referee1Relationship: text("referee1_relationship"),
  // Pets and smoking
  hasPets: boolean("has_pets").default(false),
  petDetails: text("pet_details"),
  hasSmokers: boolean("has_smokers").default(false),
  // Move-in and consent
  moveInDate: timestamp("move_in_date"),
  preferredMoveInTime: text("preferred_move_in_time"),
  alternativeMoveInDate: text("alternative_move_in_date"),
  consentToBackgroundCheck: boolean("consent_to_background_check").default(false),
  message: text("message"),
  status: text("status").default("pending"), // pending, reviewing, approved, rejected
  submittedAt: timestamp("submitted_at").default(sql`now()`),
});

export const applicationsRelations = relations(applications, ({ one }) => ({
  property: one(properties, { fields: [applications.propertyId], references: [properties.id] }),
}));

export const insertApplicationSchema = createInsertSchema(applications).omit({ id: true, submittedAt: true });
export type InsertApplication = z.infer<typeof insertApplicationSchema>;
export type Application = typeof applications.$inferSelect;

// Property Viewings
export const viewings = pgTable("viewings", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  propertyId: varchar("property_id", { length: 36 }).notNull().references(() => properties.id),
  applicantName: text("applicant_name").notNull(),
  applicantEmail: text("applicant_email").notNull(),
  applicantPhone: text("applicant_phone").notNull(),
  scheduledDate: timestamp("scheduled_date").notNull(),
  status: text("status").default("scheduled"), // scheduled, completed, cancelled, no_show
  notes: text("notes"),
});

export const viewingsRelations = relations(viewings, ({ one }) => ({
  property: one(properties, { fields: [viewings.propertyId], references: [properties.id] }),
}));

export const insertViewingSchema = createInsertSchema(viewings).omit({ id: true });
export type InsertViewing = z.infer<typeof insertViewingSchema>;
export type Viewing = typeof viewings.$inferSelect;

// Messages
export const messages = pgTable("messages", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  senderId: varchar("sender_id", { length: 36 }).notNull().references(() => users.id),
  recipientId: varchar("recipient_id", { length: 36 }), // null for applicants
  recipientEmail: text("recipient_email").notNull(),
  recipientName: text("recipient_name").notNull(),
  recipientType: text("recipient_type").notNull(), // tenant, applicant
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  sentAt: timestamp("sent_at").default(sql`now()`),
  isRead: boolean("is_read").default(false),
});

export const messagesRelations = relations(messages, ({ one }) => ({
  sender: one(users, { fields: [messages.senderId], references: [users.id] }),
}));

export const insertMessageSchema = createInsertSchema(messages).omit({ id: true, sentAt: true, isRead: true });
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;

// Expenses for property management
export const expenses = pgTable("expenses", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  propertyId: varchar("property_id", { length: 36 }).notNull().references(() => properties.id),
  landlordId: varchar("landlord_id", { length: 36 }).notNull().references(() => users.id),
  category: text("category").notNull(), // maintenance, repairs, utilities, insurance, taxes, management_fees, supplies, other
  description: text("description").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  expenseDate: timestamp("expense_date").notNull(),
  lodgementDate: timestamp("lodgement_date"), // date receipt/expense was lodged
  vendor: text("vendor"),
  receiptUrl: text("receipt_url"), // URL or path to receipt file
  receiptFilename: text("receipt_filename"),
  isDeductible: boolean("is_deductible").default(true), // tax deductible
  notes: text("notes"),
  createdAt: timestamp("created_at").default(sql`now()`),
});

export const expensesRelations = relations(expenses, ({ one }) => ({
  property: one(properties, { fields: [expenses.propertyId], references: [properties.id] }),
  landlord: one(users, { fields: [expenses.landlordId], references: [users.id] }),
}));

export const insertExpenseSchema = createInsertSchema(expenses).omit({ id: true, createdAt: true });
export type InsertExpense = z.infer<typeof insertExpenseSchema>;
export type Expense = typeof expenses.$inferSelect;

// Maintenance Requests
export const maintenanceRequests = pgTable("maintenance_requests", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  propertyId: varchar("property_id", { length: 36 }).notNull().references(() => properties.id),
  landlordId: varchar("landlord_id", { length: 36 }).notNull().references(() => users.id),
  requestType: text("request_type").notNull(), // maintenance, access
  reason: text("reason").notNull(),
  scheduledDate: timestamp("scheduled_date").notNull(),
  startTime: text("start_time").notNull(), // e.g., "09:00"
  endTime: text("end_time").notNull(), // e.g., "18:00"
  status: text("status").default("scheduled"), // scheduled, completed, cancelled
  notes: text("notes"),
  createdAt: timestamp("created_at").default(sql`now()`),
});

export const maintenanceRequestsRelations = relations(maintenanceRequests, ({ one }) => ({
  property: one(properties, { fields: [maintenanceRequests.propertyId], references: [properties.id] }),
  landlord: one(users, { fields: [maintenanceRequests.landlordId], references: [users.id] }),
}));

export const insertMaintenanceRequestSchema = createInsertSchema(maintenanceRequests).omit({ id: true, createdAt: true });
export type InsertMaintenanceRequest = z.infer<typeof insertMaintenanceRequestSchema>;
export type MaintenanceRequest = typeof maintenanceRequests.$inferSelect;

// Email Templates
export const emailTemplates = pgTable("email_templates", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  landlordId: varchar("landlord_id", { length: 36 }).notNull().references(() => users.id),
  templateType: text("template_type").notNull(), // payment_receipt, viewing_confirmation, maintenance_notification, lease_reminder
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  isActive: boolean("is_active").default(true),
  updatedAt: timestamp("updated_at").default(sql`now()`),
});

export const emailTemplatesRelations = relations(emailTemplates, ({ one }) => ({
  landlord: one(users, { fields: [emailTemplates.landlordId], references: [users.id] }),
}));

export const insertEmailTemplateSchema = createInsertSchema(emailTemplates).omit({ id: true, updatedAt: true });
export type InsertEmailTemplate = z.infer<typeof insertEmailTemplateSchema>;
export type EmailTemplate = typeof emailTemplates.$inferSelect;

// Users relations
export const usersRelations = relations(users, ({ many }) => ({
  properties: many(properties),
  messages: many(messages),
  expenses: many(expenses),
  maintenanceRequests: many(maintenanceRequests),
  emailTemplates: many(emailTemplates),
}));
