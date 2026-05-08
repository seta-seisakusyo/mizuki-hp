/**
 * 日付をJST (Asia/Tokyo) で扱うためのユーティリティ
 * サーバーサイド（UTC環境）でも正しくJSTの年月日を取得できる
 */

const TZ = "Asia/Tokyo";

/** JST での年と月を取得 */
export function getJSTYearMonth(date: Date | string): { year: number; month: number } {
  const d = typeof date === "string" ? new Date(date) : date;
  const year = parseInt(new Intl.DateTimeFormat("en-US", { timeZone: TZ, year: "numeric" }).format(d));
  const month = parseInt(new Intl.DateTimeFormat("en-US", { timeZone: TZ, month: "numeric" }).format(d));
  return { year, month };
}

/** JST で日付を "yyyy/mm/dd" 形式にフォーマット */
export function formatJSTDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("ja-JP", { timeZone: TZ });
}
