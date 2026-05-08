"use client";

import { Box, Button, Link, Typography } from "@mui/material";
import axios from "axios";
import { Dayjs } from "dayjs";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";
import {
  NewsForm,
  NewsDeleteModal,
  NewsEditModal,
  NewsPagination,
} from "./components";

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

const ITEMS_PER_PAGE = 5;

const buttonStyles = {
  minWidth: { xs: "32px", md: "40px" },
  height: { xs: "32px", md: "40px" },
  fontSize: { xs: "12px", md: "14px" },
};

export default function NewsSection() {
  const [currentPage, setCurrentPage] = useState(1);
  const [newsList, setNewsList] = useState<INewsList[]>([]);
  const [editingNews, setEditingNews] = useState<INewsList | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [newsToDelete, setNewsToDelete] = useState<number | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [occurrenceDate, setOccurrenceDate] = useState<Dayjs | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const { data: session, status } = useSession();

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

  const addNews = useCallback(async () => {
    try {
      await axios.post("/api/news", {
        date: occurrenceDate?.toISOString() || "",
        title,
        contents: content.split("\n"),
      });
      setTitle("");
      setContent("");
      setOccurrenceDate(null);
      fetchNews();
    } catch (error) {
      console.error("Failed to add news:", error);
    }
  }, [occurrenceDate, title, content, fetchNews]);

  const deleteNews = useCallback(async () => {
    try {
      if (newsToDelete !== null) {
        await axios.delete(`/api/news/${newsToDelete}`);
        setShowDeleteModal(false);
        fetchNews();
      }
    } catch (error) {
      console.error("Failed to delete news:", error);
    }
  }, [newsToDelete, fetchNews]);

  const updateNews = useCallback(async () => {
    try {
      if (editingNews) {
        await axios.put(`/api/news/${editingNews.id}`, {
          date: editingNews.date,
          title: editingNews.title,
          contents: editingNews.contents,
        });
        setEditingNews(null);
        fetchNews();
      }
    } catch (error) {
      console.error("Failed to update news:", error);
    }
  }, [editingNews, fetchNews]);

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

  const totalPages = Math.ceil(newsList.length / ITEMS_PER_PAGE);
  const paginatedData = newsList.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handlePageChange = useCallback(
    (page: number) => {
      if (page >= 1 && page <= totalPages) {
        setCurrentPage(page);
      }
    },
    [totalPages]
  );

  const isEditor = user && (user.role === "ADMIN" || user.role === "EDITOR");

  return (
    <>
      {isEditor && (
        <NewsForm
          title={title}
          content={content}
          occurrenceDate={occurrenceDate}
          onTitleChange={setTitle}
          onContentChange={setContent}
          onDateChange={setOccurrenceDate}
          onSubmit={addNews}
        />
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
            {news.contents.map((contentItem, contentIndex) => {
              const text =
                typeof contentItem === "string"
                  ? contentItem
                  : (contentItem as { value?: string })?.value || "";
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
            {isEditor && (
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
                </Button>
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

        <NewsPagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />

        <NewsDeleteModal
          open={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={deleteNews}
        />

        <NewsEditModal
          news={editingNews}
          onClose={() => setEditingNews(null)}
          onChange={setEditingNews}
          onSave={updateNews}
        />
      </Box>
    </>
  );
}
