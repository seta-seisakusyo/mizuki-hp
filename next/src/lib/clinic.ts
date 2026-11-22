/**
 * クリニックの基本情報（名称・所在地・連絡先・診療時間）
 *
 * 以前は各ページと構造化データ（JSON-LD）に直書きされており、
 * 診療時間と郵便番号が画面と検索エンジン向けデータで食い違っていた（#188）。
 * 表示も構造化データも、ここの値から作ること。
 */

export const CLINIC = {
  name: "みずきクリニック",
  postalCode: "921-0201",
  region: "石川県",
  locality: "金沢市",
  streetAddress: "みずき1丁目3-5",
  tel: "076-255-0337",
  fax: "076-255-1211",
  email: "info@mizuki-clinic.jp",
  geo: { latitude: 36.5944, longitude: 136.6256 },
} as const;

/** 都道府県から番地までの住所（例: 石川県金沢市みずき1丁目3-5） */
export const CLINIC_ADDRESS = `${CLINIC.region}${CLINIC.locality}${CLINIC.streetAddress}`;

export type Weekday = "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat";

/** 診療時間表に並べる曜日（日曜・祝日は休診） */
export const CONSULTATION_DAYS: readonly { key: Weekday; label: string; schemaDay: string }[] = [
  { key: "Mon", label: "月", schemaDay: "Monday" },
  { key: "Tue", label: "火", schemaDay: "Tuesday" },
  { key: "Wed", label: "水", schemaDay: "Wednesday" },
  { key: "Thu", label: "木", schemaDay: "Thursday" },
  { key: "Fri", label: "金", schemaDay: "Friday" },
  { key: "Sat", label: "土", schemaDay: "Saturday" },
];

export type ConsultationSession = {
  label: string;
  /** "HH:mm" */
  opens: string;
  /** "HH:mm" */
  closes: string;
  days: readonly Weekday[];
};

/** 診療時間。午前・午後の時間帯ごとに診療する曜日を持つ */
export const CONSULTATION_SESSIONS: readonly ConsultationSession[] = [
  { label: "午前", opens: "09:00", closes: "12:30", days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] },
  { label: "午後", opens: "16:00", closes: "18:00", days: ["Mon", "Tue", "Thu", "Fri"] },
];

/** "09:00" → "9:00"（画面表示用） */
export function formatTime(time: string): string {
  return time.replace(/^0/, "");
}

/** 時間帯を "9:00 – 12:30" の形にする */
export function formatSession(session: ConsultationSession): string {
  return `${formatTime(session.opens)} – ${formatTime(session.closes)}`;
}

export function isOpen(session: ConsultationSession, day: Weekday): boolean {
  return session.days.includes(day);
}

/** 休診日の説明（例: 水曜午後・土曜午後、日曜、祝日） */
export function closedDaysText(): string {
  const partial = CONSULTATION_SESSIONS.flatMap((session) =>
    CONSULTATION_DAYS.filter((day) => !isOpen(session, day.key)).map(
      (day) => `${day.label}曜${session.label}`
    )
  );
  return [partial.join("・"), "日曜", "祝日"].filter(Boolean).join("、");
}

/** schema.org の openingHoursSpecification（構造化データ用） */
export function openingHoursSpecification() {
  return CONSULTATION_SESSIONS.map((session) => ({
    "@type": "OpeningHoursSpecification",
    dayOfWeek: CONSULTATION_DAYS.filter((day) => isOpen(session, day.key)).map(
      (day) => day.schemaDay
    ),
    opens: session.opens,
    closes: session.closes,
  }));
}

/** schema.org の PostalAddress（構造化データ用） */
export function postalAddress() {
  return {
    "@type": "PostalAddress",
    streetAddress: CLINIC.streetAddress,
    addressLocality: CLINIC.locality,
    addressRegion: CLINIC.region,
    postalCode: CLINIC.postalCode,
    addressCountry: "JP",
  };
}
