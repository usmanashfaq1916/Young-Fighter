import { z } from "zod";
import {
  ADMISSION_STATUSES,
  ATTENDANCE_STATUSES,
  BILLING_TYPES,
  DISMISSALS,
  EXPENSE_CATEGORIES,
  GENDERS,
  GOAL_CATEGORIES,
  GOAL_STATUSES,
  MATCH_RESULTS,
  MATCH_TYPES,
  PAYMENT_METHODS,
  SKILL_LEVELS,
  STUDENT_STATUSES,
  TRAINING_CATEGORIES,
} from "@/lib/constants";
import { normalizePhone } from "@/lib/utils";

const pkPhone = z
  .string()
  .transform((s) => s.replace(/[\s-]/g, ""))
  .pipe(
    z
      .string()
      .regex(/^(\+?92|0)?3\d{9}$/, { error: "Please enter a valid mobile number." })
      .transform(normalizePhone)
  );

const optionalPkPhone = pkPhone.optional().or(z.literal(""));

export const loginSchema = z.object({
  email: z.email({ error: "Please enter a valid email address." }),
  password: z.string().min(1, { error: "Password is required." }),
});

export const forgotPasswordSchema = z.object({
  email: z.email({ error: "Please enter a valid email address." }),
});

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, { error: "Password must be at least 8 characters." })
      .regex(/[a-zA-Z]/, { error: "Password must contain a letter." })
      .regex(/[0-9]/, { error: "Password must contain a number." }),
    confirm: z.string(),
  })
  .refine((data) => data.password === data.confirm, {
    message: "Passwords do not match.",
    path: ["confirm"],
  });

export const studentSchema = z.object({
  fullName: z
    .string()
    .min(2, { error: "Please enter the full name." })
    .max(100),
  guardianName: z
    .string()
    .min(2, { error: "Please enter the guardian name." })
    .max(100),
  mobile: pkPhone,
  whatsapp: optionalPkPhone,
  dob: z.coerce
    .date({ error: "Please select a valid date of birth." })
    .refine((d) => d < new Date(), { error: "Date of birth must be in the past." })
    .refine((d) => d > new Date("1950-01-01"), { error: "Please select a valid date of birth." }),
  gender: z.enum(GENDERS, { error: "Please select a gender." }),
  address: z.string().max(300).optional().or(z.literal("")),
  joinDate: z.coerce.date({ error: "Please select a valid join date." }),
  batchId: z.string().optional().or(z.literal("")),
  skillLevel: z.enum(SKILL_LEVELS, { error: "Please select a skill level." }),
  monthlyFee: z.coerce
    .number({ error: "Monthly fee must be a number." })
    .int()
    .min(0, { error: "Monthly fee cannot be negative." })
    .max(10_000_000),
  emergencyContact: optionalPkPhone,
  bloodGroup: z.string().optional().or(z.literal("")),
  email: z.email({ error: "Please enter a valid email address." }).optional().or(z.literal("")),
  playingRole: z.string().max(50).optional().or(z.literal("")),
  battingStyle: z.string().max(50).optional().or(z.literal("")),
  bowlingStyle: z.string().max(50).optional().or(z.literal("")),
  preferredPosition: z.string().max(50).optional().or(z.literal("")),
  jerseyNumber: z.coerce.number().int().min(0).max(999).optional(),
  status: z.enum(STUDENT_STATUSES, { error: "Please select a status." }),
});

export const attendanceSchema = z.object({
  date: z.coerce.date({ error: "Please select a valid date." }),
  batchId: z.string().optional().or(z.literal("")),
  entries: z.array(
    z.object({
      studentId: z.string().min(1),
      status: z.enum(ATTENDANCE_STATUSES),
    })
  ),
});

export const feeSchema = z.object({
  studentId: z.string().min(1, { error: "Please select a student." }),
  month: z.string().regex(/^\d{4}-\d{2}$/, { error: "Please select a valid month." }),
  monthlyFee: z.coerce.number().int().min(0, { error: "Monthly fee cannot be negative." }),
  discount: z.coerce.number().int().min(0, { error: "Discount cannot be negative." }),
  paidAmount: z.coerce.number().int().min(0, { error: "Paid amount cannot be negative." }),
  dueDate: z.coerce.date({ error: "Please select a valid due date." }),
  paymentDate: z.coerce.date().optional().nullable(),
  paymentMethod: z.enum(PAYMENT_METHODS).optional().nullable(),
  remarks: z.string().max(300).optional().or(z.literal("")),
});

