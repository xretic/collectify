#!/usr/bin/env node
// Grants or revokes the Admin role. Replaces the old ASSIGN_SECRET HTTP endpoint:
// admin rights can only be changed by someone with database access.
//
//   npm run admin -- grant <userId|username>
//   npm run admin -- revoke <userId|username>
//   npm run admin -- list

import 'dotenv/config';
import pg from 'pg';

const [command, target] = process.argv.slice(2);

if (!['grant', 'revoke', 'list'].includes(command) || (command !== 'list' && !target)) {
    console.error('Usage: npm run admin -- <grant|revoke> <userId|username> | list');
    process.exit(1);
}

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

try {
    if (command === 'list') {
        const { rows } = await client.query(
            `SELECT u.id, u.username, to_char(a."createdAt", 'YYYY-MM-DD HH24:MI') || ' UTC' AS "grantedAt"
             FROM "Admin" a JOIN "User" u ON u.id = a."userId"
             ORDER BY a."createdAt"`,
        );
        console.table(rows);
        process.exit(0);
    }

    const byId = /^\d+$/.test(target);
    const { rows } = await client.query(
        `SELECT id, username FROM "User" WHERE ${byId ? 'id = $1' : 'username = lower($1)'}`,
        [byId ? Number(target) : target],
    );

    const user = rows[0];
    if (!user) {
        console.error(`User "${target}" not found.`);
        process.exit(1);
    }

    if (command === 'grant') {
        await client.query(
            'INSERT INTO "Admin" ("userId") VALUES ($1) ON CONFLICT ("userId") DO NOTHING',
            [user.id],
        );
        console.log(`@${user.username} (#${user.id}) is now an admin.`);
    } else {
        const { rows: admins } = await client.query('SELECT COUNT(*)::int AS count FROM "Admin"');
        if (admins[0].count <= 1) {
            console.error('Refusing to revoke the last admin.');
            process.exit(1);
        }

        await client.query('DELETE FROM "Admin" WHERE "userId" = $1', [user.id]);
        console.log(`@${user.username} (#${user.id}) is no longer an admin.`);
    }
} finally {
    await client.end();
}
