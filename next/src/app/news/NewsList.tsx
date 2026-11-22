import { Box, Button, Link, Typography } from "@mui/material";
import NextLink from "next/link";
import { formatJSTDateLong } from "@/lib/date";
import { buildPageHref, buildPageItems } from "@/lib/pagination";
import type { NewsItem } from "@/types/models";

const pageButtonSx = {
  minWidth: { xs: "32px", md: "40px" },
  height: { xs: "32px", md: "40px" },
  fontSize: { xs: "12px", md: "14px" },
};

type Props = {
  items: NewsItem[];
  page: number;
  totalPages: number;
};

/**
 * お知らせの一覧（表示のみ）。
 * 追加・編集・削除は管理画面（/portal-admin/news）で行う（#194）。
 */
export default function NewsList({ items, page, totalPages }: Props) {
  const href = (target: number) => buildPageHref(target, { basePath: "/news" });

  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: "800px",
        margin: "0 auto",
        padding: 2,
        marginBottom: 15,
        borderRadius: "8px",
        backgroundColor: "background.paper",
      }}
    >
      {items.length === 0 && (
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", py: 4 }}>
          お知らせはありません
        </Typography>
      )}

      {items.map((news, index) => {
        const color = news.color === "red" ? "error.main" : undefined;
        return (
          <Box component="article" key={news.id} sx={{ mb: 6 }}>
            <Typography
              component="time"
              dateTime={news.date}
              variant="body2"
              color="text.secondary"
              sx={{ display: "block", fontWeight: "bold", marginBottom: 1 }}
            >
              {formatJSTDateLong(news.date)}
            </Typography>
            <Typography variant="body1" component="h2" sx={{ fontWeight: "bold", marginBottom: 2, color }}>
              {news.title}
            </Typography>
            {news.lines.map((line, lineIndex) => (
              <Typography
                key={`${news.id}-${lineIndex}`}
                variant="body2"
                color={color ?? "text.secondary"}
                sx={{ marginBottom: 1 }}
              >
                {line.trim() === "" ? <br /> : line}
              </Typography>
            ))}
            {news.url && (
              <Link href={news.url} target="_blank" rel="noopener noreferrer" fontSize={14}>
                詳細を見る
              </Link>
            )}

            {index < items.length - 1 && (
              <Box sx={{ margin: "40px auto", width: "50%", borderTop: "1px solid #ccc" }} />
            )}
          </Box>
        );
      })}

      {totalPages > 1 && (
        <Box
          component="nav"
          aria-label="ページネーション"
          sx={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 1, mt: 4, flexWrap: "wrap" }}
        >
          <Button
            variant="outlined"
            component={NextLink}
            href={href(page - 1)}
            disabled={page === 1}
            sx={pageButtonSx}
          >
            前へ
          </Button>
          {buildPageItems(page, totalPages).map((item, i) =>
            item === null ? (
              <Box key={`gap-${i}`} sx={{ px: 1, color: "text.secondary" }}>
                …
              </Box>
            ) : (
              <Button
                key={item}
                variant={item === page ? "contained" : "outlined"}
                component={NextLink}
                href={href(item)}
                aria-current={item === page ? "page" : undefined}
                sx={pageButtonSx}
              >
                {item}
              </Button>
            )
          )}
          <Button
            variant="outlined"
            component={NextLink}
            href={href(page + 1)}
            disabled={page === totalPages}
            sx={pageButtonSx}
          >
            次へ
          </Button>
        </Box>
      )}
    </Box>
  );
}
