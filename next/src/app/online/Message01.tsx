import { Box, Button, Typography } from "@mui/material";

export default function Message01() {
  return (
    <Box sx={{ maxWidth: 800, mx: "auto" }}>
      <Typography variant="body1" sx={{ mb: 3, lineHeight: 1.8 }}>
        「気になる症状があるが受診するべきか」「どの科にいけばいいのかわからない」などを
        <br />
        医師に気軽に相談することができます。
      </Typography>
      <Box sx={{ textAlign: "center", mt: 3 }}>
        <Button
          variant="contained"
          href="https://line.me/ti/p/j975cE_dH_"
          target="_blank"
          rel="noopener noreferrer"
          sx={{
            backgroundColor: "#06C755",
            color: "#fff",
            fontWeight: 700,
            fontSize: "1rem",
            px: 4,
            py: 1.5,
            borderRadius: 2,
            "&:hover": {
              backgroundColor: "#05b04c",
            },
          }}
        >
          LINEで友だち追加
        </Button>
      </Box>
    </Box>
  );
}