export const performanceSchema = z
  .object({
    studentId: z.string().min(1),
    date: z.coerce.date(),
    battingRating: z.coerce
      .number()
      .int()
      .min(1, { error: "Rating must be between 1 and 10." })
      .max(10, { error: "Rating must be between 1 and 10." }),
    bowlingRating: z.coerce
      .number()
      .int()
      .min(1, { error: "Rating must be between 1 and 10." })
      .max(10, { error: "Rating must be between 1 and 10." }),
    fieldingRating: z.coerce
      .number()
      .int()
      .min(1, { error: "Rating must be between 1 and 10." })
      .max(10, { error: "Rating must be between 1 and 10." }),
    fitnessRating: z.coerce
      .number()
      .int()
      .min(1, { error: "Rating must be between 1 and 10." })
      .max(10, { error: "Rating must be between 1 and 10." }),
    disciplineRating: z.coerce
      .number()
      .int()
      .min(1, { error: "Rating must be between 1 and 10." })
      .max(10, { error: "Rating must be between 1 and 10." }),
    remarks: z.string().max(1000).optional().or(z.literal("")),
  })
  .refine(
    (d) =>
      d.battingRating + d.bowlingRating + d.fieldingRating + d.fitnessRating + d.disciplineRating > 0,
    { error: "Ratings must be between 1 and 10." }
  );

export const matchSchema = z.object({
  matchDate: z.coerce.date({ error: "Please select a valid match date." }),
  opponent: z.string().min(1, { error: "Please enter the opponent team." }).max(100),
  venue: z.string().max(200).optional().or(z.literal("")),
  matchType: z.enum(MATCH_TYPES).optional().nullable(),
  competition: z.string().max(200).optional().or(z.literal("")),
  tossWon: z.boolean().optional().nullable(),
  overs: z.coerce.number().int().min(0).max(100).optional().nullable(),
  notes: z.string().max(1000).optional().or(z.literal("")),
  result: z.enum(MATCH_RESULTS).optional().nullable(),
});

export const matchRecordSchema = z.object({
  matchId: z.string().min(1),
  entries: z.array(
    z.object({
      studentId: z.string().min(1),
      selected: z.boolean().optional(),
      battingPosition: z.coerce.number().int().min(0).max(20).optional().nullable(),
      runs: z.coerce.number().int().min(0).max(500),
      ballsFaced: z.coerce.number().int().min(0).max(1000).optional().nullable(),
      fours: z.coerce.number().int().min(0).max(100).optional(),
      sixes: z.coerce.number().int().min(0).max(100).optional(),
      dismissal: z.enum(DISMISSALS).optional().nullable(),
      wickets: z.coerce.number().int().min(0).max(20),
      oversBowled: z.coerce.number().min(0).max(100).optional().nullable(),
      maidens: z.coerce.number().int().min(0).max(100).optional(),
      runsConceded: z.coerce.number().int().min(0).max(1000).optional().nullable(),
      catches: z.coerce.number().int().min(0).max(20),
      runOuts: z.coerce.number().int().min(0).max(20).optional(),
      stumpings: z.coerce.number().int().min(0).max(20).optional(),
      strikeRate: z.coerce.number().min(0).max(1000).optional().nullable(),
      economy: z.coerce.number().min(0).max(100).optional().nullable(),
      manOfTheMatch: z.boolean().optional(),
    })
  ),
});

export const expenseSchema = z.object({
  title: z.string().min(1, { error: "Please enter a title." }).max(200),
  category: z.enum(EXPENSE_CATEGORIES, { error: "Please select a category." }),
  amount: z.coerce
    .number({ error: "Amount must be a number." })
    .int()
    .min(0, { error: "Amount cannot be negative." })
    .max(100_000_000),
  date: z.coerce.date({ error: "Please select a valid date." }),
  paymentMethod: z.enum(PAYMENT_METHODS).optional().nullable(),
  notes: z.string().max(500).optional().or(z.literal("")),
});

export const packageSchema = z.object({
  name: z.string().min(2, { error: "Please enter a package name." }).max(100),
  description: z.string().max(500).optional().or(z.literal("")),
  price: z.coerce
    .number({ error: "Price must be a number." })
    .int()
    .min(0, { error: "Price cannot be negative." })
    .max(100_000_000),
  billingType: z.enum(BILLING_TYPES, { error: "Please select a billing type." }),
  sessionsPerWeek: z.coerce
    .number()
    .int()
    .min(0, { error: "Sessions per week cannot be negative." })
    .max(30),
  features: z.array(z.string().max(200)).max(20),
  startDate: z.coerce.date().optional().nullable(),
  endDate: z.coerce.date().optional().nullable(),
  isActive: z.boolean().default(true),
});

export const goalSchema = z.object({
  studentId: z.string().min(1, { error: "Please select a student." }),
  title: z.string().min(2, { error: "Please enter a goal title." }).max(200),
  description: z.string().max(1000).optional().or(z.literal("")),
  category: z.enum(GOAL_CATEGORIES, { error: "Please select a category." }),
  baseline: z.string().max(200).optional().or(z.literal("")),
  target: z.string().max(200).optional().or(z.literal("")),
  progress: z.coerce.number().int().min(0, { error: "Progress must be 0–100." }).max(100, { error: "Progress must be 0–100." }),
  status: z.enum(GOAL_STATUSES, { error: "Please select a status." }),
  deadline: z.coerce.date().optional().nullable(),
});

