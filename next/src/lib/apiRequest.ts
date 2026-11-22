import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import type { z } from "zod";
import { apiError } from "@/lib/apiUtils";

export type ParseResult<T> = { ok: true; data: T } | { ok: false; response: NextResponse };

/**
 * 検証エラーの応答。管理画面は `error` をそのまま表示するため、最初のエラーを日本語の一文で返し、
 * 項目ごとの内容は `details`（キーは項目名）に入れる。
 */
export function validationErrorResponse(error: z.ZodError): NextResponse {
  const details: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.map(String).join(".") || "_";
    details[key] ??= issue.message;
  }
  const message = Object.values(details)[0] ?? "入力内容に誤りがあります。";
  return NextResponse.json({ error: message, details }, { status: 400 });
}

/**
 * リクエスト本文を JSON として読み、スキーマで検証する。
 * 戻り値の data はスキーマの出力型（z.output）なので、ルート側で再検証やキャストをしない。
 */
export async function parseJsonBody<S extends z.ZodType>(
  request: Request,
  schema: S
): Promise<ParseResult<z.output<S>>> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return { ok: false, response: apiError("リクエストの形式が不正です。", 400) };
  }

  const result = schema.safeParse(body);
  if (!result.success) return { ok: false, response: validationErrorResponse(result.error) };
  return { ok: true, data: result.data };
}

/** 更新・削除の対象が存在しない（Prisma の P2025） */
export function isRecordNotFound(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025";
}
