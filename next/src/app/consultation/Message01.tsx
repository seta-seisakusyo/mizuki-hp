import { Box, Link, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from "@mui/material";
import {
  closedDaysText,
  CONSULTATION_DAYS,
  CONSULTATION_SESSIONS,
  formatSession,
  isOpen,
} from "@/lib/clinic";

const OPEN_COLOR = "#4caf50";
const CLOSED_COLOR = "#ef5350";

// 診療時間は @/lib/clinic のデータから作る（構造化データと同じ値を使うため）
export default function ConsultationHours() {
  return (
    <Box sx={{ maxWidth: 700, mx: "auto", mt: 0, width: "100%" }}>
      <TableContainer
        sx={{
          borderRadius: 3,
          boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
          overflowX: "auto",
        }}
      >
        <Table sx={{ borderCollapse: "collapse", minWidth: 320 }}>
          <TableHead>
            <TableRow>
              <TableCell
                align="center"
                sx={{
                  backgroundColor: "#2a7d8f",
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: { xs: "0.7rem", sm: "0.85rem" },
                  py: { xs: 1, sm: 1.5 },
                  px: { xs: 1, sm: 2 },
                  borderBottom: "none",
                }}
              >
                診療時間
              </TableCell>
              {CONSULTATION_DAYS.map((day) => (
                <TableCell
                  key={day.key}
                  align="center"
                  sx={{
                    backgroundColor: "#2a7d8f",
                    color: day.key === "Sat" ? "#ffd54f" : "#fff",
                    fontWeight: 700,
                    fontSize: { xs: "0.8rem", sm: "0.95rem" },
                    py: { xs: 1, sm: 1.5 },
                    px: { xs: 0.5, sm: 2 },
                    borderBottom: "none",
                    borderLeft: "1px solid rgba(255,255,255,0.2)",
                  }}
                >
                  {day.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {CONSULTATION_SESSIONS.map((session, rowIndex) => {
              const backgroundColor = rowIndex % 2 === 0 ? "#f0f9fb" : "#fff";
              const borderBottom =
                rowIndex === CONSULTATION_SESSIONS.length - 1 ? "none" : "1px solid #e0eff3";
              return (
                <TableRow key={session.label}>
                  <TableCell
                    sx={{
                      fontWeight: 600,
                      fontSize: { xs: "0.7rem", sm: "0.8rem" },
                      backgroundColor,
                      whiteSpace: "nowrap",
                      py: { xs: 1.5, sm: 2 },
                      px: { xs: 1, sm: 2 },
                      borderBottom,
                    }}
                  >
                    {formatSession(session)}
                  </TableCell>
                  {CONSULTATION_DAYS.map((day) => {
                    const open = isOpen(session, day.key);
                    return (
                      <TableCell
                        key={day.key}
                        align="center"
                        sx={{
                          backgroundColor,
                          py: { xs: 1.5, sm: 2 },
                          px: { xs: 0.5, sm: 2 },
                          borderLeft: "1px solid #e0eff3",
                          borderBottom,
                        }}
                      >
                        <Box
                          role="img"
                          aria-label={`${day.label}曜${session.label} ${open ? "診療" : "休診"}`}
                          sx={{
                            width: { xs: 20, sm: 28 },
                            height: { xs: 20, sm: 28 },
                            borderRadius: "50%",
                            backgroundColor: open ? OPEN_COLOR : CLOSED_COLOR,
                            mx: "auto",
                          }}
                        />
                      </TableCell>
                    );
                  })}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{ mt: 2, display: "flex", alignItems: "center", gap: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <Box sx={{ width: 14, height: 14, borderRadius: "50%", backgroundColor: OPEN_COLOR }} />
          <Typography variant="caption" color="text.secondary">診療</Typography>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <Box sx={{ width: 14, height: 14, borderRadius: "50%", backgroundColor: CLOSED_COLOR }} />
          <Typography variant="caption" color="text.secondary">休診</Typography>
        </Box>
      </Box>

      <Typography variant="body2" sx={{ mt: 2, color: "text.secondary", fontWeight: 500, fontSize: { xs: "0.75rem", sm: "0.875rem" } }}>
        ※ 休診日：{closedDaysText()}<br />
        <Box component="span" sx={{ color: "#e53935" }}>※ 受付は診療終了30分前までにお願いします。</Box>
      </Typography>

      <Typography variant="body2" sx={{ mt: 2, lineHeight: 2, color: "text.primary", fontSize: { xs: "0.75rem", sm: "0.875rem" } }}>
        当院では、出来るだけ多くの方に検査を受けていただけるように土曜日も検査が可能です。<br />
        内視鏡検査をご希望の方は、ネットもしくはお電話にてご予約ください。<br />
        ➡ ネットからのご予約は
        <Link
          href="https://reserva.be/kimuraowarichoclinic?simple=1"
          underline="hover"
          color="primary"
          fontWeight="bold"
          target="_blank"
          rel="noopener"
        >
          こちら
        </Link>
        <br /><br />
        尚、紹介状をお持ちの方は保険証と一緒に受付窓口にお出しください。
      </Typography>
    </Box>
  );
}
