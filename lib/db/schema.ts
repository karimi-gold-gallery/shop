import { createId } from "@paralleldrive/cuid2";
import { relations, sql } from "drizzle-orm";
import {
  boolean,
  check,
  customType,
  doublePrecision,
  foreignKey,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

/**
 * Table and column names are the PascalCase/camelCase identifiers created by the
 * original Prisma schema, so this schema maps onto the existing database as-is.
 */

const bytea = customType<{ data: Buffer; driverData: Buffer }>({
  dataType() {
    return "bytea";
  },
});

/** Prisma generated ids client-side; we keep doing the same so ids stay opaque cuids. */
const id = () =>
  text("id")
    .primaryKey()
    .notNull()
    .$defaultFn(() => createId());

const createdAt = () =>
  timestamp("createdAt", { precision: 3, mode: "date" })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull();

/** Mirrors Prisma's `@updatedAt`: written by the client on insert and on update. */
const updatedAt = () =>
  timestamp("updatedAt", { precision: 3, mode: "date" })
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdate(() => new Date());

/* -------------------------------------------------------------------------- */

export const users = pgTable(
  "User",
  {
    id: id(),
    username: text("username").notNull(),
    passwordHash: text("passwordHash").notNull(),
    role: text("role").default("CUSTOMER").notNull(),
    /** Personal discount (0-100 %) applied to every price this customer sees. */
    discountPercent: doublePrecision("discountPercent").default(0).notNull(),
    firstName: text("firstName"),
    lastName: text("lastName"),
    birthDate: text("birthDate"),
    gender: text("gender"),
    phone: text("phone"),
    nationalCode: text("nationalCode"),
    address: text("address"),
    city: text("city"),
    postalCode: text("postalCode"),
    onboarded: boolean("onboarded").default(false).notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [uniqueIndex("User_username_key").on(table.username)]
);

export const sessions = pgTable(
  "Session",
  {
    id: id(),
    token: text("token").notNull(),
    userId: text("userId").notNull(),
    expiresAt: timestamp("expiresAt", { precision: 3, mode: "date" }).notNull(),
    createdAt: createdAt(),
  },
  (table) => [
    uniqueIndex("Session_token_key").on(table.token),
    index("Session_userId_idx").on(table.userId),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: "Session_userId_fkey",
    })
      .onUpdate("cascade")
      .onDelete("cascade"),
  ]
);

export const categories = pgTable(
  "Category",
  {
    id: id(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    description: text("description"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    uniqueIndex("Category_name_key").on(table.name),
    uniqueIndex("Category_slug_key").on(table.slug),
  ]
);

export const products = pgTable(
  "Product",
  {
    id: id(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    description: text("description"),
    weight: doublePrecision("weight").notNull(),
    karat: integer("karat").default(18).notNull(),
    wage: doublePrecision("wage").default(0).notNull(),
    active: boolean("active").default(true).notNull(),
    categoryId: text("categoryId").notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    uniqueIndex("Product_slug_key").on(table.slug),
    check("Product_karat_check", sql`${table.karat} in (18, 24)`),
    foreignKey({
      columns: [table.categoryId],
      foreignColumns: [categories.id],
      name: "Product_categoryId_fkey",
    })
      .onUpdate("cascade")
      .onDelete("restrict"),
  ]
);

export const productImages = pgTable(
  "ProductImage",
  {
    id: id(),
    productId: text("productId").notNull(),
    data: bytea("data").notNull(),
    mimeType: text("mimeType").notNull(),
    createdAt: createdAt(),
  },
  (table) => [
    index("ProductImage_productId_idx").on(table.productId),
    foreignKey({
      columns: [table.productId],
      foreignColumns: [products.id],
      name: "ProductImage_productId_fkey",
    })
      .onUpdate("cascade")
      .onDelete("cascade"),
  ]
);

export const cartItems = pgTable(
  "CartItem",
  {
    id: id(),
    userId: text("userId").notNull(),
    productId: text("productId").notNull(),
    quantity: integer("quantity").default(1).notNull(),
    createdAt: createdAt(),
  },
  (table) => [
    uniqueIndex("CartItem_userId_productId_key").on(table.userId, table.productId),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: "CartItem_userId_fkey",
    })
      .onUpdate("cascade")
      .onDelete("cascade"),
    foreignKey({
      columns: [table.productId],
      foreignColumns: [products.id],
      name: "CartItem_productId_fkey",
    })
      .onUpdate("cascade")
      .onDelete("cascade"),
  ]
);

export const orders = pgTable(
  "Order",
  {
    id: id(),
    code: text("code").notNull(),
    userId: text("userId").notNull(),
    status: text("status").default("PENDING").notNull(),
    totalGrams: doublePrecision("totalGrams").notNull(),
    totalWage: doublePrecision("totalWage").notNull(),
    goldPrice: doublePrecision("goldPrice").notNull(),
    totalPrice: doublePrecision("totalPrice").notNull(),
    note: text("note"),
    /** Customer discount (0-100 %) that was in effect when the order was placed. */
    discountPercent: doublePrecision("discountPercent").default(0).notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    uniqueIndex("Order_code_key").on(table.code),
    index("Order_status_idx").on(table.status),
    index("Order_userId_idx").on(table.userId),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: "Order_userId_fkey",
    })
      .onUpdate("cascade")
      .onDelete("restrict"),
  ]
);

