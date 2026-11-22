import { INPUT_LIMITS } from "@/lib/validation";
import { z } from "zod";

// 型の不一致・未定義の項目など、個別のメッセージを付けていないエラーも日本語で返す。
// （このモジュールはサーバー側の API ルートからのみ実行時に読み込まれる）
z.config(z.locales.ja());

/**
 * API の入力スキーマ
 *
 * 入力の検証はここに集約する。ルート側で同じ検証を手書きで繰り返さず、
 * safeParse の結果（z.infer の型）をそのまま使うこと（#192）。
 */

const maxLength = (label: string, max: number) => `${label}は${max}文字以内で入力してください。`;
const required = (label: string) => `${label}を入力してください。`;

// ===== 俳句 =====

export const IMAGE_POSITIONS = ["top", "center", "bottom", "left", "right"] as const;
export type ImagePosition = (typeof IMAGE_POSITIONS)[number];

const optionalUrl = (label: string) =>
  z.string().max(2048, maxLength(label, 2048)).optional().nullable();
const imagePosition = z.enum(IMAGE_POSITIONS, { error: "画像の位置が不正です。" });

const blogFields = {
  title: z
    .string()
    .trim()
    .min(1, required("タイトル"))
    .max(INPUT_LIMITS.BLOG_TITLE_MAX, maxLength("タイトル", INPUT_LIMITS.BLOG_TITLE_MAX)),
  content: z
    .string()
    .trim()
    .min(1, required("本文"))
    .max(INPUT_LIMITS.BLOG_CONTENT_MAX, maxLength("本文", INPUT_LIMITS.BLOG_CONTENT_MAX)),
  imageUrl: optionalUrl("画像のURL"),
};

export const blogCreateSchema = z
  .object({ ...blogFields, imagePosition: imagePosition.default("center") })
  .strict();

export const blogUpdateSchema = z
  .object({ ...blogFields, imagePosition })
  .partial()
  .strict()
  .refine((value) => Object.keys(value).length > 0, "更新する項目がありません。");

export type BlogCreateInput = z.infer<typeof blogCreateSchema>;
export type BlogUpdateInput = z.infer<typeof blogUpdateSchema>;

// ===== お知らせ =====

export const NEWS_COLORS = ["black", "red", "blue", "green", "orange"] as const;
export type NewsColor = (typeof NEWS_COLORS)[number];

/**
 * お知らせの日付を解釈する。合理的な範囲（過去10年〜未来1年）外や解釈できない値は null。
 */
export function parseNewsDate(value: string, now: Date = new Date()): Date | null {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  const minDate = new Date(now.getFullYear() - 10, 0, 1);
  const maxDate = new Date(now.getFullYear() + 1, 11, 31);
  if (date < minDate || date > maxDate) return null;

  return date;
}

const newsDate = z
  .string()
  .min(1, required("日付"))
  .max(64, "日付が不正です。")
  .transform((value, ctx) => {
    const date = parseNewsDate(value);
    if (!date) {
      ctx.addIssue({
        code: "custom",
        message: "日付が不正です。過去10年〜未来1年の範囲で指定してください。",
      });
      return z.NEVER;
    }
    return date;
  });

const newsContents = z
  .unknown()
  .refine((value) => value !== null && value !== undefined, required("内容"))
  .refine((value) => {
    try {
      return JSON.stringify(value).length <= INPUT_LIMITS.NEWS_CONTENT_MAX;
    } catch {
      return false;
    }
  }, maxLength("内容", INPUT_LIMITS.NEWS_CONTENT_MAX));

const newsFields = {
  date: newsDate,
  title: z
    .string()
    .trim()
    .min(1, required("タイトル"))
    .max(INPUT_LIMITS.NEWS_TITLE_MAX, maxLength("タイトル", INPUT_LIMITS.NEWS_TITLE_MAX)),
  contents: newsContents,
  url: optionalUrl("リンクのURL"),
  pinned: z.boolean(),
};
const newsColor = z.enum(NEWS_COLORS, { error: "文字色が不正です。" });

export const newsCreateSchema = z
  .object({
    ...newsFields,
    color: newsColor.default("black"),
    pinned: newsFields.pinned.default(false),
  })
  .strict();

export const newsUpdateSchema = z
  .object({ ...newsFields, color: newsColor })
  .partial()
  .strict()
  .refine((value) => Object.keys(value).length > 0, "更新する項目がありません。");

export type NewsCreateInput = z.infer<typeof newsCreateSchema>;
export type NewsUpdateInput = z.infer<typeof newsUpdateSchema>;

// ===== お問い合わせ =====

export const contactRequestSchema = z
  .object({
    name: z.string().max(INPUT_LIMITS.NAME_MAX),
    email: z.string().max(INPUT_LIMITS.EMAIL_MAX),
    phone: z.string().max(INPUT_LIMITS.PHONE_MAX).optional().default(""),
    inquiry: z.string().max(INPUT_LIMITS.INQUIRY_MAX),
    token: z.string().max(4096),
  })
  .strict();

export const inquiryDeleteSchema = z
  .object({ id: z.union([z.number().int().positive(), z.string().regex(/^\d+$/)]) })
  .strict();
