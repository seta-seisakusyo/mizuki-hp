import { describe, expect, it } from "vitest";
import {
  CLINIC,
  closedDaysText,
  CONSULTATION_SESSIONS,
  formatSession,
  openingHoursSpecification,
  postalAddress,
} from "@/lib/clinic";

describe("クリニックの診療時間 (#188)", () => {
  it("画面の表に出す時間帯", () => {
    expect(CONSULTATION_SESSIONS.map(formatSession)).toEqual(["9:00 – 12:30", "16:00 – 18:00"]);
  });

  it("休診日の説明は診療時間のデータから作る", () => {
    expect(closedDaysText()).toBe("水曜午後・土曜午後、日曜、祝日");
  });

  it("構造化データの診療時間は画面の表と同じ（以前は木曜午後が抜け、水曜午後が入っていた）", () => {
    expect(openingHoursSpecification()).toEqual([
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
        opens: "09:00",
        closes: "12:30",
      },
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Thursday", "Friday"],
        opens: "16:00",
        closes: "18:00",
      },
    ]);
  });

  it("構造化データの郵便番号は画面と同じ（以前は 920-3122 だった）", () => {
    expect(postalAddress().postalCode).toBe("921-0201");
    expect(postalAddress().postalCode).toBe(CLINIC.postalCode);
  });
});
