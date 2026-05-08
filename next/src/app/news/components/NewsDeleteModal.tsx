"use client";

import { Box, Button, Modal, Typography } from "@mui/material";

interface NewsDeleteModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function NewsDeleteModal({
  open,
  onClose,
  onConfirm,
}: NewsDeleteModalProps) {
  return (
    <Modal open={open} onClose={onClose}>
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
        <Button color="error" onClick={onConfirm}>
          削除
        </Button>
        <Button onClick={onClose}>キャンセル</Button>
      </Box>
    </Modal>
  );
}
