"use client";

import { Box, Button, Link, Modal, TextField, Typography } from "@mui/material";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import axios from "axios";
import dayjs, { Dayjs } from "dayjs";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";

interface INewsList {
  id: number;
  title: string;
  contents: string[];
  date: string;
  updatedAt: Date;
  url?: string | null;
}

interface User {
  id: number;
  name: string;
  email: string;
  provider: string | null;
  image: string | null;
  role: "ADMIN" | "EDITOR" | "VIEWER";
}

const NewsSection = () => {
  const ITEMS_PER_PAGE = 5; // 1ページあたりのデータ数
  const [currentPage, setCurrentPage] = useState(1);
  const [newsList, setNewsList] = useState<INewsList[]>([]);
  const [editingNews, setEditingNews] = useState<INewsList | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [newsToDelete, setNewsToDelete] = useState<number | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [occurrenceDate, setOccurrenceDate] = useState<Dayjs | null>(null);

  const { data: session, status } = useSession();

  const [title, setTitle] = useState<string>("");
  const [content, setContent] = useState<string>("");

  // ニュースを追加
  const addNews = async () => {
    try {
      await axios.post("/api/news", {
        date: occurrenceDate?.toISOString() || "", // 修正
        title,
        contents: content.split("\n"),
      });
      setTitle("");
      setContent("");
      setOccurrenceDate(null); // 初期化
      fetchNews();
    } catch (error) {
      console.error("Failed to add news:", error);
    }
  };

  const fetchNews = useCallback(async () => {
    try {
      const response = await axios.get<{ news: INewsList[] }>("/api/news");
      const formattedNews = response.data.news.map((news) => ({
        ...news,
        date: new Date(news.date).toLocaleDateString("ja-JP", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
      }));
      setNewsList(formattedNews);
    } catch (error) {
      console.error("Failed to fetch news:", error);
    }
  }, []);

  useEffect(() => {
    fetchNews();
  }, [fetchNews]);

  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      setUser({
        id: 0,
        name: session.user.name || "",
        email: session.user.email || "",
        provider: null,
        image: session.user.image || null,
        role: (session.user as { role?: "ADMIN" | "EDITOR" | "VIEWER" }).role || "VIEWER",
      });
    }
  }, [status, session]);

  // ニュースを削除
  const deleteNews = async () => {
    try {
      if (newsToDelete !== null) {
        await axios.delete("/api/news", {
          data: { id: newsToDelete },
        });
        setShowDeleteModal(false);
        fetchNews();
      }
    } catch (error) {
      console.error("Failed to delete news:", error);
    }
  };

  // ニュースを更新
  const updateNews = async () => {
    try {
      if (editingNews) {
        await axios.put("/api/news", {
          id: editingNews.id,
          date: editingNews.date, // 修正: ISO 8601 形式で送信
          title: editingNews.title,
          contents: editingNews.contents,
        });
        setEditingNews(null);
        fetchNews();
      }
    } catch (error) {
      console.error("Failed to update news:", error);
    }
  };

  const totalPages = Math.ceil(newsList.length / ITEMS_PER_PAGE);
  const paginatedData = newsList.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const generatePagination = () => {
    const pages = [];

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
  };

  const paginationItems = generatePagination();

  // ボタンの共通スタイル
  const buttonStyles = {
    minWidth: { xs: "32px", md: "40px" },
    height: { xs: "32px", md: "40px" },
    fontSize: { xs: "12px", md: "14px" },
  };

  return (
    <>
      {user && (user.role === "ADMIN" || user.role === "EDITOR") && (
        <Box
          sx={{
            width: "100%",
            maxWidth: "800px",
            margin: "0 auto",
            padding: 2,
            marginBottom: 15,
            borderRadius: "8px",
            backgroundColor: "background.paper",
            position: "relative",
          }}
        >
          <Box>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                label="日付を選択"
                value={occurrenceDate}
                onChange={(newDate) => setOccurrenceDate(newDate)}
                format="YYYY-MM-DD"
              />
            </LocalizationProvider>
            <TextField
              label="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              fullWidth
              margin="normal"
            />
            <TextField
              label="Content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              fullWidth
              multiline
              rows={4}
              margin="normal"
            />
            <Button variant="contained" sx={{ margin: "20px 0" }} onClick={addNews}>
              登録
            </Button>
          </Box>
        </Box>
      )}

      <Box
        sx={{
          width: "100%",
          maxWidth: "800px",
          margin: "0 auto",
          padding: 2,
          marginBottom: 15,
          borderRadius: "8px",
          backgroundColor: "background.paper",
          position: "relative",
        }}
      >
        {/* 前へ・次へボタン (コンテンツの上部) */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 2,
          }}
        >
          <Button
            variant="outlined"
            disabled={currentPage === 1}
            onClick={() => handlePageChange(currentPage - 1)}
            sx={buttonStyles}
          >
            前へ
          </Button>
          <Typography
            sx={{
              fontSize: { xs: "12px", md: "14px" },
              alignSelf: "center",
            }}
          >
            {currentPage} / {totalPages}
          </Typography>
          <Button
            variant="outlined"
            disabled={currentPage === totalPages}
            onClick={() => handlePageChange(currentPage + 1)}
            sx={buttonStyles}
          >
            次へ
          </Button>
        </Box>
        {/* ニュースコンテンツ */}
        {paginatedData.map((news, index) => (
          <Box component="article" key={news.id} sx={{ mb: 6 }}>
            <Typography
              variant="body2"
              color="textSecondary"
              sx={{ fontWeight: "bold", marginBottom: 1 }}
            >
              {news.date}
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: "bold", marginBottom: 2 }}>
              {news.title}
            </Typography>
            {news.contents.map((content, contentIndex) => {
              const text = typeof content === "string"
                ? content
                : (content as { value?: string })?.value || "";
              return (
                <Typography
                  key={`${news.id}-content-${contentIndex}`}
                  variant="body2"
                  color="textSecondary"
                  sx={{ marginBottom: 1 }}
                >
                  {text.trim() === "" ? <br /> : text}
                </Typography>
              );
            })}
            {news.url && (
              <Link href={news.url} target="_blank" rel="noopener" fontSize={14}>
                詳細を見る
              </Link>
            )}
            {user && (user.role === "ADMIN" || user.role === "EDITOR") && (
              <>
                <Button onClick={() => setEditingNews(news)}>編集</Button>
                <Button
                  color="error"
                  onClick={() => {
                    setNewsToDelete(news.id);
                    setShowDeleteModal(true);
                  }}
                >
                  削除
                </Button>{" "}
              </>
            )}

            {index < paginatedData.length - 1 && (
              <Box
                sx={{
                  margin: "40px auto",
                  width: "50%",
                  borderTop: "1px solid #ccc",
                }}
              />
            )}
          </Box>
        ))}
        {/* ページネーション */}
        {totalPages > 1 && (
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
                onClick={() => handlePageChange(1)}
                disabled={currentPage === 1}
                sx={buttonStyles}
              >
                最初
              </Button>
              <Button
                variant="outlined"
                onClick={() => handlePageChange(currentPage - 1)}
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
                    onClick={() => handlePageChange(item as number)}
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
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                sx={{ marginRight: 1, ...buttonStyles }}
              >
                次へ
              </Button>
              <Button
                variant="outlined"
                onClick={() => handlePageChange(totalPages)}
                disabled={currentPage === totalPages}
                sx={buttonStyles}
              >
                最後
              </Button>
            </Box>
          </Box>
        )}
        {/* 削除確認モーダル */}
        <Modal open={showDeleteModal} onClose={() => setShowDeleteModal(false)}>
          <Box
            sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              maxWidth: "400px",
              width: "90%",
              padding: 2,
              backgroundColor: "white",
              borderRadius: "8px",
              textAlign: "center",
            }}
          >
            <Typography>本当に削除してよろしいですか？</Typography>
            <Button color="error" onClick={deleteNews}>
              削除
            </Button>
            <Button onClick={() => setShowDeleteModal(false)}>キャンセル</Button>
          </Box>
        </Modal>
        {/* 編集モーダル */}
        {editingNews && (
          <Modal open={Boolean(editingNews)} onClose={() => setEditingNews(null)}>
            <Box
              sx={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                maxWidth: "800px",
                width: "90%",
                padding: 2,
                backgroundColor: "white",
                borderRadius: "8px",
              }}
            >
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  label="日付を編集"
                  value={
                    editingNews.date && dayjs(editingNews.date).isValid()
                      ? dayjs(editingNews.date)
                      : dayjs() // 初期値を現在の日付に設定
                  }
                  onChange={(newDate) =>
                    setEditingNews({
                      ...editingNews,
                      date: newDate ? newDate.toISOString() : editingNews.date,
                    })
                  }
                  format="YYYY-MM-DD"
                />
              </LocalizationProvider>
              <TextField
                label="Title"
                value={editingNews.title}
                onChange={(e) => setEditingNews({ ...editingNews, title: e.target.value })}
                fullWidth
                margin="normal"
              />
              <TextField
                label="Content"
                value={editingNews.contents.join("\n")}
                onChange={(e) =>
                  setEditingNews({ ...editingNews, contents: e.target.value.split("\n") })
                }
                fullWidth
                multiline
                rows={10}
                margin="normal"
              />
              <Button variant="contained" onClick={updateNews}>
                保存
              </Button>
            </Box>
          </Modal>
        )}
      </Box>
    </>
  );
};

export default NewsSection;

// Todo: ニュース数が多くなってきた場合は、以下の改修を検討。
// 1 [済み]データベース管理システムを導入する
// 2 ページネーションのページあたり表示数変更を可能にする（現在はデフォルトで5）
// 3 ページネーションの表示数を変更する、などの対応が必要
// 4 直前まで開いていたページ情報の記憶と呼び出しのために、グローバルステート管理若しくはセッション・ローカルストレージを導入する
// 5 ターゲットページへの遷移を実現するため、URL動的パラメータによるリンクルートを作成する。