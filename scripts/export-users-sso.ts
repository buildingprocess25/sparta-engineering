import pg from 'pg';
import { getPrisma } from "../lib/prisma"
import * as dotenv from 'dotenv';
dotenv.config();

const { Client } = pg;

async function main() {
  const prisma = getPrisma()
  console.log("Mengambil data user dari database sparta-engineering...")
  const users = await prisma.user.findMany()
  console.log(`Ditemukan ${users.length} user.`)

  const loginDbUrl = process.env.LOGIN_DATABASE_URL;
  if (!loginDbUrl) {
    throw new Error("LOGIN_DATABASE_URL is not set in .env");
  }

  const client = new Client({ connectionString: loginDbUrl });
  await client.connect();
  console.log("Terhubung ke database login-sparta.");

  // Tambahkan ENGINEERING ke enum SpartaModuleId jika belum ada
  try {
    await client.query(`ALTER TYPE "SpartaModuleId" ADD VALUE IF NOT EXISTS 'ENGINEERING'`);
  } catch (e: any) {
    console.log("Note on ALTER TYPE:", e.message);
  }

  // Daftarkan AppModule ENGINEERING jika belum ada
  const appBaseUrl = process.env.APP_BASE_URL || "http://localhost:3000";
  await client.query(`
    INSERT INTO "AppModule" (id, name, "shortName", description, "callbackUrl", "colorHex", "isActive", "sortOrder", "createdAt", "updatedAt")
    VALUES ('ENGINEERING', 'SPARTA Engineering', 'Engineering', 'Pusat Pelaporan Pekerjaan Engineering', $1, '#0072bc', true, 3, NOW(), NOW())
    ON CONFLICT (id) DO UPDATE SET "callbackUrl" = EXCLUDED."callbackUrl"
  `, [`${appBaseUrl}/auth/sso/callback`]);

  let newUsersCount = 0;
  let newAccessCount = 0;

  for (const user of users) {
    if (!user.email) continue;

    const fullName = user.name || "";
    const branchNameStr = user.branchName || "";
    const branchCode = branchNameStr.substring(0, 3).toUpperCase() || "UNK";
    
    // 1. Pastikan Branch ada
    let targetBranchId = null;
    const existingBranch = await client.query(`SELECT id FROM "Branch" WHERE code = $1`, [branchCode]);
    if (existingBranch.rows.length > 0) {
      targetBranchId = existingBranch.rows[0].id;
    } else {
      const newBranchId = 'br_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 7);
      await client.query(`
        INSERT INTO "Branch" (id, code, name, "createdAt", "updatedAt")
        VALUES ($1, $2, $3, NOW(), NOW())
      `, [newBranchId, branchCode, branchNameStr || branchCode]);
      targetBranchId = newBranchId;
    }
    
    // 2. Cari atau buat User di login-sparta
    let targetUserId = null;
    const existingUser = await client.query(`SELECT id FROM "User" WHERE email = $1`, [user.email]);
    
    if (existingUser.rows.length > 0) {
      targetUserId = existingUser.rows[0].id;
    } else {
      const newId = 'usr_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 7);
      
      const insertUserQuery = `
        INSERT INTO "User" (id, email, "fullName", "employeeId", "branchId", "passwordHash", role, status, "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4, $5, $6, 'USER', 'ACTIVE', NOW(), NOW())
        RETURNING id
      `;
      const res = await client.query(insertUserQuery, [
        newId, 
        user.email, 
        fullName, 
        user.NIK || "", 
        targetBranchId, 
        user.passwordHash || ""
      ]);
      targetUserId = res.rows[0].id;
      newUsersCount++;
    }

    // 2. Berikan akses modul ENGINEERING
    if (targetUserId) {
      const existingAccess = await client.query(
        `SELECT id FROM "UserModuleAccess" WHERE "userId" = $1 AND "moduleId" = 'ENGINEERING'`,
        [targetUserId]
      );
      
      if (existingAccess.rows.length === 0) {
        const accessId = 'acc_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 7);
        const insertAccessQuery = `
          INSERT INTO "UserModuleAccess" (id, "userId", "moduleId", role, "isActive", "grantedAt")
          VALUES ($1, $2, 'ENGINEERING', $3, true, NOW())
        `;
        await client.query(insertAccessQuery, [
          accessId,
          targetUserId,
          user.role || 'USER'
        ]);
        newAccessCount++;
      }
    }
  }

  await client.end();
  
  console.log(`\nSinkronisasi selesai!`);
  console.log(`- ${newUsersCount} user baru ditambahkan ke login-sparta.`);
  console.log(`- ${newAccessCount} akses modul ENGINEERING baru diberikan.`);
}

main().catch(console.error).finally(() => process.exit(0))
