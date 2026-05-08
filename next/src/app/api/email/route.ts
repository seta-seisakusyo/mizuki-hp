import { isRateLimited } from "@/lib/rateLimit";
import { validateInquiry } from "@/lib/validation";
import { isAdminUser } from "@/lib/contact/auth";
import { sendContactEmails } from "@/lib/contact/mailer";
import { verifyContactRecaptcha } from "@/lib/contact/recaptcha";
import {
  createInquiry,
  listInquiries,
  removeInquiry,
} from "@/lib/contact/repository";
import { ContactPayload, ContactRequestBody } from "@/lib/contact/types";
import { NextRequest, NextResponse } from "next/server";
import xss from "xss";

function badRequest(error: string, details?: Record<string, string>) {
  return NextResponse.json(
    { success: false, error, ...(details ? { details } : {}) },
    { status: 400 }
  );
}

function unauthorized() {
  return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
}

function sanitizeBody(body: ContactRequestBody): ContactPayload {
  return {
    name: xss(String(body.name || "")).trim(),
    email: xss(String(body.email || "")).trim(),
    phone: xss(String(body.phone || "")).trim(),
    inquiry: xss(String(body.inquiry || "")).trim(),
  };
}

export async function POST(req: NextRequest) {
  if (isRateLimited(req, { windowMs: 60_000, max: 3 })) {
    return NextResponse.json(
      { success: false, error: "Too many requests. Please try again later." },
      { status: 429 }
    );
  }

  try {
    const body = (await req.json()) as ContactRequestBody;
    const token = String(body.token || "");
    const payload = sanitizeBody(body);

    const validationErrors = validateInquiry(payload);
    if (Object.keys(validationErrors).length > 0) {
      return badRequest("Validation failed.", validationErrors);
    }

    const recaptchaOk = await verifyContactRecaptcha(token);
    if (!recaptchaOk) {
      return NextResponse.json(
        { success: false, error: "reCAPTCHA verification failed." },
        { status: 403 }
      );
    }

    // メール送信を先に実行（失敗時はDB保存もスキップ）
    await sendContactEmails(payload);
    // メール送信成功後にDB保存（重複防止）
    await createInquiry(payload);

    return NextResponse.json({
      success: true,
      message: "Inquiry sent successfully.",
    });
  } catch (error) {
    console.error("Inquiry send error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to send inquiry." },
      { status: 500 }
    );
  }
}

export async function GET() {
  if (!(await isAdminUser())) return unauthorized();

  try {
    const inquiries = await listInquiries();
    return NextResponse.json({ success: true, inquiries });
  } catch (error) {
    console.error("Inquiry list error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch inquiries." },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  if (!(await isAdminUser())) return unauthorized();

  try {
    const body = (await req.json()) as { id?: number | string };
    const id = Number(body.id);
    if (!Number.isFinite(id) || id <= 0) {
      return badRequest("Invalid inquiry ID.");
    }

    await removeInquiry(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Inquiry delete error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete inquiry." },
      { status: 500 }
    );
  }
}
