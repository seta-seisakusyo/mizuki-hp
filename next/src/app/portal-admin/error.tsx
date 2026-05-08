"use client";

import { Box, Button, Container, Typography } from "@mui/material";
import { useEffect } from "react";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("管理画面でエラーが発生しました:", error);
  }, [error]);

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "50vh",
          textAlign: "center",
          gap: 3,
        }}
      >
        <Typography variant="h4" component="h1" gutterBottom>
          エラーが発生しました
        </Typography>
        <Typography variant="body1" color="text.secondary">
          管理画面で予期しないエラーが発生しました。
        </Typography>
        <Box sx={{ display: "flex", gap: 2 }}>
          <Button variant="contained" onClick={() => reset()}>
            もう一度試す
          </Button>
          <Button variant="outlined" href="/portal-admin">
            ダッシュボードに戻る
          </Button>
        </Box>
      </Box>
    </Container>
  );
}
