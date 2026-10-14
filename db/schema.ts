import {integer,sqliteTable,text,primaryKey} from 'drizzle-orm/sqlite-core';
export const workspaces=sqliteTable('workspaces',{owner:text('owner').primaryKey(),content:text('content').notNull(),revision:integer('revision').notNull().default(0),updatedAt:text('updated_at').notNull()});
export const audit=sqliteTable('audit',{owner:text('owner').notNull(),eventId:text('event_id').notNull(),operation:text('operation').notNull(),createdAt:text('created_at').notNull(),revision:integer('revision').notNull()},t=>[primaryKey({columns:[t.owner,t.eventId]})]);
