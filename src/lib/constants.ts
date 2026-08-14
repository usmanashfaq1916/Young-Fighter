export const SKILL_LEVELS = [
  "BEGINNER",
  "INTERMEDIATE",
  "ADVANCED",
  "PROFESSIONAL",
] as const;

export const GENDERS = ["MALE", "FEMALE", "OTHER"] as const;

export const STUDENT_STATUSES = ["ACTIVE", "INACTIVE"] as const;

export const USER_STATUSES = ["ACTIVE", "INACTIVE"] as const;

export const ATTENDANCE_STATUSES = ["PRESENT", "ABSENT", "LEAVE", "LATE", "EXCUSED"] as const;

export const FEE_STATUSES = ["PAID", "PARTIAL", "PENDING", "OVERDUE", "WAIVED"] as const;

export const PAYMENT_METHODS = [
  "CASH",
  "BANK_TRANSFER",
  "JAZZCASH",
  "EASYPAISA",
  "CARD",
  "OTHER",
] as const;

export const MATCH_RESULTS = ["WON", "LOST", "DRAW", "TIE"] as const;

export const MATCH_TYPES = ["FRIENDLY", "TOURNAMENT", "LEAGUE", "PRACTICE", "OTHER"] as const;

export const DISMISSALS = [
  "BOWLED",
  "CAUGHT",
  "LBW",
  "RUN_OUT",
  "STUMPED",
  "NOT_OUT",
  "RETIRED",
  "OTHER",
] as const;

export const GOAL_STATUSES = ["NOT_STARTED", "IN_PROGRESS", "ACHIEVED", "CANCELLED"] as const;

export const TRAINING_CATEGORIES = [
  "BATTING",
  "BOWLING",
  "FIELDING",
  "FITNESS",
  "WICKETKEEPING",
  "TACTICAL",
  "MATCH_PRACTICE",
] as const;

export const ADMISSION_STATUSES = ["NEW", "REVIEW", "APPROVED", "REJECTED", "CONVERTED"] as const;

export const GOAL_CATEGORIES = [
  "BATTING",
  "BOWLING",
  "FIELDING",
  "FITNESS",
  "WICKETKEEPING",
  "MENTAL",
  "TECHNICAL",
  "OTHER",
] as const;

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

export const PLAYING_ROLES = [
  "BATTER",
  "BOWLER",
  "ALL-ROUNDER",
  "WICKETKEEPER",
] as const;

export const BATTING_STYLES = [
  "RIGHT_HAND",
  "LEFT_HAND",
] as const;

export const BOWLING_STYLES = [
  "RIGHT_ARM_FAST",
  "RIGHT_ARM_MEDIUM",
  "RIGHT_ARM_OFF_SPIN",
  "RIGHT_ARM_LEG_SPIN",
  "LEFT_ARM_FAST",
  "LEFT_ARM_MEDIUM",
  "LEFT_ARM_SPIN",
] as const;

export const playingRoleLabel: Record<string, string> = {
  BATTER: "Batter",
  BOWLER: "Bowler",
  "ALL-ROUNDER": "All-Rounder",
  WICKETKEEPER: "Wicketkeeper",
};

export const battingStyleLabel: Record<string, string> = {
  RIGHT_HAND: "Right Hand",
  LEFT_HAND: "Left Hand",
};

export const bowlingStyleLabel: Record<string, string> = {
  RIGHT_ARM_FAST: "Right-Arm Fast",
  RIGHT_ARM_MEDIUM: "Right-Arm Medium",
  RIGHT_ARM_OFF_SPIN: "Right-Arm Off Spin",
  RIGHT_ARM_LEG_SPIN: "Right-Arm Leg Spin",
  LEFT_ARM_FAST: "Left-Arm Fast",
  LEFT_ARM_MEDIUM: "Left-Arm Medium",
  LEFT_ARM_SPIN: "Left-Arm Spin",
};

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
  GOAL_ADDED: "Development goal added",
  GOAL_UPDATED: "Development goal updated",
  MATCH_ADDED: "Match added",
  MATCH_UPDATED: "Match updated",
  TRAINING_SESSION_CREATED: "Training session created",
  TRAINING_ATTENDANCE_RECORDED: "Training attendance recorded",
  ADMISSION_SUBMITTED: "Admission application submitted",
  ADMISSION_REVIEWED: "Admission application reviewed",
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
  LATE: "Late",
  EXCUSED: "Excused",
};

export const feeStatusLabel: Record<string, string> = {
  PAID: "Paid",
  PARTIAL: "Partial",
  PENDING: "Pending",
  OVERDUE: "Overdue",
  WAIVED: "Waived",
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

export const matchTypeLabel: Record<string, string> = {
  FRIENDLY: "Friendly",
  TOURNAMENT: "Tournament",
  LEAGUE: "League",
  PRACTICE: "Practice",
  OTHER: "Other",
};

export const dismissalLabel: Record<string, string> = {
  BOWLED: "Bowled",
  CAUGHT: "Caught",
  LBW: "LBW",
  RUN_OUT: "Run Out",
  STUMPED: "Stumped",
  NOT_OUT: "Not Out",
  RETIRED: "Retired",
  OTHER: "Other",
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

export const goalStatusLabel: Record<string, string> = {
  NOT_STARTED: "Not Started",
  IN_PROGRESS: "In Progress",
  ACHIEVED: "Achieved",
  CANCELLED: "Cancelled",
};

export const goalCategoryLabel: Record<string, string> = {
  BATTING: "Batting",
  BOWLING: "Bowling",
  FIELDING: "Fielding",
  FITNESS: "Fitness",
  WICKETKEEPING: "Wicketkeeping",
  MENTAL: "Mental / Discipline",
  TECHNICAL: "Technical",
  OTHER: "Other",
};

export const trainingCategoryLabel: Record<string, string> = {
  BATTING: "Batting",
  BOWLING: "Bowling",
  FIELDING: "Fielding",
  FITNESS: "Fitness",
  WICKETKEEPING: "Wicketkeeping",
  TACTICAL: "Tactical",
  MATCH_PRACTICE: "Match Practice",
};

export const admissionStatusLabel: Record<string, string> = {
  NEW: "New",
  REVIEW: "In Review",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  CONVERTED: "Converted",
};