export const orderItems = pgTable(
  "OrderItem",
  {
    id: id(),
    orderId: text("orderId").notNull(),
    productId: text("productId").notNull(),
    name: text("name").notNull(),
    weight: doublePrecision("weight").notNull(),
    karat: integer("karat").default(18).notNull(),
    wage: doublePrecision("wage").notNull(),
    goldPrice: doublePrecision("goldPrice").notNull(),
    unitPrice: doublePrecision("unitPrice").notNull(),
    quantity: integer("quantity").notNull(),
    imageId: text("imageId"),
    createdAt: createdAt(),
  },
  (table) => [
    index("OrderItem_orderId_idx").on(table.orderId),
    check("OrderItem_karat_check", sql`${table.karat} in (18, 24)`),
    foreignKey({
      columns: [table.orderId],
      foreignColumns: [orders.id],
      name: "OrderItem_orderId_fkey",
    })
      .onUpdate("cascade")
      .onDelete("cascade"),
    foreignKey({
      columns: [table.productId],
      foreignColumns: [products.id],
      name: "OrderItem_productId_fkey",
    })
      .onUpdate("cascade")
      .onDelete("restrict"),
  ]
);

export const settings = pgTable(
  "Setting",
  {
    id: id(),
    key: text("key").notNull(),
    value: text("value").notNull(),
  },
  (table) => [uniqueIndex("Setting_key_key").on(table.key)]
);

export const goldPrices = pgTable(
  "GoldPrice",
  {
    karat: integer("karat").primaryKey().notNull(),
    pricePerGram: doublePrecision("pricePerGram").notNull(),
    sourcePriceRial: doublePrecision("sourcePriceRial").notNull(),
    sourceTime: text("sourceTime").notNull(),
    syncedAt: timestamp("syncedAt", { precision: 3, mode: "date" })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => [
    check("GoldPrice_karat_check", sql`${table.karat} in (18, 24)`),
    check("GoldPrice_price_check", sql`${table.pricePerGram} > 0`),
  ]
);

/* ------------------------------- relations -------------------------------- */

export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
  cartItems: many(cartItems),
  orders: many(orders),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  images: many(productImages),
  cartItems: many(cartItems),
  orderItems: many(orderItems),
}));

export const productImagesRelations = relations(productImages, ({ one }) => ({
  product: one(products, {
    fields: [productImages.productId],
    references: [products.id],
  }),
}));

export const cartItemsRelations = relations(cartItems, ({ one }) => ({
  user: one(users, { fields: [cartItems.userId], references: [users.id] }),
  product: one(products, {
    fields: [cartItems.productId],
    references: [products.id],
  }),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, { fields: [orders.userId], references: [users.id] }),
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}));

/* --------------------------------- types ---------------------------------- */

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
export type ProductImage = typeof productImages.$inferSelect;
export type NewProductImage = typeof productImages.$inferInsert;
export type CartItem = typeof cartItems.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type OrderItem = typeof orderItems.$inferSelect;
export type NewOrderItem = typeof orderItems.$inferInsert;
export type Setting = typeof settings.$inferSelect;
export type GoldPrice = typeof goldPrices.$inferSelect;
