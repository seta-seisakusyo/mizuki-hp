import * as z from "zod";

// Todo: 今後、バリデーション関数ではなく、zodバリデーションスキーマの仕様に統一することも検討する
export interface ValidationError {
  [key: string]: string; // 各フィールドに対するエラーメッセージ
}

// 入力長制限の定数
export const INPUT_LIMITS = {
  NAME_MAX: 50,
  COMPANY_MAX: 100,
  EMAIL_MAX: 254,
  PHONE_MAX: 20,
  INQUIRY_MAX: 2000,
  BLOG_TITLE_MAX: 200,
  BLOG_CONTENT_MAX: 50000,
  NEWS_TITLE_MAX: 200,
  NEWS_CONTENT_MAX: 10000,
} as const;

// 共通バリデーションロジック
const validateName = (name: string): string | null => {
  if (!name) {
    return "氏名を入力してください。";
  } else if (name.length > INPUT_LIMITS.NAME_MAX) {
    return `氏名は${INPUT_LIMITS.NAME_MAX}文字以内で入力してください。`;
  }
  return null;
};

// RFC 5321準拠のメールアドレスパターン（+記号も許可）
const validateEmail = (email: string): string | null => {
  const emailPattern = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  if (!email) {
    return "メールアドレスを入力してください。";
  } else if (email.length > INPUT_LIMITS.EMAIL_MAX) {
    return `メールアドレスは${INPUT_LIMITS.EMAIL_MAX}文字以内で入力してください。`;
  } else if (!emailPattern.test(email)) {
    return "有効なメールアドレスを入力してください。";
  }
  return null;
};

// 問い合わせフォームバリデーション

export interface InquiryData {
  name: string;
  company?: string; // 任意フィールド
  email: string;
  phone?: string; // 任意フィールド
  inquiry: string;
}

export const validateInquiry = (data: InquiryData): ValidationError => {
  const errors: ValidationError = {};

  // 氏名: 必須, 最大50文字
  const nameError = validateName(data.name);
  if (nameError) errors.name = nameError;

  // 会社名: 任意, 最大100文字
  if (data.company && data.company.length > INPUT_LIMITS.COMPANY_MAX) {
    errors.company = `会社名は${INPUT_LIMITS.COMPANY_MAX}文字以内で入力してください。`;
  }

  // メールアドレス: 必須, 正しい形式
  const emailError = validateEmail(data.email);
  if (emailError) errors.email = emailError;

  // 電話番号: 任意, 日本の電話番号形式（ハイフンあり/なし対応）
  const phonePattern = /^(0\d{1,4}[-]?\d{1,4}[-]?\d{3,4})?$/;
  if (data.phone) {
    if (data.phone.length > INPUT_LIMITS.PHONE_MAX) {
      errors.phone = `電話番号は${INPUT_LIMITS.PHONE_MAX}文字以内で入力してください。`;
    } else if (!phonePattern.test(data.phone)) {
      errors.phone = "有効な電話番号を入力してください（例: 03-1234-5678）。";
    }
  }

  // お問い合わせ内容: 必須, 最大2000文字
  if (!data.inquiry) {
    errors.inquiry = "お問い合わせ内容を入力してください。";
  } else if (data.inquiry.length > INPUT_LIMITS.INQUIRY_MAX) {
    errors.inquiry = `お問い合わせ内容は${INPUT_LIMITS.INQUIRY_MAX}文字以内で入力してください。`;
  }

  return errors;
};

// ユーザー登録フォームのバリデーションスキーマ
export const RegistrationSchema = z.object({
  name: z
    .string()
    .min(1, { message: "氏名を入力してください。" })
    .max(50, { message: "氏名は50文字以内で入力してください。" }),
  email: z
    .string()
    .min(1, { message: "メールアドレスを入力してください。" })
    .email({ message: "有効なメールアドレスを入力してください。" }),
  password: z
    .string()
    .min(8, { message: "パスワードは8文字以上で入力してください。" })
    .regex(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
      message: "パスワードは大文字・小文字・数字をそれぞれ含める必要があります。",
    }),
});

// ログインフォームのバリデーションスキーマ
export const LoginSchema = z.object({
  email: z
    .string()
    .min(1, { message: "メールアドレスを入力してください。" })
    .email({ message: "有効なメールアドレスを入力してください。" }),
  password: z.string().min(8, { message: "パスワードは8文字以上で入力してください。" }),
})

export type RegistrationData = z.infer<typeof RegistrationSchema>;