import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import bcrypt from "bcryptjs";
import { format } from "date-fns";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is not set. Copy .env.example to .env and fill it in.");
  process.exit(1);
}

const adapter = new PrismaPg({ connectionString });
const db = new PrismaClient({ adapter });

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? "admin@yfa.pk";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "admin12345";
const COACH_PASSWORD = process.env.SEED_COACH_PASSWORD ?? "coach12345";

function monthKey(offsetMonths: number): string {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() + offsetMonths);
  return format(d, "yyyy-MM");
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

async function main() {
  console.log("Seeding Young Fighters Academy…");

  // Wipe in dependency order.
  await db.announcement.deleteMany();
  await db.activity.deleteMany();
  await db.notification.deleteMany();
  await db.matchRecord.deleteMany();
  await db.match.deleteMany();
  await db.performance.deleteMany();
  await db.fee.deleteMany();
  await db.attendance.deleteMany();
  await db.studentParent.deleteMany();
  await db.student.deleteMany();
  await db.batch.deleteMany();
  await db.coachProfile.deleteMany();
  await db.passwordResetToken.deleteMany();
  await db.pushSubscription.deleteMany();
  await db.setting.deleteMany();
  await db.user.deleteMany();

  const admin = await db.user.create({
    data: {
      email: ADMIN_EMAIL,
      fullName: "Academy Admin",
      mobile: "+92 300 0000000",
      role: "ADMIN",
      status: "ACTIVE",
      passwordHash: await bcrypt.hash(ADMIN_PASSWORD, 10),
    },
  });

  const coach1 = await db.user.create({
    data: {
      email: "coach.ahmed@yfa.pk",
      fullName: "Coach Ahmed Raza",
      mobile: "+92 301 1111111",
      role: "COACH",
      passwordHash: await bcrypt.hash(COACH_PASSWORD, 10),
      coachProfile: { create: { specialization: "Fast bowling & fielding" } },
    },
  });

  const coach2 = await db.user.create({
    data: {
      email: "coach.bilal@yfa.pk",
      fullName: "Coach Bilal Khan",
      mobile: "+92 302 2222222",
      role: "COACH",
      passwordHash: await bcrypt.hash(COACH_PASSWORD, 10),
      coachProfile: { create: { specialization: "Batting & spin" } },
    },
  });

  const batchMorning = await db.batch.create({
    data: {
      name: "Morning Batch",
      description: "6:00 – 8:00 AM",
      coachId: coach1.id,
    },
  });
  const batchEvening = await db.batch.create({
    data: {
      name: "Evening Batch",
      description: "4:00 – 6:00 PM",
      coachId: coach2.id,
    },
  });

  const studentSeeds: {
    fullName: string;
    guardianName: string;
    skill: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "PROFESSIONAL";
    fee: number;
    batch: string;
    coachId: string;
    gender: "MALE" | "FEMALE" | "OTHER";
  }[] = [
    { fullName: "Ali Hassan", guardianName: "Rana Hassan", skill: "ADVANCED", fee: 8000, batch: batchMorning.id, coachId: coach1.id, gender: "MALE" },
    { fullName: "Usman Tariq", guardianName: "Tariq Mehmood", skill: "INTERMEDIATE", fee: 8000, batch: batchMorning.id, coachId: coach1.id, gender: "MALE" },
    { fullName: "Hamza Sheikh", guardianName: "Sheikh Naveed", skill: "BEGINNER", fee: 6000, batch: batchEvening.id, coachId: coach2.id, gender: "MALE" },
    { fullName: "Bilal Anwar", guardianName: "Anwar Saeed", skill: "PROFESSIONAL", fee: 12000, batch: batchEvening.id, coachId: coach2.id, gender: "MALE" },
    { fullName: "Fatima Noor", guardianName: "Noor Ahmed", skill: "INTERMEDIATE", fee: 8000, batch: batchEvening.id, coachId: coach2.id, gender: "FEMALE" },
    { fullName: "Zain Abbas", guardianName: "Abbas Ali", skill: "BEGINNER", fee: 6000, batch: batchMorning.id, coachId: coach1.id, gender: "MALE" },
  ];

  const students: { id: string; monthlyFee: number; fullName: string }[] = [];
  for (let i = 0; i < studentSeeds.length; i++) {
    const s = studentSeeds[i];
    const student = await db.student.create({
      data: {
        studentId: `YFA-00${i + 1}`,
        fullName: s.fullName,
        guardianName: s.guardianName,
        mobile: `+92 31${i} ${String(1000000 + i * 111111).slice(0, 7)}`,
        whatsapp: `+92 31${i} ${String(1000000 + i * 111111).slice(0, 7)}`,
        dob: daysAgo(365 * (9 + i)),
        gender: s.gender,
        joinDate: daysAgo(30 * (i + 2)),
        batchId: s.batch,
        skillLevel: s.skill,
        monthlyFee: s.fee,
        status: "ACTIVE",
        coachId: s.coachId,
        qrToken: `seed-token-${i + 1}-${Math.random().toString(36).slice(2, 10)}`,
        bloodGroup: ["A+", "B+", "O+"][i % 3],
        emergencyContact: `+92 31${i} 9999999`,
        createdBy: admin.id,
      },
    });
    students.push(student);
  }

  // Parent accounts linked to the first two students.
  const parent = await db.user.create({
    data: {
      email: "parent.ali@yfa.pk",
      fullName: "Rana Hassan (Ali's father)",
      mobile: "+92 311 3333333",
      role: "PARENT",
      passwordHash: await bcrypt.hash("parent12345", 10),
    },
  });
  await db.studentParent.createMany({
    data: [{ studentId: students[0].id, parentId: parent.id }],
  });

  // A student login for the first student.
  await db.user.create({
    data: {
      email: "ali.hassan@yfa.pk",
      fullName: "Ali Hassan",
      mobile: "+92 311 0000001",
      role: "STUDENT",
      studentId: students[0].id,
      passwordHash: await bcrypt.hash("student12345", 10),
    },
  });

  // Attendance for the last 60 days (approx 80% presence).
  for (let d = 60; d >= 0; d--) {
    const date = daysAgo(d);
    if ([0, 6].includes(date.getDay())) continue; // skip weekends
    await db.attendance.createMany({
      data: students.map((s, i) => ({
        studentId: s.id,
        date,
        status: (i + d) % 5 === 0 ? "ABSENT" : (i + d) % 11 === 0 ? "LEAVE" : "PRESENT",
        markedBy: coach1.id,
      })),
    });
  }

  // Fees for the current month + previous 2 months; first student fully paid.
  const feeMonths = [monthKey(-2), monthKey(-1), monthKey(0)];
  for (const s of students) {
    for (const month of feeMonths) {
      const paid = s.monthlyFee;
      const paidStatus = s.fullName === "Ali Hassan" || s.fullName === "Usman Tariq"
        ? ("PAID" as const)
        : month === monthKey(0)
          ? ("PENDING" as const)
          : ("PAID" as const);
      await db.fee.create({
        data: {
          studentId: s.id,
          month,
          monthlyFee: s.monthlyFee,
          discount: 0,
          paidAmount: paidStatus === "PAID" ? paid : 0,
          balance: paidStatus === "PAID" ? 0 : paid,
          dueDate: new Date(`${month}-10`),
          paymentDate: paidStatus === "PAID" ? daysAgo(5) : null,
          paymentMethod: paidStatus === "PAID" ? "CASH" : null,
          receiptNumber: paidStatus === "PAID" ? `RCP-${month}-${s.fullName.slice(0, 4)}` : null,
          status: paidStatus,
          createdBy: admin.id,
        },
      });
    }
  }

  // Performances.
  for (const s of students) {
    for (let p = 0; p < 4; p++) {
      const batting = 4 + ((s.id.charCodeAt(0) + p) % 5);
      const bowling = 3 + ((s.id.charCodeAt(1) + p) % 6);
      const fielding = 5 + ((s.id.charCodeAt(2) + p) % 4);
      const fitness = 4 + ((s.id.charCodeAt(3) + p) % 5);
      const discipline = 6 + ((s.id.charCodeAt(4) + p) % 3);
      await db.performance.create({
        data: {
          studentId: s.id,
          date: daysAgo(14 * p + 3),
          battingRating: batting,
          bowlingRating: bowling,
          fieldingRating: fielding,
          fitnessRating: fitness,
          disciplineRating: discipline,
          overallRating: (batting + bowling + fielding + fitness + discipline) / 5,
          remarks: p % 2 === 0 ? "Good progress, focus on footwork." : "Needs work on line and length.",
          coachId: coach1.id,
        },
      });
    }
  }

  // Matches with scorecards.
  const matchData = [
    { opponent: "Lahore Colts", venue: "YFA Ground", result: "WON", daysBack: 21 },
    { opponent: "Rawalpindi Hawks", venue: "Pindi Stadium", result: "LOST", daysBack: 10 },
    { opponent: "Islamabad Royals", venue: "YFA Ground", result: null, daysBack: -7 },
  ] as const;

  for (const m of matchData) {
    const match = await db.match.create({
      data: {
        matchDate: daysAgo(m.daysBack),
        opponent: m.opponent,
        venue: m.venue,
        result: m.result,
        coachId: coach1.id,
        createdBy: admin.id,
      },
    });
    for (const [i, s] of students.entries()) {
      await db.matchRecord.create({
        data: {
          matchId: match.id,
          studentId: s.id,
          runs: (i * 13 + 20) % 90,
          ballsFaced: 20 + ((i * 7) % 40),
          wickets: i % 3 === 0 ? 2 : i % 4 === 0 ? 1 : 0,
          catches: i % 2,
          manOfTheMatch: i === 0 && m.result === "WON",
        },
      });
    }
  }

  // Expenses.
  const expenseSeeds = [
    { title: "Cricket balls (6-pack)", category: "EQUIPMENT", amount: 12000, days: 2 },
    { title: "Ground maintenance", category: "GROUND", amount: 25000, days: 8 },
    { title: "Team transport — Pindi match", category: "TRANSPORT", amount: 15000, days: 11 },
    { title: "Electricity bill", category: "UTILITIES", amount: 18000, days: 15 },
    { title: "Coach stipend — July", category: "SALARIES", amount: 60000, days: 20 },
    { title: "Net repair", category: "MAINTENANCE", amount: 9000, days: 26 },
    { title: "Inter-school tournament entry", category: "EVENTS", amount: 20000, days: 33 },
  ] as const;

  for (const e of expenseSeeds) {
    await db.expense.create({
      data: { title: e.title, category: e.category, amount: e.amount, date: daysAgo(e.days), createdBy: admin.id },
    });
  }

  // Settings + announcement.
  await db.setting.createMany({
    data: [
      { key: "academyName", value: "Young Fighters Academy" },
      { key: "academyPhone", value: "+92 300 1234567" },
      { key: "academyEmail", value: "info@yfa.pk" },
      { key: "academyAddress", value: "Cricket Ground, Lahore, Pakistan" },
      { key: "receiptFooter", value: "Thank you for your support! Keep fighting." },
    ],
  });

  await db.announcement.create({
    data: {
      title: "Welcome to Young Fighters Academy!",
      body: "Season training is underway. Weekly matches every Friday at 5 PM.",
      createdBy: admin.id,
    },
  });

  console.log("Seeding complete!");
  console.log("");
  console.log("Login credentials:");
  console.log(`  Admin  → ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
  console.log(`  Coach  → coach.ahmed@yfa.pk / ${COACH_PASSWORD}`);
  console.log("  Parent → parent.ali@yfa.pk / parent12345");
  console.log("  Student→ ali.hassan@yfa.pk / student12345");
  console.log("");
  console.log("Set SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD in .env to override the admin credentials.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
