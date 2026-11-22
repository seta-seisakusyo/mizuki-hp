import { Box, Typography, Link } from "@mui/material";
import { getNewsPage } from "@/lib/news";

const HOME_NEWS_COUNT = 5;

/**
 * トップページのお知らせ（最新5件）。
 * 以前はブラウザから /api/news を呼んでいたため、HTML にお知らせが含まれず、
 * 読み込み直後は「お知らせはありません」と表示されていた（#194）。
 */
export default async function News() {
  const { items } = await getNewsPage(1, HOME_NEWS_COUNT);

  if (items.length === 0) {
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
      {items.map((news) => {
        const isRed = news.color === "red";
        return (
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
                  sx={{ fontWeight: "bold", color: isRed ? "red" : "inherit" }}
                >
                  {news.title}
                </Link>
              ) : (
                <Typography variant="body2" sx={{ fontWeight: "bold", color: isRed ? "red" : "inherit" }}>
                  {news.title}
                </Typography>
              )}
              {news.lines.length > 0 && (
                <Box sx={{ mt: 0.5 }}>
                  {news.lines.map((line, i) => (
                    <Typography
                      key={`${news.id}-line-${i}`}
                      variant="body2"
                      sx={{ fontSize: "0.85rem", color: isRed ? "red" : "text.secondary" }}
                    >
                      {line}
                    </Typography>
                  ))}
                </Box>
              )}
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}
