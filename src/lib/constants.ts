export const SKILL_LEVELS = [
  "BEGINNER",
  "INTERMEDIATE",
  "ADVANCED",
  "PROFESSIONAL",
] as const;

export const GENDERS = ["MALE", "FEMALE", "OTHER"] as const;

export const STUDENT_STATUSES = ["ACTIVE", "INACTIVE"] as const;

export const USER_STATUSES = ["ACTIVE", "INACTIVE"] as const;

export const ATTENDANCE_STATUSES = ["PRESENT", "ABSENT", "LEAVE"] as const;

export const FEE_STATUSES = ["PAID", "PARTIAL", "PENDING"] as const;

export const PAYMENT_METHODS = [
  "CASH",
  "BANK_TRANSFER",
  "JAZZCASH",
  "EASYPAISA",
  "CARD",
  "OTHER",
] as const;

export const MATCH_RESULTS = ["WON", "LOST", "DRAW", "TIE"] as const;

export const EXPENSE_CATEGORIES = [
  "EQUIPMENT",
  "GROUND",
  "TRANSPORT",
  "UTILITIES",
  "SALARIES",
  "MAINTENANCE",
  "EVENTS",
  "OTHER",
] as const;

export const BLOOD_GROUPS = [
  "A+",
  "A-",
  "B+",
  "B-",
  "AB+",
  "AB-",
  "O+",
  "O-",
] as const;

export const ROLES = ["ADMIN", "COACH", "STUDENT", "PARENT"] as const;

export const ACADEMY_NAME = "Young Fighters Academy";
export const ACADEMY_SHORT_NAME = "YFA";

export const ACTIVITY_LABELS: Record<string, string> = {
  LOGIN: "User logged in",
  LOGOUT: "User logged out",
  PASSWORD_RESET: "Password reset",
  STUDENT_CREATED: "New student registered",
  STUDENT_UPDATED: "Student updated",
  STUDENT_DEACTIVATED: "Student deactivated",
  STUDENT_ACTIVATED: "Student activated",
  STUDENT_DELETED: "Student deleted",
  ATTENDANCE_MARKED: "Attendance marked",
  FEE_RECORDED: "Fee payment recorded",
  FEE_UPDATED: "Fee updated",
  RECEIPT_GENERATED: "Receipt generated",
  PERFORMANCE_ADDED: "Performance added",
  PERFORMANCE_UPDATED: "Performance updated",
  MATCH_ADDED: "Match added",
  MATCH_UPDATED: "Match updated",
  EXPENSE_ADDED: "Expense added",
  EXPENSE_UPDATED: "Expense updated",
  EXPENSE_DELETED: "Expense deleted",
  COACH_ADDED: "Coach added",
  COACH_UPDATED: "Coach updated",
  COACH_DEACTIVATED: "Coach deactivated",
  ANNOUNCEMENT_CREATED: "Announcement created",
  SETTINGS_UPDATED: "Settings updated",
  BACKUP_EXPORTED: "Backup exported",
  BACKUP_RESTORED: "Backup restored",
  NOTIFICATION_SENT: "Notification sent",
  OTHER: "Activity",
};

export const roleLabel: Record<string, string> = {
  ADMIN: "Admin",
  COACH: "Coach",
  STUDENT: "Student",
  PARENT: "Parent",
};

export const genderLabel: Record<string, string> = {
  MALE: "Male",
  FEMALE: "Female",
  OTHER: "Other",
};

export const skillLabel: Record<string, string> = {
  BEGINNER: "Beginner",
  INTERMEDIATE: "Intermediate",
  ADVANCED: "Advanced",
  PROFESSIONAL: "Professional",
};

export const attendanceLabel: Record<string, string> = {
  PRESENT: "Present",
  ABSENT: "Absent",
  LEAVE: "Leave",
};

export const feeStatusLabel: Record<string, string> = {
  PAID: "Paid",
  PARTIAL: "Partial",
  PENDING: "Pending",
};

export const paymentMethodLabel: Record<string, string> = {
  CASH: "Cash",
  BANK_TRANSFER: "Bank Transfer",
  JAZZCASH: "JazzCash",
  EASYPAISA: "EasyPaisa",
  CARD: "Card",
  OTHER: "Other",
};

export const matchResultLabel: Record<string, string> = {
  WON: "Won",
  LOST: "Lost",
  DRAW: "Draw",
  TIE: "Tie",
};

export const expenseCategoryLabel: Record<string, string> = {
  EQUIPMENT: "Equipment",
  GROUND: "Ground",
  TRANSPORT: "Transport",
  UTILITIES: "Utilities",
  SALARIES: "Salaries",
  MAINTENANCE: "Maintenance",
  EVENTS: "Events",
  OTHER: "Other",
};

export const studentStatusLabel: Record<string, string> = {
  ACTIVE: "Active",
  INACTIVE: "Inactive",
};
