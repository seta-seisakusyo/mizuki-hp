"use client";

import { confirmTotpSetup, disableTotp, startTotpSetup } from "@/actions/mfa";
import Link from "next/link";
import { useState } from "react";

type Enrollment = { secret: string; qrDataUrl: string };

const inputClass = "w-full rounded-lg border px-3 py-2 tracking-widest";
const buttonClass =
  "rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 disabled:opacity-50";

export default function TotpSettings({ enabled, canDisable }: { enabled: boolean; canDisable: boolean }) {
  const [isEnabled, setIsEnabled] = useState(enabled);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [currentCode, setCurrentCode] = useState("");
  const [code, setCode] = useState("");
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const run = async (task: () => Promise<void>) => {
    setBusy(true);
    setMessage(null);
    try {
      await task();
    } catch {
      setMessage({ type: "error", text: "エラーが発生しました。もう一度お試しください。" });
    } finally {
      setBusy(false);
    }
  };

  const start = () =>
    run(async () => {
      const result = await startTotpSetup(currentCode);
      if (!result.success) return setMessage({ type: "error", text: result.message });
      setEnrollment({ secret: result.secret, qrDataUrl: result.qrDataUrl });
      setCurrentCode("");
    });

  const confirm = () =>
    run(async () => {
      const result = await confirmTotpSetup(code);
      if (!result.success) return setMessage({ type: "error", text: result.message });
      setEnrollment(null);
      setCode("");
      setIsEnabled(true);
      setMessage({ type: "success", text: "二要素認証を設定しました。次回のログインから確認コードが必要です。" });
    });

  const disable = () =>
    run(async () => {
      const result = await disableTotp(currentCode);
      if (!result.success) return setMessage({ type: "error", text: result.message });
      setCurrentCode("");
      setIsEnabled(false);
      setMessage({ type: "success", text: "二要素認証を解除しました。" });
    });

  return (
    <div className="flex flex-col gap-6">
      {message && (
        <p
          role="status"
          className={`rounded-lg p-3 text-sm ${
            message.type === "error" ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"
          }`}
        >
          {message.text}
        </p>
      )}

      <p className="text-sm">
        状態：<strong>{isEnabled ? "設定済み" : "未設定"}</strong>
      </p>

      {!enrollment && (
        <section className="flex flex-col gap-3">
          {isEnabled && (
            <label className="flex flex-col gap-1 text-sm">
              現在の確認コード（再設定・解除に必要です）
              <input
                className={inputClass}
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={8}
                value={currentCode}
                onChange={(e) => setCurrentCode(e.target.value)}
              />
            </label>
          )}
          <div className="flex flex-wrap gap-3">
            <button type="button" className={buttonClass} disabled={busy} onClick={start}>
              {isEnabled ? "認証アプリを再設定する" : "設定を始める"}
            </button>
            {isEnabled && canDisable && (
              <button
                type="button"
                className="rounded-lg border px-4 py-2 font-semibold hover:bg-gray-50 disabled:opacity-50"
                disabled={busy}
                onClick={disable}
              >
                解除する
              </button>
            )}
          </div>
        </section>
      )}

      {enrollment && (
        <section className="flex flex-col gap-4">
          <ol className="list-decimal pl-5 text-sm space-y-1">
            <li>認証アプリで下のQRコードを読み取ってください。</li>
            <li>アプリに表示された6桁の確認コードを入力して「確認する」を押してください。</li>
          </ol>
          {/* eslint-disable-next-line @next/next/no-img-element -- data URL generated on the server */}
          <img src={enrollment.qrDataUrl} alt="認証アプリ用のQRコード" className="h-48 w-48 self-center" />
          <p className="text-xs text-gray-600 break-all">
            QRコードを読み取れない場合は、次のキーを手入力してください：
            <code className="ml-1 font-mono">{enrollment.secret}</code>
          </p>
          <label className="flex flex-col gap-1 text-sm">
            確認コード
            <input
              className={inputClass}
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={8}
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
          </label>
          <button type="button" className={buttonClass} disabled={busy || !code} onClick={confirm}>
            確認する
          </button>
        </section>
      )}

      {isEnabled && (
        <Link href="/portal-admin" className="text-sm text-blue-600 underline">
          管理画面へ戻る
        </Link>
      )}
    </div>
  );
}
