"use client";

import BaseContainer from "@/components/BaseContainer";
import { validateInquiry } from "@/lib/validation";
import {
  CheckCircle,
  Error,
  Phone,
  LocationOn,
  Send,
} from "@mui/icons-material";
import {
  Box,
  Button,
  CircularProgress,
  Divider,
  Modal,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import axios from "axios";
import Script from "next/script";
import { useCallback, useRef, useState } from "react";

declare global {
  interface Window {
    grecaptcha: {
      ready: (cb: () => void) => void;
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
    };
  }
}

interface FormErrors {
  name?: string;
  email?: string;
  phone?: string;
  inquiry?: string;
  company?: string;
}

interface ContactFormProps {
  recaptchaSiteKey: string;
}

export default function ContactForm({ recaptchaSiteKey }: ContactFormProps) {
  const nameRef = useRef<HTMLInputElement>(null);
  const companyRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const inquiryRef = useRef<HTMLTextAreaElement>(null);

  const [errors, setErrors] = useState<FormErrors>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState<
    "loading" | "success" | "error"
  >("loading");

  const closeModal = () => setIsModalOpen(false);

  const handleChange = (field: keyof FormErrors) => {
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    const formData = {
      name: nameRef.current?.value || "",
      company: companyRef.current?.value || "",
      email: emailRef.current?.value || "",
      phone: phoneRef.current?.value || "",
      inquiry: inquiryRef.current?.value || "",
      token: "",
    };

    const validationErrors = validateInquiry(formData);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setIsModalOpen(true);
    setModalContent("loading");

    try {
      // reCAPTCHA v3 トークン取得＆検証
      if (recaptchaSiteKey) {
        if (!window.grecaptcha) {
          setModalContent("error");
          return;
        }

        const token = await new Promise<string>((resolve) => {
          window.grecaptcha.ready(async () => {
            const value = await window.grecaptcha.execute(recaptchaSiteKey, { action: "contact" });
            resolve(value);
          });
        });

        formData.token = token;
      }

      const emailRes = await axios.post("/api/email", formData);

      if (emailRes.data.success) {
        setModalContent("success");
        if (nameRef.current) nameRef.current.value = "";
        if (companyRef.current) companyRef.current.value = "";
        if (emailRef.current) emailRef.current.value = "";
        if (phoneRef.current) phoneRef.current.value = "";
        if (inquiryRef.current) inquiryRef.current.value = "";
      } else {
        setModalContent("error");
      }
    } catch (error) {
      console.error("送信エラー:", error);
      setModalContent("error");
    }
  }, [recaptchaSiteKey]);

  return (
    <BaseContainer>
      {recaptchaSiteKey && (
        <Script
          src={`https://www.google.com/recaptcha/api.js?render=${recaptchaSiteKey}`}
          strategy="lazyOnload"
        />
      )}

      {/* クリニック情報セクション */}
      <Box
        sx={{
          maxWidth: 640,
          mx: "auto",
          mb: 5,
          textAlign: "center",
        }}
      >
        <Typography
          variant="body1"
          sx={{ color: "text.secondary", lineHeight: 2, mb: 4, textAlign: "left" }}
        >
          ご質問・ご相談のある方はお気軽にお問い合わせください。
          <br />
          お電話またはフォームにて受け付けております。
        </Typography>

        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            gap: { xs: 2, sm: 4 },
            justifyContent: "center",
            alignItems: "center",
            mb: 2,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Phone sx={{ color: "#2a7d8f", fontSize: 20 }} />
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              076-255-0337
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <LocationOn sx={{ color: "#2a7d8f", fontSize: 20 }} />
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              石川県金沢市みずき1丁目3-5
            </Typography>
          </Box>
        </Box>
      </Box>

      <Divider sx={{ maxWidth: 640, mx: "auto", mb: 5 }} />

      {/* フォームセクション */}
      <Paper
        component="form"
        onSubmit={handleSubmit}
        elevation={0}
        sx={{
          maxWidth: 640,
          mx: "auto",
          p: { xs: 3, sm: 5 },
          borderRadius: 3,
          border: "1px solid",
          borderColor: "divider",
          backgroundColor: "#fafffe",
        }}
      >
        <Typography
          variant="subtitle1"
          sx={{
            fontWeight: 700,
            mb: 3,
            color: "#2a7d8f",
            textAlign: "center",
          }}
        >
          お問い合わせフォーム
        </Typography>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
          <TextField
            inputRef={nameRef}
            label="お名前"
            name="name"
            required
            error={Boolean(errors.name)}
            helperText={errors.name}
            onChange={() => handleChange("name")}
            fullWidth
            size="small"
            sx={fieldStyle}
          />
          <TextField
            inputRef={emailRef}
            label="メールアドレス"
            name="email"
            required
            error={Boolean(errors.email)}
            helperText={errors.email}
            onChange={() => handleChange("email")}
            fullWidth
            size="small"
            sx={fieldStyle}
          />
          <TextField
            inputRef={phoneRef}
            label="電話番号"
            name="phone"
            error={Boolean(errors.phone)}
            helperText={errors.phone}
            onChange={() => handleChange("phone")}
            fullWidth
            size="small"
            sx={fieldStyle}
          />
          <TextField
            inputRef={inquiryRef}
            label="お問い合わせ内容"
            name="inquiry"
            required
            error={Boolean(errors.inquiry)}
            helperText={errors.inquiry}
            onChange={() => handleChange("inquiry")}
            fullWidth
            multiline
            rows={5}
            sx={fieldStyle}
          />
        </Box>

        <Box sx={{ mt: 4, textAlign: "center" }}>
          <Button
            type="submit"
            variant="contained"
            endIcon={<Send sx={{ fontSize: 18 }} />}
            sx={{
              backgroundColor: "#2a7d8f",
              color: "#fff",
              px: 5,
              py: 1.2,
              fontWeight: 600,
              borderRadius: 2,
              textTransform: "none",
              fontSize: "0.95rem",
              boxShadow: "0 2px 8px rgba(42,125,143,0.3)",
              "&:hover": {
                backgroundColor: "#1f6272",
                boxShadow: "0 4px 12px rgba(42,125,143,0.4)",
              },
            }}
          >
            送信する
          </Button>
        </Box>

      </Paper>

      {/* モーダル */}
      <Modal open={isModalOpen} onClose={closeModal}>
        <Paper
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: { xs: 280, sm: 340 },
            p: 4,
            textAlign: "center",
            borderRadius: 3,
          }}
        >
          {modalContent === "loading" && (
            <>
              <CircularProgress sx={{ color: "#2a7d8f" }} />
              <Typography sx={{ mt: 2, color: "text.secondary" }}>
                送信中...
              </Typography>
            </>
          )}
          {modalContent === "success" && (
            <>
              <CheckCircle sx={{ color: "#4caf50", fontSize: 56 }} />
              <Typography sx={{ mt: 2, fontWeight: 600 }}>
                送信完了
              </Typography>
              <Typography variant="body2" sx={{ mt: 1, color: "text.secondary" }}>
                お問い合わせいただき、ありがとうございます。
                <br />
                担当者よりご連絡いたします。
              </Typography>
              <Button
                onClick={closeModal}
                variant="outlined"
                sx={{
                  mt: 3,
                  borderColor: "#2a7d8f",
                  color: "#2a7d8f",
                  "&:hover": { borderColor: "#1f6272", backgroundColor: "#f0f9fb" },
                }}
              >
                閉じる
              </Button>
            </>
          )}
          {modalContent === "error" && (
            <>
              <Error sx={{ color: "#e53935", fontSize: 56 }} />
              <Typography sx={{ mt: 2, fontWeight: 600, color: "#e53935" }}>
                送信に失敗しました
              </Typography>
              <Typography variant="body2" sx={{ mt: 1, color: "text.secondary" }}>
                お手数ですが、お電話にてお問い合わせください。
              </Typography>
              <Button
                onClick={closeModal}
                variant="outlined"
                sx={{
                  mt: 3,
                  borderColor: "#e53935",
                  color: "#e53935",
                  "&:hover": { borderColor: "#c62828", backgroundColor: "#fff5f5" },
                }}
              >
                閉じる
              </Button>
            </>
          )}
        </Paper>
      </Modal>
    </BaseContainer>
  );
}

const fieldStyle = {
  "& .MuiOutlinedInput-root": {
    borderRadius: 2,
    backgroundColor: "#fff",
    "&:hover .MuiOutlinedInput-notchedOutline": {
      borderColor: "#2a7d8f",
    },
    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
      borderColor: "#2a7d8f",
    },
  },
  "& .MuiInputLabel-root.Mui-focused": {
    color: "#2a7d8f",
  },
};
