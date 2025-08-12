import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { buildWelcomeEmailHtml } from "./emailTemplates";

const region = process.env.AWS_REGION!;
const sesClient = new SESClient({ region });

const APP_URL = process.env.APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";
const EMAIL_LOGO_URL = process.env.EMAIL_LOGO_URL;
const DEFAULT_LOGO_URL =
  EMAIL_LOGO_URL ||
  "https://amalgama-static-sites.s3.us-east-1.amazonaws.com/closing-machines/Amalgama-Logo%2BText-Horizontal-1.png";
const SES_FROM_EMAIL = process.env.SES_FROM_EMAIL;
const APP_NAME = process.env.APP_NAME || "App";
const SES_FROM_NAME = process.env.SES_FROM_NAME || APP_NAME;

export async function sendRegistrationEmail(params: { toEmail: string; firstName?: string | null }) {
  const { toEmail, firstName } = params;
  const subject = `Welcome to ${APP_NAME}`;
  const logoUrl = DEFAULT_LOGO_URL;
  const htmlBody = buildWelcomeEmailHtml({ appUrl: APP_URL, firstName, logoUrl });

  await sendEmail({ toEmail, subject, htmlBody });
}

export async function sendPasswordResetEmail(toEmail: string, token: string) {
  const resetUrl = `${APP_URL}/reset-password?token=${encodeURIComponent(token)}`;
  const subject = "Password Reset Request";
  const htmlBody = buildWelcomeEmailHtml({
    // For now, reuse the base email structure. If you want a distinct reset template,
    // create a dedicated builder similar to buildWelcomeEmailHtml.
    appUrl: APP_URL,
    logoUrl: DEFAULT_LOGO_URL,
    firstName: undefined,
  }).replace(
    /<h1[^>]*>.*?<\/h1>/,
    `<h1 style="margin:0; font-size:24px; line-height:32px; font-weight:800;">Reset your password</h1>`
  ).replace(
    /<td style="padding:16px 24px 8px 24px; font-size:16px; line-height:24px;">[\s\S]*?<\/td>/,
    `<td style="padding:16px 24px 8px 24px; font-size:16px; line-height:24px;">
      <p style="margin:0 0 12px 0;">We received a request to reset your password.</p>
      <p style="margin:0 0 0 0;">Click the button below to reset your password. The link expires in 1 hour.</p>
    </td>`
  ).replace(
    /<a href="[^"]+"\s+style="[^"]+">[\s\S]*?<\/a>/,
    `<a href="${resetUrl}" style="display:inline-block; background:hsl(231 100% 30%); color:#ffffff; text-decoration:none; padding:10px 16px; border-radius:12px; font-weight:600; font-size:14px;">Reset password</a>`
  ).replace(
    /You are receiving this email because you recently created an account[\s\S]*?<\/td>/,
    `If you did not request a password reset, you can safely ignore this email.</td>`
  );

  await sendEmail({ toEmail, subject, htmlBody });
}

async function sendEmail({
  toEmail,
  subject,
  htmlBody,
}: {
  toEmail: string;
  subject: string;
  htmlBody: string;
}) {
  const source = SES_FROM_EMAIL ? `${SES_FROM_NAME} <${SES_FROM_EMAIL}>` : toEmail;

  console.log(`LOG =====> Sending email to ${toEmail} with subject "${subject}"`);
  console.log(`LOG =====> Email HTML body below:\n${htmlBody}`);

  const command = new SendEmailCommand({
    Destination: { ToAddresses: [toEmail] },
    Message: {
      Body: {
        Html: { Charset: "UTF-8", Data: htmlBody },
      },
      Subject: { Charset: "UTF-8", Data: subject },
    },
    Source: source,
  });

  await sesClient.send(command);
}


