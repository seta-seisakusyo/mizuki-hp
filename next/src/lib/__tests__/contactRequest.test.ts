import { describe, expect, it } from "vitest";
import { contactRequestSchema } from "@/lib/apiSchemas";
import { buildContactRequest, type ContactFormValues } from "@/lib/contact/request";
import { validateInquiry } from "@/lib/validation";

const values: ContactFormValues = {
  name: "山田 太郎",
  email: "taro@example.com",
  phone: "076-255-0337",
  inquiry: "予約について質問があります。",
};

describe("お問い合わせフォームの送信データ (#187)", () => {
  it("フォームが送る本文は /api/email のスキーマを通る", () => {
    const result = contactRequestSchema.safeParse(buildContactRequest(values, "recaptcha-token"));
    expect(result.success).toBe(true);
  });

  it("電話番号が空・reCAPTCHA トークンが空（開発環境）でもスキーマを通る", () => {
    const result = contactRequestSchema.safeParse(
      buildContactRequest({ ...values, phone: "" }, "")
    );
    expect(result.success).toBe(true);
  });

  it("フォームの入力チェックを通る値は、スキーマも通る", () => {
    expect(validateInquiry(values)).toEqual({});
    expect(contactRequestSchema.safeParse(buildContactRequest(values, "t")).success).toBe(true);
  });

  it("スキーマは未定義の項目を拒否する（以前フォームが送っていた company など）", () => {
    const result = contactRequestSchema.safeParse({
      ...buildContactRequest(values, "t"),
      company: "",
    });
    expect(result.success).toBe(false);
  });
});
