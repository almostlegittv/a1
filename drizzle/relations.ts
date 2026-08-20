import { relations } from "drizzle-orm";
import { bookingRequests, catalogGames, streamerCatalog, streamerProfiles, users } from "./schema";

export const usersRelations = relations(users, ({ many }) => ({
  streamerProfiles: many(streamerProfiles),
  bookingRequests: many(bookingRequests),
}));

export const streamerProfilesRelations = relations(streamerProfiles, ({ one, many }) => ({
  owner: one(users, { fields: [streamerProfiles.ownerUserId], references: [users.id] }),
  catalog: many(streamerCatalog),
  bookingRequests: many(bookingRequests),
}));

export const catalogGamesRelations = relations(catalogGames, ({ many }) => ({
  streamerCatalog: many(streamerCatalog),
  bookingRequests: many(bookingRequests),
}));

export const streamerCatalogRelations = relations(streamerCatalog, ({ one }) => ({
  streamerProfile: one(streamerProfiles, { fields: [streamerCatalog.streamerProfileId], references: [streamerProfiles.id] }),
  game: one(catalogGames, { fields: [streamerCatalog.gameId], references: [catalogGames.id] }),
}));

export const bookingRequestsRelations = relations(bookingRequests, ({ one }) => ({
  streamerProfile: one(streamerProfiles, { fields: [bookingRequests.streamerProfileId], references: [streamerProfiles.id] }),
  game: one(catalogGames, { fields: [bookingRequests.gameId], references: [catalogGames.id] }),
  viewer: one(users, { fields: [bookingRequests.viewerUserId], references: [users.id] }),
}));