export const goalProgressSchema = z.object({
  goalId: z.string().min(1),
  progress: z.coerce.number().int().min(0, { error: "Progress must be 0–100." }).max(100, { error: "Progress must be 0–100." }),
  note: z.string().max(500).optional().or(z.literal("")),
});

export const trainingSessionSchema = z.object({
  date: z.coerce.date({ error: "Please select a valid session date." }),
  batchId: z.string().optional().or(z.literal("")),
  coachId: z.string().optional().or(z.literal("")),
  topic: z.string().min(2, { error: "Please enter a session topic." }).max(200),
  category: z.enum(TRAINING_CATEGORIES, { error: "Please select a category." }),
  startTime: z.string().max(20).optional().or(z.literal("")),
  endTime: z.string().max(20).optional().or(z.literal("")),
  location: z.string().max(200).optional().or(z.literal("")),
  notes: z.string().max(1000).optional().or(z.literal("")),
});

export const trainingRecordSchema = z.object({
  sessionId: z.string().min(1),
  entries: z.array(
    z.object({
      studentId: z.string().min(1),
      present: z.boolean(),
      notes: z.string().max(500).optional(),
      highlights: z.string().max(500).optional(),
    })
  ),
});

export const admissionSchema = z.object({
  studentName: z.string().min(2, { error: "Please enter the student's full name." }).max(100),
  dob: z.coerce
    .date({ error: "Please select a valid date of birth." })
    .refine((d) => d < new Date(), { error: "Date of birth must be in the past." })
    .refine((d) => d > new Date("1950-01-01"), { error: "Please select a valid date of birth." }),
  gender: z.enum(GENDERS, { error: "Please select a gender." }),
  guardianName: z.string().min(2, { error: "Please enter the guardian name." }).max(100),
  phone: pkPhone,
  email: z.email({ error: "Please enter a valid email address." }).optional().or(z.literal("")),
  preferredBatchId: z.string().optional().or(z.literal("")),
  experience: z.string().max(300).optional().or(z.literal("")),
  playingRole: z.string().max(50).optional().or(z.literal("")),
  message: z.string().max(1000).optional().or(z.literal("")),
});

export const admissionReviewSchema = z.object({
  admissionId: z.string().min(1),
  status: z.enum(ADMISSION_STATUSES, { error: "Please select a status." }),
  note: z.string().max(500).optional().or(z.literal("")),
});

export const coachSchema = z.object({
  fullName: z.string().min(2, { error: "Please enter the full name." }),
  email: z.email({ error: "Please enter a valid email address." }),
  mobile: optionalPkPhone,
  password: z
    .string()
    .min(8, { error: "Password must be at least 8 characters." })
    .optional()
    .or(z.literal("")),
  specialization: z.string().max(200).optional().or(z.literal("")),
  batchIds: z.array(z.string()).optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]),
});

export const parentSchema = z.object({
  fullName: z.string().min(2, { error: "Please enter the full name." }),
  email: z.email({ error: "Please enter a valid email address." }),
  mobile: optionalPkPhone,
  password: z
    .string()
    .min(8, { error: "Password must be at least 8 characters." })
    .optional()
    .or(z.literal("")),
  studentIds: z.array(z.string()).min(1, { error: "Link at least one student." }),
  status: z.enum(["ACTIVE", "INACTIVE"]),
});

export const announcementSchema = z.object({
  title: z.string().min(2, { error: "Please enter a title." }).max(200),
  body: z.string().min(2, { error: "Please enter a message." }).max(2000),
  targetRole: z.enum(["ADMIN", "COACH", "STUDENT", "PARENT"]).optional().nullable(),
});

export const userProfileSchema = z.object({
  fullName: z.string().min(2, { error: "Please enter the full name." }),
  mobile: optionalPkPhone,
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, { error: "Current password is required." }),
    newPassword: z
      .string()
      .min(8, { error: "Password must be at least 8 characters." })
      .regex(/[a-zA-Z]/, { error: "Password must contain a letter." })
      .regex(/[0-9]/, { error: "Password must contain a number." }),
    confirm: z.string(),
  })
  .refine((d) => d.newPassword === d.confirm, {
    message: "Passwords do not match.",
    path: ["confirm"],
  });

export type StudentInput = z.infer<typeof studentSchema>;
export type FeeInput = z.infer<typeof feeSchema>;
export type PerformanceInput = z.infer<typeof performanceSchema>;
export type ExpenseInput = z.infer<typeof expenseSchema>;
export type PackageInput = z.infer<typeof packageSchema>;
export type CoachInput = z.infer<typeof coachSchema>;
export type ParentInput = z.infer<typeof parentSchema>;
export type GoalInput = z.infer<typeof goalSchema>;
export type TrainingSessionInput = z.infer<typeof trainingSessionSchema>;
export type AdmissionInput = z.infer<typeof admissionSchema>;