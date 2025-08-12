const palette = {
  background: "hsl(0 0% 100%)",
  foreground: "hsl(0 0% 0%)",
  border: "hsl(0 0% 86%)", // neutral-400
  mutedForeground: "hsl(0 0% 66%)", // neutral-500
  primary: "hsl(231 100% 30%)", // primary-700
  card: "hsl(0 0% 100%)",
};

export function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

const APP_NAME = process.env.APP_NAME || "App";

export function buildBaseEmailHtml({
  title,
  bodyHtml,
  ctaText,
  ctaUrl,
  appUrl,
  logoUrl,
}: {
  title: string;
  bodyHtml: string;
  ctaText?: string;
  ctaUrl?: string;
  appUrl: string;
  logoUrl?: string;
}): string {
  const headerLogo = logoUrl
    ? `<img src="${logoUrl}" alt="${escapeHtml(APP_NAME)}" style="display:inline-block; height:40px;" height="40" />`
    : `<span style="display:inline-block; font-size:18px; font-weight:700; letter-spacing:0.2px;">${escapeHtml(APP_NAME)}</span>`;

  return `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(title)}</title>
  </head>
  <body style="margin:0; padding:0; background:${palette.background}; color:${palette.foreground}; font-family: 'Wix Madefor Text', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Helvetica Neue', Arial, sans-serif;">
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:${palette.background};">
      <tr>
        <td align="center" style="padding:24px;">
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:640px;background:${palette.card};border:1px solid ${palette.border};border-radius:16px;overflow:hidden;">
            <tr>
              <td style="padding:20px 24px 8px 24px; text-align:center;">
                <a href="${appUrl}" style="text-decoration:none; color:inherit; display:inline-block;">
                  ${headerLogo}
                </a>
              </td>
            </tr>
            <tr>
              <td style="padding:36px 24px 8px 24px; font-size:16px; line-height:24px;">
                ${bodyHtml}
              </td>
            </tr>
            ${ctaText && ctaUrl ? `
            <tr>
              <td style="padding:8px 24px 24px 24px; text-align:center;">
                <a href="${ctaUrl}"
                   style="display:inline-block; background:${palette.primary}; color:#ffffff; text-decoration:none; padding:10px 16px; border-radius:12px; font-weight:600; font-size:14px;">
                  ${escapeHtml(ctaText)}
                </a>
              </td>
            </tr>
            ` : ""}
            <tr>
              <td style="padding:16px 24px 24px 24px; border-top:1px solid ${palette.border}; color:${palette.mutedForeground}; font-size:12px; line-height:18px; text-align:center;">
                You are receiving this email because you recently created an account at <a href="${appUrl}" style="color:${palette.primary}; text-decoration:none;"> the ${escapeHtml(APP_NAME)}</a>.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function buildWelcomeEmailHtml(params: {
  appUrl: string;
  firstName?: string | null;
  logoUrl?: string;
}): string {
  const safeName = (params.firstName ?? "").trim();
  const greetingName = safeName.length > 0 ? safeName : "there";

  const bodyHtml = `
    <p style="margin:0 0 12px 0;">Welcome aboard! Your account has been created successfully.</p>
    <p style=\"margin:0 0 0 0;\">You can jump right in by visiting your profile.</p>
  `;
  return buildBaseEmailHtml({
    title: `Welcome on board!`,
    bodyHtml,
    ctaText: "Go to your profile",
    ctaUrl: `${params.appUrl}/profile`,
    appUrl: params.appUrl,
    logoUrl: params.logoUrl,
  });
}


export function buildCredentialsEmailHtml(params: {
  appUrl: string;
  email: string;
  password: string;
  firstName?: string | null;
  logoUrl?: string;
}): string {
  const safeName = (params.firstName ?? "").trim();
  const greetingName = safeName.length > 0 ? safeName : "there";
  const safeEmail = escapeHtml(params.email);
  const safePassword = escapeHtml(params.password);

  const bodyHtml = `
    <p style="margin:0 0 12px 0;">Hi ${escapeHtml(greetingName)}, your ${escapeHtml(APP_NAME)} account has been created by an administrator.</p>
    <p style=\"margin:0 0 12px 0;\">Here are your credentials:</p>
    <table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:separate; border-spacing:0; margin:0 0 12px 0; width:100%;">
      <tr>
        <td style="padding:8px 12px; border:1px solid ${palette.border}; border-right:none; font-weight:600; width:120px;">Email</td>
        <td style="padding:8px 12px; border:1px solid ${palette.border};">${safeEmail}</td>
      </tr>
      <tr>
        <td style="padding:8px 12px; border:1px solid ${palette.border}; border-right:none; font-weight:600;">Password</td>
        <td style="padding:8px 12px; border:1px solid ${palette.border}; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, \"Liberation Mono\", \"Courier New\", monospace;">${safePassword}</td>
      </tr>
    </table>
    <p style=\"margin:0 0 0 0;\">For security, please log in and change your password.</p>
  `;
  return buildBaseEmailHtml({
    title: `Your account credentials`,
    bodyHtml,
    ctaText: "Log in",
    ctaUrl: `${params.appUrl}/login`,
    appUrl: params.appUrl,
    logoUrl: params.logoUrl,
  });
}


