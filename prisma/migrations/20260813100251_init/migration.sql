-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'COACH', 'STUDENT', 'PARENT');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "StudentStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER');

-- CreateEnum
CREATE TYPE "SkillLevel" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'PROFESSIONAL');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT', 'ABSENT', 'LEAVE');

-- CreateEnum
CREATE TYPE "FeeStatus" AS ENUM ('PAID', 'PARTIAL', 'PENDING');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'BANK_TRANSFER', 'JAZZCASH', 'EASYPAISA', 'CARD', 'OTHER');

-- CreateEnum
CREATE TYPE "MatchResult" AS ENUM ('WON', 'LOST', 'DRAW', 'TIE');

-- CreateEnum
CREATE TYPE "ExpenseCategory" AS ENUM ('EQUIPMENT', 'GROUND', 'TRANSPORT', 'UTILITIES', 'SALARIES', 'MAINTENANCE', 'EVENTS', 'OTHER');

-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('LOGIN', 'LOGOUT', 'PASSWORD_RESET', 'STUDENT_CREATED', 'STUDENT_UPDATED', 'STUDENT_DEACTIVATED', 'STUDENT_ACTIVATED', 'STUDENT_DELETED', 'ATTENDANCE_MARKED', 'FEE_RECORDED', 'FEE_UPDATED', 'RECEIPT_GENERATED', 'PERFORMANCE_ADDED', 'PERFORMANCE_UPDATED', 'MATCH_ADDED', 'MATCH_UPDATED', 'EXPENSE_ADDED', 'EXPENSE_UPDATED', 'EXPENSE_DELETED', 'COACH_ADDED', 'COACH_UPDATED', 'COACH_DEACTIVATED', 'ANNOUNCEMENT_CREATED', 'SETTINGS_UPDATED', 'BACKUP_EXPORTED', 'BACKUP_RESTORED', 'NOTIFICATION_SENT', 'OTHER');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "mobile" TEXT,
    "role" "Role" NOT NULL DEFAULT 'STUDENT',
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "photoUrl" TEXT,
    "studentId" TEXT,
    "sessionVersion" INTEGER NOT NULL DEFAULT 0,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Batch" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "coachId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Batch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Student" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "guardianName" TEXT NOT NULL,
    "mobile" TEXT NOT NULL,
    "whatsapp" TEXT,
    "dob" DATE NOT NULL,
    "gender" "Gender" NOT NULL,
    "address" TEXT,
    "joinDate" DATE NOT NULL,
    "batchId" TEXT,
    "skillLevel" "SkillLevel" NOT NULL DEFAULT 'BEGINNER',
    "monthlyFee" INTEGER NOT NULL DEFAULT 0,
    "emergencyContact" TEXT,
    "bloodGroup" TEXT,
    "photoUrl" TEXT,
    "status" "StudentStatus" NOT NULL DEFAULT 'ACTIVE',
    "coachId" TEXT,
    "qrToken" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "Student_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoachProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "specialization" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CoachProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentParent" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "parentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudentParent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attendance" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "status" "AttendanceStatus" NOT NULL,
    "markedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Attendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Fee" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "monthlyFee" INTEGER NOT NULL,
    "discount" INTEGER NOT NULL DEFAULT 0,
    "paidAmount" INTEGER NOT NULL DEFAULT 0,
    "balance" INTEGER NOT NULL,
    "dueDate" DATE NOT NULL,
    "paymentDate" DATE,
    "paymentMethod" "PaymentMethod",
    "receiptNumber" TEXT,
    "status" "FeeStatus" NOT NULL DEFAULT 'PENDING',
    "remarks" TEXT,
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Fee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Performance" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "date" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "battingRating" INTEGER NOT NULL,
    "bowlingRating" INTEGER NOT NULL,
    "fieldingRating" INTEGER NOT NULL,
    "fitnessRating" INTEGER NOT NULL,
    "disciplineRating" INTEGER NOT NULL,
    "overallRating" DOUBLE PRECISION NOT NULL,
    "remarks" TEXT,
    "coachId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Performance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Match" (
    "id" TEXT NOT NULL,
    "matchDate" DATE NOT NULL,
    "opponent" TEXT NOT NULL,
    "venue" TEXT,
    "result" "MatchResult",
    "coachId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "Match_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MatchRecord" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "runs" INTEGER NOT NULL DEFAULT 0,
    "ballsFaced" INTEGER,
    "wickets" INTEGER NOT NULL DEFAULT 0,
    "catches" INTEGER NOT NULL DEFAULT 0,
    "strikeRate" DOUBLE PRECISION,
    "economy" DOUBLE PRECISION,
    "manOfTheMatch" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MatchRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Expense" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" "ExpenseCategory" NOT NULL,
    "amount" INTEGER NOT NULL,
    "date" DATE NOT NULL,
    "notes" TEXT,
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Activity" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "ActivityType" NOT NULL,
    "action" TEXT NOT NULL,
    "entity" TEXT,
    "entityId" TEXT,
    "details" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "role" "Role",
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'info',
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Announcement" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "audience" TEXT NOT NULL DEFAULT 'ALL',
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Announcement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Setting" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedBy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Setting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PushSubscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "keys" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PushSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_status_idx" ON "User"("role", "status");

-- CreateIndex
CREATE INDEX "User_studentId_idx" ON "User"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "Batch_name_key" ON "Batch"("name");

-- CreateIndex
CREATE INDEX "Batch_coachId_idx" ON "Batch"("coachId");

-- CreateIndex
CREATE UNIQUE INDEX "Student_studentId_key" ON "Student"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "Student_qrToken_key" ON "Student"("qrToken");

-- CreateIndex
CREATE INDEX "Student_batchId_status_idx" ON "Student"("batchId", "status");

-- CreateIndex
CREATE INDEX "Student_coachId_idx" ON "Student"("coachId");

-- CreateIndex
CREATE INDEX "Student_fullName_idx" ON "Student"("fullName");

-- CreateIndex
CREATE INDEX "Student_mobile_idx" ON "Student"("mobile");

-- CreateIndex
CREATE INDEX "Student_createdAt_idx" ON "Student"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "CoachProfile_userId_key" ON "CoachProfile"("userId");

-- CreateIndex
CREATE INDEX "StudentParent_parentId_idx" ON "StudentParent"("parentId");

-- CreateIndex
CREATE UNIQUE INDEX "StudentParent_studentId_parentId_key" ON "StudentParent"("studentId", "parentId");

-- CreateIndex
CREATE INDEX "Attendance_date_status_idx" ON "Attendance"("date", "status");

-- CreateIndex
CREATE INDEX "Attendance_studentId_date_idx" ON "Attendance"("studentId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "Attendance_studentId_date_key" ON "Attendance"("studentId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "Fee_receiptNumber_key" ON "Fee"("receiptNumber");

-- CreateIndex
CREATE INDEX "Fee_month_status_idx" ON "Fee"("month", "status");

-- CreateIndex
CREATE INDEX "Fee_dueDate_idx" ON "Fee"("dueDate");

-- CreateIndex
CREATE INDEX "Fee_status_idx" ON "Fee"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Fee_studentId_month_key" ON "Fee"("studentId", "month");

-- CreateIndex
CREATE INDEX "Performance_studentId_date_idx" ON "Performance"("studentId", "date");

-- CreateIndex
CREATE INDEX "Match_matchDate_idx" ON "Match"("matchDate");

-- CreateIndex
CREATE INDEX "MatchRecord_studentId_idx" ON "MatchRecord"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "MatchRecord_matchId_studentId_key" ON "MatchRecord"("matchId", "studentId");

-- CreateIndex
CREATE INDEX "Expense_date_category_idx" ON "Expense"("date", "category");

-- CreateIndex
CREATE INDEX "Expense_category_idx" ON "Expense"("category");

-- CreateIndex
CREATE INDEX "Activity_createdAt_idx" ON "Activity"("createdAt");

-- CreateIndex
CREATE INDEX "Activity_userId_idx" ON "Activity"("userId");

-- CreateIndex
CREATE INDEX "Notification_userId_read_idx" ON "Notification"("userId", "read");

-- CreateIndex
CREATE INDEX "Notification_role_idx" ON "Notification"("role");

-- CreateIndex
CREATE INDEX "Announcement_createdAt_idx" ON "Announcement"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_tokenHash_key" ON "PasswordResetToken"("tokenHash");

-- CreateIndex
CREATE INDEX "PasswordResetToken_userId_idx" ON "PasswordResetToken"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Setting_key_key" ON "Setting"("key");

-- CreateIndex
CREATE UNIQUE INDEX "PushSubscription_endpoint_key" ON "PushSubscription"("endpoint");

-- CreateIndex
CREATE INDEX "PushSubscription_userId_idx" ON "PushSubscription"("userId");

-- AddForeignKey
ALTER TABLE "Batch" ADD CONSTRAINT "Batch_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoachProfile" ADD CONSTRAINT "CoachProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentParent" ADD CONSTRAINT "StudentParent_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentParent" ADD CONSTRAINT "StudentParent_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Fee" ADD CONSTRAINT "Fee_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Performance" ADD CONSTRAINT "Performance_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Performance" ADD CONSTRAINT "Performance_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchRecord" ADD CONSTRAINT "MatchRecord_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchRecord" ADD CONSTRAINT "MatchRecord_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PushSubscription" ADD CONSTRAINT "PushSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
