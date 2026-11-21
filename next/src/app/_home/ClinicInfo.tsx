"use client";
import BusinessIcon from "@mui/icons-material/Business";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import LocalHospitalIcon from "@mui/icons-material/LocalHospital";
import LocalPhoneIcon from "@mui/icons-material/LocalPhone";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import { Box, Grid, Stack, Typography } from "@mui/material";
import { CLINIC, CLINIC_ADDRESS } from "@/lib/clinic";

export default function Message02() {
  return (
    <Box
      sx={{
        width: "100%",
        py: { xs: 6, md: 1 },
        px: { xs: 2, sm: 4 },
        bgcolor: "white",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <Grid
        container
        spacing={{ xs: 4, sm: 5, md: 6 }}
        justifyContent="center"
        alignItems="stretch"
        sx={{
          maxWidth: 900,
          textAlign: "center",
        }}
      >
        {/* 名称 */}
        <Grid item xs={12} sm={6}>
          <Stack alignItems="center" spacing={1.5}>
            <BusinessIcon sx={{ color: "#4caf50", fontSize: 44 }} />
            <Typography variant="h6" fontWeight="700" sx={{ color: "#333" }}>
              名称
            </Typography>
            <Typography
              color="text.secondary"
              sx={{ fontSize: { xs: "1.2rem", md: "1.4rem" } }}
            >
              {CLINIC.name}
            </Typography>
          </Stack>
        </Grid>

        {/* 診療科 */}
        <Grid item xs={12} sm={6}>
          <Stack alignItems="center" spacing={1.5}>
            <LocalHospitalIcon sx={{ color: "#00acc1", fontSize: 44 }} />
            <Typography variant="h6" fontWeight="700" sx={{ color: "#333" }}>
              診療科
            </Typography>
            <Typography
              color="text.secondary"
              sx={{ fontSize: { xs: "1.2rem", md: "1.4rem" } }}
            >
              内科・胃腸内科・外科
            </Typography>
          </Stack>
        </Grid>

        {/* 所在地 */}
        <Grid item xs={12} sm={6}>
          <Stack alignItems="center" spacing={1.5}>
            <LocationOnIcon sx={{ color: "#ff7043", fontSize: 44 }} />
            <Typography variant="h6" fontWeight="700" sx={{ color: "#333" }}>
              所在地
            </Typography>
            <Typography
              color="text.secondary"
              sx={{
                fontSize: { xs: "1.2rem", md: "1.4rem" },
                lineHeight: 1.6,
              }}
            >
              〒{CLINIC.postalCode}
              <br />
              {CLINIC_ADDRESS}
            </Typography>
          </Stack>
        </Grid>

        {/* 連絡先 */}
        <Grid item xs={12} sm={6}>
          <Stack alignItems="center" spacing={1.5}>
            <LocalPhoneIcon sx={{ color: "#7e57c2", fontSize: 44 }} />
            <Typography variant="h6" fontWeight="700" sx={{ color: "#333" }}>
              連絡先
            </Typography>
            <Typography
              color="text.secondary"
              sx={{ fontSize: { xs: "1rem", md: "1.2rem" }, lineHeight: 1.8 }}
            >
              TEL：{CLINIC.tel}<br />
              FAX：{CLINIC.fax}<br />
              メール：{CLINIC.email}
            </Typography>
          </Stack>
        </Grid>

        {/* 設立 */}
        <Grid item xs={12} sm={6}>
          <Stack alignItems="center" spacing={1.5}>
            <CalendarTodayIcon sx={{ color: "#fdd835", fontSize: 44 }} />
            <Typography variant="h6" fontWeight="700" sx={{ color: "#333" }}>
              設立
            </Typography>
            <Typography
              color="text.secondary"
              sx={{ fontSize: { xs: "1.2rem", md: "1.4rem" } }}
            >
              2022年1月1日
            </Typography>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
}
