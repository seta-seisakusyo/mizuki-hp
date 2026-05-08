"use client";

import { Box, Button, Typography } from "@mui/material";
import { useMemo } from "react";

interface NewsPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const buttonStyles = {
  minWidth: { xs: "32px", md: "40px" },
  height: { xs: "32px", md: "40px" },
  fontSize: { xs: "12px", md: "14px" },
};

export default function NewsPagination({
  currentPage,
  totalPages,
  onPageChange,
}: NewsPaginationProps) {
  const paginationItems = useMemo(() => {
    const pages: (number | string)[] = [];

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      if (currentPage > 4) pages.push("...");
      const startPage = Math.max(2, currentPage - 2);
      const endPage = Math.min(totalPages - 1, currentPage + 2);
      for (let i = startPage; i <= endPage; i++) pages.push(i);
      if (currentPage < totalPages - 3) pages.push("...");
      pages.push(totalPages);
    }

    return pages;
  }, [currentPage, totalPages]);

  if (totalPages <= 1) return null;

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: 1,
        marginTop: 4,
        position: "relative",
      }}
    >
      {/* 左端の固定ボタン */}
      <Box sx={{ position: "absolute", left: 0 }}>
        <Button
          variant="outlined"
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          sx={buttonStyles}
        >
          最初
        </Button>
        <Button
          variant="outlined"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          sx={{ marginLeft: 1, ...buttonStyles }}
        >
          前へ
        </Button>
      </Box>

      {/* ページ番号 (md以上の場合に表示) */}
      <Box
        sx={{
          display: { xs: "none", md: "flex" },
          justifyContent: "center",
          alignItems: "center",
          gap: 1,
        }}
      >
        {paginationItems.map((item, index) =>
          item === "..." ? (
            <Box key={index} sx={{ padding: "0 8px", color: "text.secondary" }}>
              ...
            </Box>
          ) : (
            <Button
              key={index}
              variant={item === currentPage ? "contained" : "outlined"}
              onClick={() => onPageChange(item as number)}
              sx={{
                minWidth: "40px",
              }}
            >
              {item}
            </Button>
          )
        )}
      </Box>

      {/* 現在ページ / 全ページ数 (md以下の場合に表示) */}
      <Typography
        sx={{
          display: { xs: "block", md: "none" },
          position: "absolute",
          fontSize: "12px",
          alignSelf: "center",
        }}
      >
        {currentPage} / {totalPages}
      </Typography>

      {/* 右端の固定ボタン */}
      <Box sx={{ position: "absolute", right: 0 }}>
        <Button
          variant="outlined"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          sx={{ marginRight: 1, ...buttonStyles }}
        >
          次へ
        </Button>
        <Button
          variant="outlined"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          sx={buttonStyles}
        >
          最後
        </Button>
      </Box>
    </Box>
  );
}
