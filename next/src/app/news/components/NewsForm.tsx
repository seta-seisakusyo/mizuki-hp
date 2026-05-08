"use client";

import { Box, Button, TextField } from "@mui/material";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { Dayjs } from "dayjs";

interface NewsFormProps {
  title: string;
  content: string;
  occurrenceDate: Dayjs | null;
  onTitleChange: (value: string) => void;
  onContentChange: (value: string) => void;
  onDateChange: (date: Dayjs | null) => void;
  onSubmit: () => void;
}

export default function NewsForm({
  title,
  content,
  occurrenceDate,
  onTitleChange,
  onContentChange,
  onDateChange,
  onSubmit,
}: NewsFormProps) {
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
        position: "relative",
      }}
    >
      <Box>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <DatePicker
            label="日付を選択"
            value={occurrenceDate}
            onChange={onDateChange}
            format="YYYY-MM-DD"
          />
        </LocalizationProvider>
        <TextField
          label="Title"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          fullWidth
          margin="normal"
        />
        <TextField
          label="Content"
          value={content}
          onChange={(e) => onContentChange(e.target.value)}
          fullWidth
          multiline
          rows={4}
          margin="normal"
        />
        <Button variant="contained" sx={{ margin: "20px 0" }} onClick={onSubmit}>
          登録
        </Button>
      </Box>
    </Box>
  );
}
