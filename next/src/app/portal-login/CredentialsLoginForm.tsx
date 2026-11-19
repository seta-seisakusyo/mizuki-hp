"use client";

import React, { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoginSchema } from "@/lib/validation";
import {
  TextField,
  Button,
  Box,
  InputAdornment,
  IconButton,
  Alert,
} from "@mui/material";
import {
  Email as EmailIcon,
  Lock as LockIcon,
  PhonelinkLock as PhonelinkLockIcon,
  Visibility,
  VisibilityOff,
} from "@mui/icons-material";
import { login } from "@/actions/login";

type LoginFormValues = {
  email: string;
  password: string;
  code?: string;
};

export default function CredentialsLoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [otpRequired, setOtpRequired] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(LoginSchema),
  });

  const handleClickShowPassword = () => setShowPassword(!showPassword);

  const onSubmit = async (data: LoginFormValues) => {
    setErrorMessage(null);
    try {
      const result = await login(data);
      if (result.success) {
        window.location.href = "/portal-admin";
      } else if (result.otpRequired) {
        setOtpRequired(true);
        setErrorMessage(result.messages?.[0] ?? null);
      } else {
        setErrorMessage(result.messages?.[0] || "ログインに失敗しました。");
      }
    } catch {
      setErrorMessage("ログイン中にエラーが発生しました。もう一度お試しください。");
    }
  };

  return (
    <Box
      width="100%"
      maxWidth={400}
      sx={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}
      component="form"
      onSubmit={handleSubmit(onSubmit)}
    >
      {errorMessage && (
        <Alert severity="error" sx={{ mb: 1 }}>
          {errorMessage}
        </Alert>
      )}

      <Controller
        name="email"
        control={control}
        defaultValue=""
        render={({ field }) => (
          <TextField
            {...field}
            label="メールアドレス"
            placeholder="example@email.com"
            fullWidth
            error={!!errors.email}
            helperText={errors.email?.message}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <EmailIcon color="action" />
                </InputAdornment>
              ),
            }}
          />
        )}
      />

      <Controller
        name="password"
        control={control}
        defaultValue=""
        render={({ field }) => (
          <TextField
            {...field}
            label="パスワード"
            placeholder="パスワードを入力"
            type={showPassword ? "text" : "password"}
            fullWidth
            error={!!errors.password}
            helperText={errors.password?.message}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LockIcon color="action" />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="パスワードの表示切替"
                    onClick={handleClickShowPassword}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        )}
      />

      {otpRequired && (
        <Controller
          name="code"
          control={control}
          defaultValue=""
          render={({ field }) => (
            <TextField
              {...field}
              label="確認コード"
              placeholder="認証アプリの6桁の数字"
              autoFocus
              fullWidth
              helperText="認証アプリに表示されている6桁の確認コードを入力してください。"
              inputProps={{ inputMode: "numeric", autoComplete: "one-time-code", maxLength: 8 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PhonelinkLockIcon color="action" />
                  </InputAdornment>
                ),
              }}
            />
          )}
        />
      )}

      <Button
        type="submit"
        variant="contained"
        fullWidth
        sx={{
          height: 50,
          fontSize: "1rem",
          fontWeight: 600,
          mt: 1,
          borderRadius: 2,
          boxShadow: "0 4px 12px rgba(25, 118, 210, 0.3)",
          "&:hover": {
            boxShadow: "0 6px 16px rgba(25, 118, 210, 0.4)",
          },
        }}
        disabled={isSubmitting}
      >
        {isSubmitting ? "ログイン中..." : "ログイン"}
      </Button>
    </Box>
  );
}
