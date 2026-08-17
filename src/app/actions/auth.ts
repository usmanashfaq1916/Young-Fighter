"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { createSession, deleteSession } from "@/lib/session";
import { dashboardPathFor, requireAuth } from "@/lib/auth";
import { generateResetToken } from "@/lib/utils";
import { sendPasswordResetEmail } from "@/lib/mailer";
import { logActivity } from "@/lib/activity";
import {
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  userProfileSchema,
} from "@/lib/validation/schemas";
import { revalidatePath } from "next/cache";
import { rateLimit, clientKey } from "@/lib/rate-limit";

export type AuthResult = {
  success: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

export async function loginAction(
  _prev: AuthResult | undefined,
  formData: FormData
): Promise<AuthResult> {
  if (!rateLimit(await clientKey())) {
    return {
      success: false,
      error: "Too many attempts. Please try again later.",
    };
  }

  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return {
      success: false,
      error: "Invalid input.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { email, password } = parsed.data;

  try {
    const user = await db.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user) {
      return { success: false, error: "Invalid email or password." };
    }
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return { success: false, error: "Invalid email or password." };
    }
    if (user.status !== "ACTIVE") {
      return {
        success: false,
        error: "Your account has been deactivated. Contact the academy admin.",
      };
    }

    await createSession({
      userId: user.id,
      role: user.role,
      name: user.fullName,
      sessionVersion: user.sessionVersion,
    });
    await db.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });
    await logActivity({
      userId: user.id,
      type: "LOGIN",
      action: "User logged in",
    });

    redirect(dashboardPathFor(user.role));
  } catch (error) {
    console.error("Login failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

export async function signOut(): Promise<void> {
  const user = await requireAuth().catch(() => null);
  if (user) {
    await logActivity({ userId: user.id, type: "LOGOUT", action: "User logged out" });
  }
  await deleteSession();
  redirect("/");
}

export async function forgotPasswordAction(
  _prev: AuthResult | undefined,
  formData: FormData
): Promise<AuthResult> {
  if (!rateLimit(await clientKey())) {
    return {
      success: false,
      error: "Too many attempts. Please try again later.",
    };
  }
  const parsed = forgotPasswordSchema.safeParse({
    email: formData.get("email"),
  });
  if (!parsed.success) {
    return {
      success: false,
      error: "Please enter a valid email address.",
    };
  }

  const user = await db.user.findUnique({
    where: { email: parsed.data.email.toLowerCase() },
  });
  if (!user) {
    // Do not reveal whether the account exists.
    return { success: true };
  }

  const rawToken = generateResetToken();
  const tokenHash = await bcrypt.hash(rawToken, 10);
  await db.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    },
  });

  const resetLink = `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/reset-password?token=${rawToken}`;
  const res = await sendPasswordResetEmail({ to: user.email, resetLink });

  await logActivity({
    userId: user.id,
    type: "PASSWORD_RESET",
    action: "Password reset requested",
  });

  if (!res.sent && process.env.NODE_ENV === "development" && res.devLink) {
    console.info("[dev] Password reset link:", res.devLink);
  }
  return { success: true };
}

export async function resetPasswordAction(
  _prev: AuthResult | undefined,
  formData: FormData
): Promise<AuthResult> {
  if (!rateLimit(await clientKey(), { max: 5, windowMs: 60_000 })) {
    return {
      success: false,
      error: "Too many attempts. Please try again later.",
    };
  }
  const token = formData.get("token") as string;
  const parsed = resetPasswordSchema.safeParse({
    password: formData.get("password"),
    confirm: formData.get("confirm"),
  });
  if (!parsed.success) {
    return {
      success: false,
      error: "Invalid password.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const tokens = await db.passwordResetToken.findMany({
    where: { usedAt: null },
    include: { user: true },
    take: 50,
    orderBy: { createdAt: "desc" },
  });

  let matched: (typeof tokens)[number] | null = null;
  for (const t of tokens) {
    if (await bcrypt.compare(token, t.tokenHash)) {
      matched = t;
      break;
    }
  }

  if (!matched || matched.expiresAt < new Date()) {
    return {
      success: false,
      error: "This reset link is invalid or has expired. Please request a new one.",
    };
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  await db.$transaction([
    db.passwordResetToken.update({
      where: { id: matched.id },
      data: { usedAt: new Date() },
    }),
    db.user.update({
      where: { id: matched.userId },
      data: {
        passwordHash,
        sessionVersion: { increment: 1 },
        updatedBy: matched.userId,
      },
    }),
  ]);

  await logActivity({
    userId: matched.userId,
    type: "PASSWORD_RESET",
    action: "Password reset completed",
  });

  return { success: true };
}

export async function changePasswordAction(input: {
  currentPassword: string;
  newPassword: string;
  confirm: string;
}): Promise<AuthResult> {
  const user = await requireAuth();
  if (!rateLimit(await clientKey(), { max: 10, windowMs: 60_000 })) {
    return {
      success: false,
      error: "Too many attempts. Please try again later.",
    };
  }
  const parsed = changePasswordSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: "Invalid input.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }
  const dbUser = await db.user.findUnique({ where: { id: user.id } });
  if (!dbUser) return { success: false, error: "User not found." };

  const valid = await bcrypt.compare(parsed.data.currentPassword, dbUser.passwordHash);
  if (!valid) {
    return { success: false, error: "Current password is incorrect." };
  }

  const passwordHash = await bcrypt.hash(parsed.data.newPassword, 10);
  await db.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      sessionVersion: { increment: 1 },
      updatedBy: user.id,
    },
  });

  await createSession({
    userId: user.id,
    role: user.role,
    name: user.fullName,
    sessionVersion: dbUser.sessionVersion + 1,
  });
  await logActivity({
    userId: user.id,
    type: "PASSWORD_RESET",
    action: "Password changed",
  });

  return { success: true };
}

export async function updateProfileAction(input: {
  fullName: string;
  mobile: string;
}): Promise<AuthResult> {
  const user = await requireAuth();
  const parsed = userProfileSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: "Invalid input.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }
  await db.user.update({
    where: { id: user.id },
    data: { fullName: parsed.data.fullName, mobile: parsed.data.mobile || null },
  });
  revalidatePath("/profile");
  return { success: true };
}

export async function getResetLinkForUser(userId: string): Promise<{ ok: boolean; link?: string }> {
  const user = await requireAuth();
  if (user.role !== "ADMIN") return { ok: false };
  const target = await db.user.findUnique({ where: { id: userId } });
  if (!target) return { ok: false };
  const rawToken = generateResetToken();
  const tokenHash = await bcrypt.hash(rawToken, 10);
  await db.passwordResetToken.create({
    data: {
      userId: target.id,
      tokenHash,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  });
  const link = `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/reset-password?token=${rawToken}`;
  return { ok: true, link };
}


