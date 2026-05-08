"use client";

import { Box, Button, Modal, TextField } from "@mui/material";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import dayjs from "dayjs";

interface INewsList {
  id: number;
  title: string;
  contents: string[];
  date: string;
  updatedAt: Date;
  url?: string | null;
}

interface NewsEditModalProps {
  news: INewsList | null;
  onClose: () => void;
  onChange: (news: INewsList) => void;
  onSave: () => void;
}

export default function NewsEditModal({
  news,
  onClose,
  onChange,
  onSave,
}: NewsEditModalProps) {
  if (!news) return null;

  return (
    <Modal open={Boolean(news)} onClose={onClose}>
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
              news.date && dayjs(news.date).isValid()
                ? dayjs(news.date)
                : dayjs()
            }
            onChange={(newDate) =>
              onChange({
                ...news,
                date: newDate ? newDate.toISOString() : news.date,
              })
            }
            format="YYYY-MM-DD"
          />
        </LocalizationProvider>
        <TextField
          label="Title"
          value={news.title}
          onChange={(e) => onChange({ ...news, title: e.target.value })}
          fullWidth
          margin="normal"
        />
        <TextField
          label="Content"
          value={news.contents.join("\n")}
          onChange={(e) =>
            onChange({ ...news, contents: e.target.value.split("\n") })
          }
          fullWidth
          multiline
          rows={10}
          margin="normal"
        />
        <Button variant="contained" onClick={onSave}>
          保存
        </Button>
      </Box>
    </Modal>
  );
}
