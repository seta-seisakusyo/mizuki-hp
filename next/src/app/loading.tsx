import { Box, CircularProgress, Typography } from "@mui/material";

export default function Loading() {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "50vh",
        gap: 2,
      }}
    >
      <CircularProgress />
      <Typography variant="body2" color="text.secondary">
        読み込み中...
      </Typography>
    </Box>
  );
}
