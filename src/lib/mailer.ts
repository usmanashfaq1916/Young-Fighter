import "server-only";

/**
 * Password reset email delivery. Uses Resend REST API when RESEND_API_KEY is
 * configured. In development, returns the reset link so it can be shown/logged.
 */
export async function sendPasswordResetEmail(input: {
  to: string;
  resetLink: string;
}): Promise<{ sent: boolean; devLink?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL ?? "Young Fighters Academy <onboarding@resend.dev>";
  if (apiKey) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from,
          to: input.to,
          subject: "Reset your Young Fighters Academy password",
          html: `
            <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px">
              <h2 style="color:#0B1F3A">Young Fighters Academy</h2>
              <p>You requested a password reset. Click the button below to set a new password.</p>
              <p style="margin:24px 0">
                <a href="${input.resetLink}" style="background:#0F5A30;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block">Reset Password</a>
              </p>
              <p>If you did not request this, you can safely ignore this email.</p>
            </div>
          `,
        }),
      });
      if (!res.ok) {
        console.error("Resend error:", res.status, await res.text());
        return { sent: false, devLink: input.resetLink };
      }
      return { sent: true };
    } catch (error) {
      console.error("Failed to send reset email:", error);
      return { sent: false, devLink: input.resetLink };
    }
  }
  return { sent: false, devLink: input.resetLink };
}