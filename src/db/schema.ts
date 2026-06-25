import {
    pgTable,
    uuid,
    varchar,
    decimal,
    integer,
    boolean,
    timestamp,
    text,
    pgEnum,
    index,
    uniqueIndex,
    foreignKey,
    jsonb,
    check,
} from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';

// ==========================================
// TYPAGE TYPESCRIPT — JSONB
// ==========================================

export type PaymentInfoDetails =
  | { 
      type: 'CB'; 
      transactionId: string; 
      last4: string; 
      brand: string; 
    }
  | { 
      type: 'VIREMENT'; 
      providerReferenceId: string; // Token ou ID de virement généré par la banque/PSP
      maskedIban: string;          // Version masquée pour l'affichage (ex: FR76 •••• •••• 1234)
      bankName: string; 
    }
  | { 
      type: 'CHEQUE'; 
      providerReferenceId: string; // ID unique du scan ou de l'enregistrement du chèque (Back-office/ERP)
      maskedAccount: string;       // Version masquée du numéro de compte associé si nécessaire
      drawerName: string;          // Nom de l'émetteur (non sensible, utile pour lettrage comptable)
    };

export type AddressDetails = {
    street: string;
    complement?: string;
    zipCode: string;
    city: string;
    country: string;
};

export type AddressItem = {
    id: string;
    street: string;
    complement?: string;
    zipCode: string;
    city: string;
    country: string;
    isDefaultDelivery: boolean;
    isDefaultBilling: boolean;
};

// ==========================================
// ENUMS POSTGRESQL
// ==========================================

export const userRoleEnum      = pgEnum('user_role',      ['CUSTOMER_B2C', 'CUSTOMER_B2B', 'ADMIN', 'COMMERCIAL']);
export const clientTypeEnum    = pgEnum('client_type',    ['PARTICULIER', 'PROFESSIONNEL']);
export const orderStatusEnum   = pgEnum('order_status',   ['PENDING', 'PAID', 'PARTIALLY_SHIPPED', 'SHIPPED', 'CANCELLED']);
export const paymentMethodEnum = pgEnum('payment_method', ['CB', 'VIREMENT', 'CHEQUE']);

// ==========================================
// TABLES D'AUTHENTIFICATION (Better Auth + Extensions)
// ==========================================

export const user = pgTable('user', {
    id:            text('id').primaryKey(),
    name:          text('name').notNull(),
    email:         text('email').notNull().unique(),
    emailVerified: boolean('email_verified').default(false).notNull(),
    image:         text('image'),
    role:          userRoleEnum('role').default('CUSTOMER_B2C').notNull(),
    customerId:    uuid('customer_id').references(() => customers.id, { onDelete: 'set null' }),
    savedAddresses: jsonb('saved_addresses').$type<AddressItem[]>().default([]).notNull(),

    createdAt:     timestamp('created_at').defaultNow().notNull(),
    updatedAt:     timestamp('updated_at')
        .defaultNow()
        .$onUpdate(() => new Date())
        .notNull(),
}, (table) => [
    index('idx_user_customer').on(table.customerId),
]);

