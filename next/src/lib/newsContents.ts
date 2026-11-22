/**
 * お知らせの本文（DB の Json 列）を行の配列にする。
 * 通常は文字列の配列だが、古いデータの `{ value }` 形式や文字列単体にも対応する。
 *
 * サーバー・クライアントの両方から使うため、DB を読み込まないモジュールに置く。
 */
export function newsContentsToLines(contents: unknown): string[] {
  if (typeof contents === "string") return contents.split("\n");
  if (!Array.isArray(contents)) return [];
  return contents.map((item) => {
    if (typeof item === "string") return item;
    if (item && typeof item === "object" && typeof (item as { value?: unknown }).value === "string") {
      return (item as { value: string }).value;
    }
    return "";
  });
}
