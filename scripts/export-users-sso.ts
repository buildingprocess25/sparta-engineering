import * as fs from "fs"
import { getPrisma } from "../lib/prisma"
import path from "path"

async function main() {
  const prisma = getPrisma()
  console.log("Mengambil data user dari database...")
  
  const users = await prisma.user.findMany()
  console.log(`Ditemukan ${users.length} user.`)

  // Header sesuai kontrak SSO
  // email,fullName,employeeId,branchCode,branchName,moduleId,moduleRole,isActive
  const lines = ["email,fullName,employeeId,branchCode,branchName,moduleId,moduleRole,isActive"]

  for (const user of users) {
    // Escape koma pada nama
    const fullName = `"${(user.name || "").replace(/"/g, '""')}"`
    // Jika branchCode tidak ada di DB kita, pakai singkatan branchName sementara (kalau ada)
    const branchNameStr = user.branchName || ""
    const branchCode = branchNameStr.substring(0, 3).toUpperCase() || "UNK"
    
    // Format: email, fullName, NIK, branchCode, branchName, "engineering", role, true
    lines.push(`${user.email},${fullName},${user.NIK || ""},${branchCode},${branchNameStr},engineering,${user.role},true`)
  }

  const csvContent = lines.join("\n")
  const outPath = path.join(process.cwd(), "engineering-users-sso.csv")
  
  fs.writeFileSync(outPath, csvContent, "utf-8")
  console.log(`\nBerhasil mengekspor ke: ${outPath}`)
  console.log(`Silakan salin/import file ini ke database login-sparta.`)
}

main().catch(console.error).finally(() => process.exit(0))
