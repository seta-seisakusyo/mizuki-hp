import { createMailTransport, getSmtpConfig, sanitizeTextForEmail } from "@/lib/contact/mailer";
import logger from "@/lib/logger";

export type SecurityEvent =
  | { kind: "login"; email: string; ip: string; userAgent: string; at?: Date }
  | { kind: "locked"; email: string; ip: string; accountExists: boolean; at?: Date }
  | { kind: "mfa-enabled"; email: string; ip: string; at?: Date };

const formatJst = (date: Date) =>
  date.toLocaleString("ja-JP", { timeZone: "Asia/Tokyo", hour12: false });

/** Where alerts that concern the whole site go. */
export function securityAlertAddress(): string {
  return process.env.SECURITY_ALERT_EMAIL || process.env.CONTACT_TO_EMAIL || "";
}

export function buildSecurityMail(event: SecurityEvent): { to: string[]; subject: string; text: string } {
  const at = formatJst(event.at ?? new Date());
  const ip = sanitizeTextForEmail(event.ip);
  const footer = [
    "",
    "心当たりがない場合は、すぐにパスワードを変更し、サイトの管理者に連絡してください。",
  ];

  switch (event.kind) {
    case "login":
      return {
        to: [event.email],
        subject: "【みずきクリニック】管理画面へのログイン",
        text: [
          "管理画面へのログインがありました。",
          "",
          `日時: ${at}`,
          `IPアドレス: ${ip}`,
          `ブラウザ: ${sanitizeTextForEmail(event.userAgent).replace(/\n/g, " ").slice(0, 300)}`,
          ...footer,
        ].join("\n"),
      };
    case "locked": {
      const alert = securityAlertAddress();
      return {
        to: [...(event.accountExists ? [event.email] : []), ...(alert ? [alert] : [])],
        subject: "【みずきクリニック】ログイン試行の上限に達しました",
        text: [
          "管理画面へのログインの失敗が続いたため、一時的にログインを止めました（15分間）。",
          "",
          `アカウント: ${sanitizeTextForEmail(event.email)}${event.accountExists ? "" : "（登録なし）"}`,
          `日時: ${at}`,
          `IPアドレス: ${ip}`,
          ...footer,
        ].join("\n"),
      };
    }
    case "mfa-enabled":
      return {
        to: [event.email],
        subject: "【みずきクリニック】二要素認証を設定しました",
        text: [
          "管理画面のアカウントに二要素認証を設定しました。",
          "",
          `日時: ${at}`,
          `IPアドレス: ${ip}`,
          ...footer,
        ].join("\n"),
      };
  }
}

/**
 * Send a security notification. Failures are logged and never block the
 * request that triggered the notification.
 */
export async function sendSecurityNotification(event: SecurityEvent): Promise<void> {
  const mail = buildSecurityMail(event);
  const to = [...new Set(mail.to.filter(Boolean))];
  if (to.length === 0) return;

  try {
    const smtp = getSmtpConfig();
    await createMailTransport(smtp).sendMail({
      from: `"Clinic Security" <${smtp.user}>`,
      to,
      subject: mail.subject,
      text: mail.text,
    });
  } catch (error) {
    logger.error("Security notification failed:", { kind: event.kind, error: String(error) });
  }
}