export const session = pgTable('session', {
    id:        text('id').primaryKey(),
    expiresAt: timestamp('expires_at').notNull(),
    token:     text('token').notNull().unique(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    userId:    text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
        .$onUpdate(() => new Date())
        .notNull(),
}, (table) => [
    index('session_userId_idx').on(table.userId),
]);

export const account = pgTable('account', {
    id:                     text('id').primaryKey(),
    accountId:              text('account_id').notNull(),
    providerId:             text('provider_id').notNull(),
    userId:                 text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
    accessToken:            text('access_token'),
    refreshToken:           text('refresh_token'),
    idToken:                text('id_token'),
    accessTokenExpiresAt:   timestamp('access_token_expires_at'),
    refreshTokenExpiresAt:  timestamp('refresh_token_expires_at'),
    scope:                  text('scope'),
    password:               text('password'),
    createdAt:              timestamp('created_at').defaultNow().notNull(),
    updatedAt:              timestamp('updated_at')
        .$onUpdate(() => new Date())
        .notNull(),
}, (table) => [
    index('account_userId_idx').on(table.userId),
]);

export const verification = pgTable('verification', {
    id:         text('id').primaryKey(),
    identifier: text('identifier').notNull(),
    value:      text('value').notNull(),
    expiresAt:  timestamp('expires_at').notNull(),
    createdAt:  timestamp('created_at').defaultNow().notNull(),
    updatedAt:  timestamp('updated_at')
        .defaultNow()
        .$onUpdate(() => new Date())
        .notNull(),
}, (table) => [
    index('verification_identifier_idx').on(table.identifier),
]);

// ==========================================
// TABLES MÉTIERS — Village Green
// ==========================================

export const providers = pgTable('providers', {
    id:          uuid('id').primaryKey().defaultRandom(),
    name:        varchar('name', { length: 100 }).notNull(),
    refProvider: varchar('ref_provider', { length: 50 }).notNull().unique(),
    createdAt:   timestamp('created_at').defaultNow().notNull(),
});

export const categories = pgTable('categories', {
    id:       uuid('id').primaryKey().defaultRandom(),
    name:     varchar('name', { length: 100 }).notNull(),
    parentId: uuid('parent_id'),
}, (table) => [
    index('idx_categories_parent').on(table.parentId),
    foreignKey({
        columns:        [table.parentId],
        foreignColumns: [table.id],
        name:           'fk_categories_parent',
    }).onDelete('cascade'),
]);

export const products = pgTable('products', {
    id:            uuid('id').primaryKey().defaultRandom(),
    labelShort:    varchar('label_short', { length: 100 }).notNull(),
    labelLong:     text('label_long').notNull(),
    providerRef:   varchar('provider_ref', { length: 100 }).notNull(),
    priceBuyHt:    decimal('price_buy_ht', { precision: 10, scale: 2 }).notNull(),
    vatRate:       decimal('vat_rate', { precision: 4, scale: 2 }).default('20.00').notNull(),
    photoUrl:      varchar('photo_url', { length: 255 }),
    stockQuantity: integer('stock_quantity').default(0).notNull(),
    isActive:      boolean('is_active').default(true).notNull(),
    categoryId:    uuid('category_id').notNull().references(() => categories.id, { onDelete: 'restrict' }),
    providerId:    uuid('provider_id').notNull().references(() => providers.id,  { onDelete: 'restrict' }),
    createdAt:     timestamp('created_at').defaultNow().notNull(),
}, (table) => [
    index('idx_products_category').on(table.categoryId),
    index('idx_products_provider').on(table.providerId),
    index('idx_products_lookup').on(table.isActive, table.stockQuantity),
    index('idx_products_search').on(table.labelShort),
    check('check_non_negative_stock', sql`${table.stockQuantity} >= 0`),
    check('check_positive_price_buy', sql`${table.priceBuyHt} > 0`),
    check('check_valid_vat_rate', sql`${table.vatRate} >= 0 AND ${table.vatRate} <= 100`),
]);

export const commercials = pgTable('commercials', {
    id:        uuid('id').primaryKey().defaultRandom(),
    firstName: varchar('first_name', { length: 50 }).notNull(),
    lastName:  varchar('last_name',  { length: 50 }).notNull(),
    email:     varchar('email',      { length: 100 }).notNull().unique(),
});

export const customers = pgTable('customers', {
    id:           uuid('id').primaryKey().defaultRandom(),
    customerRef:  varchar('customer_ref', { length: 50 }).notNull().unique(),
    type:         clientTypeEnum('type').notNull(),
    companyName:  varchar('company_name', { length: 100 }),
    siret:        varchar('siret', { length: 14 }),
    vatNumber:    varchar('vat_number', { length: 25 }),
    firstName:    varchar('first_name',   { length: 50 }).notNull(),
    lastName:     varchar('last_name',    { length: 50 }).notNull(),
    email:        varchar('email',        { length: 100 }).notNull().unique(),
    coefficient:  decimal('coefficient',  { precision: 4, scale: 2 }).notNull(),
    commercialId: uuid('commercial_id').notNull().references(() => commercials.id, { onDelete: 'restrict' }),
    createdAt:    timestamp('created_at').defaultNow().notNull(),
}, (table) => [
    index('idx_customers_commercial').on(table.commercialId),
    index('idx_customers_type').on(table.type),
    check('check_positive_coefficient', sql`${table.coefficient} > 0`),
]);

export const orders = pgTable('orders', {
    id:              uuid('id').primaryKey().defaultRandom(),
    customerId:      uuid('customer_id').notNull().references(() => customers.id, { onDelete: 'restrict' }),
    status:          orderStatusEnum('status').default('PENDING').notNull(),
    discountB2b:     decimal('discount_b2b', { precision: 5, scale: 2 }).default('0.00').notNull(),
    deliveryAddress: jsonb('delivery_address').$type<AddressDetails>().notNull(),
    billingAddress:  jsonb('billing_address').$type<AddressDetails>().notNull(),
    createdAt:       timestamp('created_at').defaultNow().notNull(),
    archivedAt:      timestamp('archived_at'), // AJOUT : Gestion de la règle des 3 ans (soft-delete / purge cible)
}, (table) => [
    index('idx_orders_customer').on(table.customerId),
    index('idx_orders_metrics').on(table.createdAt, table.status),
    index('idx_orders_archive').on(table.archivedAt),
    check('check_valid_discount', sql`${table.discountB2b} >= 0 AND ${table.discountB2b} <= 100`),
]);

export const orderDetails = pgTable('order_details', {
    id:               uuid('id').primaryKey().defaultRandom(),
    orderId:          uuid('order_id').notNull().references(() => orders.id,   { onDelete: 'cascade' }),
    productId:        uuid('product_id').notNull().references(() => products.id, { onDelete: 'restrict' }),
    quantity:         integer('quantity').notNull(),
    unitPriceBuyHt:   decimal('unit_price_buy_ht',  { precision: 10, scale: 2 }).notNull(),
    unitPriceSellHt:  decimal('unit_price_sell_ht', { precision: 10, scale: 2 }).notNull(),
    vatRateApplied:   decimal('vat_rate_applied',   { precision: 4, scale: 2 }).notNull(),
}, (table) => [
    index('idx_order_details_order').on(table.orderId),
    index('idx_order_details_product').on(table.productId),
    check('check_positive_quantity',       sql`${table.quantity} > 0`),
    check('check_positive_price_buy_ht',   sql`${table.unitPriceBuyHt} > 0`),
    check('check_positive_price_sell_ht',  sql`${table.unitPriceSellHt} > 0`),
    check('check_valid_vat_rate_applied',  sql`${table.vatRateApplied} >= 0 AND ${table.vatRateApplied} <= 100`),
]);

export const deliveryNotes = pgTable('delivery_notes', {
    id:        uuid('id').primaryKey().defaultRandom(),
    orderId:   uuid('order_id').notNull().references(() => orders.id, { onDelete: 'restrict' }),
    shippedAt: timestamp('shipped_at').defaultNow().notNull(),
}, (table) => [
    index('idx_delivery_notes_order').on(table.orderId),
]);

export const deliveryNoteDetails = pgTable('delivery_note_details', {
    id:              uuid('id').primaryKey().defaultRandom(),
    deliveryNoteId:  uuid('delivery_note_id').notNull().references(() => deliveryNotes.id,  { onDelete: 'cascade' }),
    orderDetailId:   uuid('order_detail_id').notNull().references(() => orderDetails.id, { onDelete: 'restrict' }),
    quantityShipped: integer('quantity_shipped').notNull(),
}, (table) => [
    index('idx_dn_details_note').on(table.deliveryNoteId),
    index('idx_dn_details_line').on(table.orderDetailId),
    check('check_positive_shipped_qty', sql`${table.quantityShipped} > 0`),
]);

export const invoices = pgTable('invoices', {
    id:            uuid('id').primaryKey().defaultRandom(),
    orderId:       uuid('order_id').notNull().references(() => orders.id, { onDelete: 'restrict' }),
    invoiceDate:   timestamp('invoice_date').defaultNow().notNull(),
    totalHt:       decimal('total_ht', { precision: 10, scale: 2 }).notNull(),
    totalTtc:      decimal('total_ttc', { precision: 10, scale: 2 }).notNull(),
    paymentMethod: paymentMethodEnum('payment_method'), // Nullable pour le flux différé B2B
    paymentInfo:   jsonb('payment_info').$type<PaymentInfoDetails>(), // Nullable tant que non payé
    isPaid:        boolean('is_paid').default(false).notNull(),
}, (table) => [
    uniqueIndex('idx_invoices_order_unique').on(table.orderId),
    check('check_positive_totals', sql`${table.totalHt} >= 0 AND ${table.totalTtc} >= ${table.totalHt}`),
          check(
   'check_paid_invoice_payment_info', 
          sql`
          ${table.isPaid} = false
            OR (
                ${table.paymentMethod} IS NOT NULL
                AND ${table.paymentInfo} IS NOT NULL
                AND ${table.paymentInfo}->>'type' = ${table.paymentMethod}::text
            )
        `,
    ),
       
]);

// ==========================================
// RELATIONS TYPÉES (Drizzle)
// ==========================================

export const userRelations = relations(user, ({ one, many }) => ({
    customer: one(customers, { fields: [user.customerId], references: [customers.id] }),
    sessions: many(session),
    accounts: many(account),
}));

export const sessionRelations = relations(session, ({ one }) => ({
    user: one(user, { fields: [session.userId], references: [user.id] }),
}));

export const accountRelations = relations(account, ({ one }) => ({
    user: one(user, { fields: [account.userId], references: [user.id] }),
}));

export const providerRelations = relations(providers, ({ many }) => ({
    products: many(products),
}));

export const categoryRelations = relations(categories, ({ one, many }) => ({
    parent:        one(categories, { fields: [categories.parentId], references: [categories.id], relationName: 'sub_categories' }),
    subCategories: many(categories, { relationName: 'sub_categories' }),
    products:      many(products),
}));

export const productRelations = relations(products, ({ one, many }) => ({
    category:     one(categories, { fields: [products.categoryId], references: [categories.id] }),
    provider:     one(providers,  { fields: [products.providerId],  references: [providers.id] }),
    orderDetails: many(orderDetails),
}));

export const commercialRelations = relations(commercials, ({ many }) => ({
    customers: many(customers),
}));

export const customerRelations = relations(customers, ({ one, many }) => ({
    commercial: one(commercials, { fields: [customers.commercialId], references: [commercials.id] }),
    orders:     many(orders),
    users:      many(user),
}));

export const orderRelations = relations(orders, ({ one, many }) => ({
    customer:      one(customers, { fields: [orders.customerId], references: [customers.id] }),
    orderDetails:  many(orderDetails),
    deliveryNotes: many(deliveryNotes),
    invoice:       one(invoices, { fields: [orders.id], references: [invoices.orderId] }),
}));

export const orderDetailsRelations = relations(orderDetails, ({ one, many }) => ({
    order:              one(orders,   { fields: [orderDetails.orderId],   references: [orders.id] }),
    product:            one(products, { fields: [orderDetails.productId], references: [products.id] }),
    deliveryComponents: many(deliveryNoteDetails),
}));

export const deliveryNoteRelations = relations(deliveryNotes, ({ one, many }) => ({
    order:           one(orders, { fields: [deliveryNotes.orderId], references: [orders.id] }),
    deliveryDetails: many(deliveryNoteDetails),
}));

export const deliveryNoteDetailsRelations = relations(deliveryNoteDetails, ({ one }) => ({
    deliveryNote: one(deliveryNotes,  { fields: [deliveryNoteDetails.deliveryNoteId], references: [deliveryNotes.id] }),
    orderDetail:  one(orderDetails, { fields: [deliveryNoteDetails.orderDetailId],  references: [orderDetails.id] }),
}));

export const invoiceRelations = relations(invoices, ({ one }) => ({
    order: one(orders, { fields: [invoices.orderId], references: [orders.id] }),
}));

export const schema = {
    // Enums
    userRoleEnum,
    clientTypeEnum,
    orderStatusEnum,
    paymentMethodEnum,

    // Tables
    user,
    session,
    account,
    verification,
    providers,
    categories,
    products,
    commercials,
    customers,
    orders,
    orderDetails,
    deliveryNotes,
    deliveryNoteDetails,
    invoices,

    // Relations
    userRelations,
    sessionRelations,
    accountRelations,
    providerRelations,
    categoryRelations,
    productRelations,
    commercialRelations,
    customerRelations,
    orderRelations,
    orderDetailsRelations,
    deliveryNoteRelations,
    deliveryNoteDetailsRelations,
    invoiceRelations,
};