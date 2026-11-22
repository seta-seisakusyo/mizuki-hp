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

/** JST で日付を "2026年6月1日" 形式にフォーマット（お知らせの表示用） */
export function formatJSTDateLong(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("ja-JP", { timeZone: TZ, year: "numeric", month: "long", day: "numeric" });
}

/**
 * JST での日付を `<input type="date">` の値（"YYYY-MM-DD"）にする。
 *
 * `toISOString().split("T")[0]` は UTC の日付なので、日本時間 0〜9 時の値が前日になる。
 * 以前 /news から日付ピッカーで登録したお知らせは日本時間 0 時（UTC の前日 15 時）で
 * 保存されており、管理画面の編集で 1 日前に表示されていた（#194）。
 */
export function toJSTDateInputValue(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  // en-CA の日付表記は YYYY-MM-DD
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}
