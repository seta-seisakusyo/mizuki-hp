"use client";

import { Box, Button, Container, Typography } from "@mui/material";
import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("エラーが発生しました:", error);
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
          申し訳ございません。予期しないエラーが発生しました。
        </Typography>
        <Button variant="contained" onClick={() => reset()}>
          もう一度試す
        </Button>
      </Box>
    </Container>
  );
}
