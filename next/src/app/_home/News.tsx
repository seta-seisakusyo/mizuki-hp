"use client";

import { Box, Typography, Link } from "@mui/material";
import { useCallback, useEffect, useState } from "react";

type NewsItem = {
  id: number;
  title: string;
  date: string;
  contents: string[];
  url: string | null;
  color: string;
  pinned: boolean;
};

export default function News() {
  const [newsList, setNewsList] = useState<NewsItem[]>([]);

  const fetchNews = useCallback(async () => {
    try {
      const res = await fetch("/api/news");
      if (!res.ok) return;
      const data = await res.json();
      setNewsList((data.news || []).slice(0, 5));
    } catch (err) {
      console.error("お知らせ取得エラー:", err);
    }
  }, []);

  useEffect(() => {
    fetchNews();
  }, [fetchNews]);

  if (newsList.length === 0) {
    return (
      <Box sx={{ maxWidth: 700, mx: "auto", py: 2, textAlign: "center" }}>
        <Typography variant="body2" color="text.secondary">
          お知らせはありません
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 700, mx: "auto", py: 2, px: 2 }}>
      {newsList.map((news) => (
        <Box
          key={news.id}
          sx={{
            display: "flex",
            gap: 2,
            py: 1.5,
            borderBottom: "1px solid",
            borderColor: "divider",
            alignItems: "baseline",
          }}
        >
          <Box>
            {news.url ? (
              <Link
                href={news.url}
                target="_blank"
                rel="noopener noreferrer"
                underline="hover"
                variant="body2"
                sx={{ fontWeight: "bold", color: news.color === "red" ? "red" : "inherit" }}
              >
                {news.title}
              </Link>
            ) : (
              <Typography
                variant="body2"
                sx={{ fontWeight: "bold", color: news.color === "red" ? "red" : "inherit" }}
              >
                {news.title}
              </Typography>
            )}
            {news.contents && news.contents.length > 0 && (
              <Box sx={{ mt: 0.5 }}>
                {news.contents.map((line, i) => (
                  <Typography
                    key={`${news.id}-line-${i}`}
                    variant="body2"
                    sx={{
                      fontSize: "0.85rem",
                      color: news.color === "red" ? "red" : "text.secondary",
                    }}
                  >
                    {line}
                  </Typography>
                ))}
              </Box>
            )}
          </Box>
        </Box>
      ))}
    </Box>
  );
}
