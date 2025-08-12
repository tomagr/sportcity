import { pgTable, text, boolean, timestamp, uuid, uniqueIndex, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const users = pgTable('User', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('passwordHash').notNull(),
  firstName: text('firstName'),
  lastName: text('lastName'),
  avatarUrl: text('avatarUrl'),
  isAdmin: boolean('isAdmin').notNull().default(false),
  createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updatedAt', { mode: 'date' }).notNull().defaultNow(),
});

export const passwordResetTokens = pgTable('PasswordResetToken', {
  id: uuid('id').defaultRandom().primaryKey(),
  token: text('token').notNull().unique(),
  userId: uuid('userId').notNull(),
  expiresAt: timestamp('expiresAt', { mode: 'date' }).notNull(),
  createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
});


// Ads table (external IDs from Meta are stored as text)
export const ads = pgTable(
  'Ad',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    adId: text('adId').notNull(),
    adName: text('adName'),
    adsetId: text('adsetId'),
    adsetName: text('adsetName'),
    adgroupId: text('adgroupId'),
    campaignId: text('campaignId'),
    campaignName: text('campaignName'),
    formId: text('formId'),
    formName: text('formName'),
    createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
    updatedAt: timestamp('updatedAt', { mode: 'date' }).notNull().defaultNow(),
  },
  (t) => ({
    adIdUniqueIdx: uniqueIndex('Ad_adId_unique').on(t.adId),
  })
);

export const adsRelations = relations(ads, ({ many }) => ({
  leads: many(() => leads),
}));

// Leads table
export const leads = pgTable(
  'Lead',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    // Meta/Facebook lead identifier from CSV (keep as text; values can include prefixes like l:)
    metaId: text('metaId').notNull(),

    firstName: text('firstName'),
    lastName: text('lastName'),
    email: text('email'),
    phoneNumber: text('phoneNumber'),
    leadStatus: text('leadStatus'),
    age: text('age'),
    clubOfInterest: text('clubOfInterest'),
    platform: text('platform'),
    createdTime: timestamp('createdTime', { mode: 'date' }),

    // Association
    adId: uuid('adId').notNull().references(() => ads.id, { onDelete: 'restrict', onUpdate: 'cascade' }),

    // Import batch identifier to group leads created from the same file
    importId: text('importId'),

    createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
    updatedAt: timestamp('updatedAt', { mode: 'date' }).notNull().defaultNow(),
  },
  (t) => ({
    metaIdUniqueIdx: uniqueIndex('Lead_metaId_unique').on(t.metaId),
    importIdx: index('Lead_importId_idx').on(t.importId),
  })
);

export const leadsRelations = relations(leads, ({ one }) => ({
  ad: one(() => ads, {
    fields: [leads.adId],
    references: [ads.id],
  }),
}));


