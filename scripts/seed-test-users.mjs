import mysql from "mysql2/promise";

if (process.env.NODE_ENV === "production" || process.env.ALLOW_TEST_FIXTURES !== "true") {
  throw new Error("Refusing to seed test fixtures. Set ALLOW_TEST_FIXTURES=true outside production.");
}

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is required.");

const connection = await mysql.createConnection(databaseUrl);
const close = async () => connection.end();

try {
  const users = [
    { openId: "test-admin-almostlegit", name: "Test Admin", email: "test-admin@example.invalid", role: "admin" },
    { openId: "test-creator-almostlegit", name: "Test Creator", email: "test-creator@example.invalid", role: "user" },
    { openId: "test-viewer-almostlegit", name: "Test Viewer", email: "test-viewer@example.invalid", role: "user" },
  ];

  for (const user of users) {
    await connection.execute(
      "INSERT INTO users (openId, name, email, loginMethod, role) VALUES (?, ?, ?, 'test-fixture', ?) ON DUPLICATE KEY UPDATE name = VALUES(name), email = VALUES(email), role = VALUES(role), lastSignedIn = CURRENT_TIMESTAMP",
      [user.openId, user.name, user.email, user.role],
    );
  }

  const [[creator]] = await connection.query("SELECT id FROM users WHERE openId = 'test-creator-almostlegit' LIMIT 1");
  const [[viewer]] = await connection.query("SELECT id FROM users WHERE openId = 'test-viewer-almostlegit' LIMIT 1");
  if (!creator?.id || !viewer?.id) throw new Error("Test users could not be created.");

  await connection.execute(
    "INSERT INTO streamer_profiles (ownerUserId, slug, displayName, bio, approvalStatus, gamerTags, streamLinks, verifiedAt, verifiedByUserId) VALUES (?, 'test-creator', 'Test Creator', 'A non-production creator fixture for end-to-end testing.', 'approved', ?, ?, CURRENT_TIMESTAMP, ?) ON DUPLICATE KEY UPDATE displayName = VALUES(displayName), bio = VALUES(bio), approvalStatus = 'approved', gamerTags = VALUES(gamerTags), streamLinks = VALUES(streamLinks), verifiedAt = CURRENT_TIMESTAMP, verifiedByUserId = VALUES(verifiedByUserId)",
    [creator.id, JSON.stringify([{ platform: "xbox", handle: "TestCreatorXbox" }, { platform: "playstation", handle: "TestCreatorPS" }]), JSON.stringify([{ platform: "Twitch", url: "https://twitch.tv/test-creator" }]), creator.id],
  );

  const [[profile]] = await connection.query("SELECT id FROM streamer_profiles WHERE slug = 'test-creator' LIMIT 1");
  if (!profile?.id) throw new Error("Test creator profile could not be created.");

  const games = [
    ["Test Story Run", "xbox", "Story-driven fixture", "Test-only catalog title."],
    ["Test PlayStation Run", "playstation", "Action adventure fixture", "Test-only catalog title."],
  ];
  const gameIds = [];
  for (const game of games) {
    const [[existingGame]] = await connection.query("SELECT id FROM catalog_games WHERE title = ? AND platform = ? LIMIT 1", [game[0], game[1]]);
    const gameId = existingGame?.id ?? (await connection.execute("INSERT INTO catalog_games (title, platform, genre, note) VALUES (?, ?, ?, ?)", game))[0].insertId;
    gameIds.push(gameId);
    const [[existingEntry]] = await connection.query("SELECT id FROM streamer_catalog WHERE streamerProfileId = ? AND gameId = ? LIMIT 1", [profile.id, gameId]);
    if (!existingEntry?.id) await connection.execute("INSERT INTO streamer_catalog (streamerProfileId, gameId, ownershipStatus, isVisible) VALUES (?, ?, 'unconfirmed', TRUE)", [profile.id, gameId]);
    else await connection.execute("UPDATE streamer_catalog SET isVisible = TRUE WHERE id = ?", [existingEntry.id]);
  }

  await connection.execute("INSERT INTO booking_requests (streamerProfileId, gameId, viewerUserId, viewerHandle, viewerPlatform, status, publicNote) SELECT ?, ?, ?, '@testviewer', 'Twitch', 'requested', 'Test-only booking request.' WHERE NOT EXISTS (SELECT 1 FROM booking_requests WHERE streamerProfileId = ? AND gameId = ? AND viewerUserId = ? AND status IN ('requested','reviewing','owned','support_pending','scheduled'))", [profile.id, gameIds[0], viewer.id, profile.id, gameIds[0], viewer.id]);
  await connection.execute("INSERT INTO game_suggestions (streamerProfileId, submittedByUserId, title, platform, note, status) SELECT ?, ?, 'Test Suggested Game', 'xbox', 'Test-only game suggestion.', 'pending' WHERE NOT EXISTS (SELECT 1 FROM game_suggestions WHERE streamerProfileId = ? AND submittedByUserId = ? AND title = 'Test Suggested Game' AND status IN ('pending','reviewed','accepted'))", [profile.id, viewer.id, profile.id, viewer.id]);

  console.log(JSON.stringify({ ok: true, users: users.map(({ openId, role }) => ({ openId, role })), profileSlug: "test-creator", gameCount: gameIds.length }, null, 2));
} finally {
  await close();
}

export {};
