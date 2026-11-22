import type { z } from "zod";
import type { contactRequestSchema } from "@/lib/apiSchemas";

/** /api/email の POST が受け付ける本文。API のスキーマから導く。 */
export type ContactRequest = z.input<typeof contactRequestSchema>;

/** お問い合わせフォームの入力値 */
export type ContactFormValues = {
  name: string;
  email: string;
  phone: string;
  inquiry: string;
};

/**
 * フォームの入力値から /api/email へ送る本文を作る。
 *
 * API のスキーマは未定義の項目があると拒否する（.strict()）。
 * 以前はフォームが画面に無い company を送っており、送信が必ず 400 になっていた（#187）。
 * 送る項目をここで明示し、型も API のスキーマに合わせることで再発を防ぐ。
 */
export function buildContactRequest(values: ContactFormValues, token: string): ContactRequest {
  return {
    name: values.name,
    email: values.email,
    phone: values.phone,
    inquiry: values.inquiry,
    token,
  };
}
