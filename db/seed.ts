import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import {
  users,
  departments,
  folders,
  departmentPermissions,
  folderPermissions,
} from "./schema";

// Load environment variables BEFORE importing any module that reads
// process.env at import time (like ./index, which opens the MySQL pool).
// Static `import` statements are hoisted above other top-level code by the
// ES module loader, so ./index is imported dynamically inside main()
// below, after this has had a chance to run.
try {
  process.loadEnvFile(".env");
} catch {
  // .env not present - rely on already-set environment variables
}

const BCRYPT_ROUNDS = 12;

const DEPARTMENTS: {
  name: string;
  description: string;
  color: string;
  icon: string;
  folders: string[];
}[] = [
  {
    name: "HR",
    description: "Human resources policies, employee records, and administrative documents.",
    color: "#2f6b5f",
    icon: "Users",
    folders: ["Policies & Procedures", "Employee Handbook", "Recruitment", "Leave & Attendance"],
  },
  {
    name: "Quality",
    description: "Standard operating procedures, audits, and accreditation records.",
    color: "#dd7a2e",
    icon: "ShieldCheck",
    folders: ["SOPs", "Audit Reports", "Accreditation (NABH / JCI)", "Incident Reports"],
  },
  {
    name: "Library",
    description: "Reference books, journals, research papers, and clinical guidelines.",
    color: "#1f5247",
    icon: "BookOpen",
    folders: ["Books", "Journals & Publications", "Research Papers", "Clinical Guidelines"],
  },
  {
    name: "Training",
    description: "Induction material and ongoing staff training resources.",
    color: "#9c4a18",
    icon: "GraduationCap",
    folders: [
      "Induction & Orientation",
      "Nursing Training",
      "Clinical Skills",
      "Biomedical & Equipment",
      "Fire & Safety",
    ],
  },
];

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

async function main() {
  const { db } = await import("./index");
  const { insertReturning } = await import("./helpers");
  console.log("Seeding DDMS database...\n");

  const adminEmail = process.env.SEED_ADMIN_EMAIL || "admin@amarahospital.org";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || "ChangeMe@123";
  const adminName = process.env.SEED_ADMIN_NAME || "System Administrator";

  const [existingAdmin] = await db.select().from(users).where(eq(users.email, adminEmail)).limit(1);

  let adminId: string;
  if (existingAdmin) {
    adminId = existingAdmin.id;
    console.log(`Super Admin already exists: ${adminEmail}`);
  } else {
    const passwordHash = await bcrypt.hash(adminPassword, BCRYPT_ROUNDS);
    const admin = await insertReturning(users, {
      name: adminName,
      email: adminEmail,
      passwordHash,
      role: "SUPER_ADMIN",
      mustChangePassword: false,
    });
    adminId = admin.id;
    console.log(`Created Super Admin: ${adminEmail} / ${adminPassword}`);
  }

  const deptIdByName = new Map<string, string>();
  const firstFolderIdByDept = new Map<string, string>();

  for (const dept of DEPARTMENTS) {
    const slug = slugify(dept.name);
    const [existingDept] = await db.select().from(departments).where(eq(departments.slug, slug)).limit(1);

    let deptId: string;
    if (existingDept) {
      deptId = existingDept.id;
      console.log(`Department already exists: ${dept.name}`);
    } else {
      const created = await insertReturning(departments, {
        name: dept.name,
        slug,
        description: dept.description,
        color: dept.color,
        icon: dept.icon,
        sortOrder: DEPARTMENTS.indexOf(dept),
        createdById: adminId,
      });
      deptId = created.id;
      console.log(`Created department: ${dept.name}`);
    }
    deptIdByName.set(dept.name, deptId);

    for (const [index, folderName] of dept.folders.entries()) {
      const [existingFolder] = await db
        .select()
        .from(folders)
        .where(eq(folders.departmentId, deptId))
        .then((rows) => rows.filter((r) => r.name === folderName));

      let folderId: string;
      if (existingFolder) {
        folderId = existingFolder.id;
      } else {
        const created = await insertReturning(folders, {
          name: folderName,
          departmentId: deptId,
          parentId: null,
          sortOrder: index,
          createdById: adminId,
        });
        folderId = created.id;
      }
      if (!firstFolderIdByDept.has(dept.name)) firstFolderIdByDept.set(dept.name, folderId);
    }
  }

  const demoEmail = "staff@amarahospital.org";
  const demoPassword = "Staff@1234";
  const [existingDemo] = await db.select().from(users).where(eq(users.email, demoEmail)).limit(1);

  let demoId: string;
  if (existingDemo) {
    demoId = existingDemo.id;
    console.log(`Demo user already exists: ${demoEmail}`);
  } else {
    const passwordHash = await bcrypt.hash(demoPassword, BCRYPT_ROUNDS);
    const demo = await insertReturning(users, {
      name: "Asha Rao",
      email: demoEmail,
      passwordHash,
      role: "USER",
      mustChangePassword: false,
      createdById: adminId,
    });
    demoId = demo.id;
    console.log(`Created demo user: ${demoEmail} / ${demoPassword}`);

    const libraryId = deptIdByName.get("Library");
    const trainingId = deptIdByName.get("Training");

    if (libraryId) {
      await db.insert(departmentPermissions).values({
        userId: demoId,
        departmentId: libraryId,
        canView: true,
        canUpload: false,
        canEdit: false,
        canDelete: false,
        canDownload: true,
      });
    }

    if (trainingId) {
      await db.insert(departmentPermissions).values({
        userId: demoId,
        departmentId: trainingId,
        canView: true,
        canUpload: false,
        canEdit: false,
        canDelete: false,
        canDownload: true,
      });
      const trainingFirstFolder = firstFolderIdByDept.get("Training");
      if (trainingFirstFolder) {
        await db.insert(folderPermissions).values({
          userId: demoId,
          folderId: trainingFirstFolder,
          canView: true,
          canUpload: true,
          canEdit: true,
          canDelete: false,
          canDownload: true,
        });
      }
    }
    console.log("Granted demo user: view+download on Library, plus upload+edit on Training > Induction & Orientation.");
  }

  console.log("\nSeed complete.");
  console.log("──────────────────────────────────────────────");
  console.log(`Super Admin   ${adminEmail} / ${adminPassword}`);
  console.log(`Demo User     ${demoEmail} / ${demoPassword}`);
  console.log("──────────────────────────────────────────────");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
