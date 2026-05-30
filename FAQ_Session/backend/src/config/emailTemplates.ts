export const resetPasswordTemplate = (name: string, url: string) => ({
  subject: 'Reset your password',
  html: `
    <div style="font-family:sans-serif;max-width:560px;margin:auto;color:#111">
      <h2 style="margin-bottom:4px">Password Reset</h2>
      <p>Hi ${name},</p>
      <p>We received a request to reset the password for this account. Click the button below — this link is valid for <strong>1 hour</strong>.</p>
      <a href="${url}"
        style="display:inline-block;margin:20px 0;padding:12px 28px;background:#4f46e5;color:#fff;text-decoration:none;border-radius:6px;font-weight:600">
        Reset Password
      </a>
      <p style="color:#555;font-size:13px">If you did not request this, you can safely ignore this email — your password will not change.</p>
    </div>
  `,
  text: `Reset your password: ${url}\n\nThis link expires in 1 hour.`,
});

export const emailVerificationTemplate = (name: string, url: string) => ({
  subject: 'Verify your email address',
  html: `
    <div style="font-family:sans-serif;max-width:560px;margin:auto;color:#111">
      <h2 style="margin-bottom:4px">Verify your email</h2>
      <p>Hi ${name},</p>
      <p>Please verify your email address to complete your account setup and continue using the platform.</p>
      <a href="${url}"
        style="display:inline-block;margin:20px 0;padding:12px 28px;background:#4f46e5;color:#fff;text-decoration:none;border-radius:6px;font-weight:600">
        Verify Email
      </a>
      <p style="color:#555;font-size:13px">
        This link expires in 24 hours. If you did not request this verification, you can safely ignore this email.
      </p>
    </div>
  `,
  text: `Verify your email address by visiting: ${url}`,
});