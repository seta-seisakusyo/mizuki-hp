"use client";

import React from "react";
import ProfileConsoleModal from "@/components/ProfileConsoleModal";
import { useSimpleBar } from "@/components/SimpleBarWrapper";
import MenuIcon from "@mui/icons-material/Menu";
import {
  AppBar,
  Box,
  Button,
  Container,
  IconButton,
  Menu,
  MenuItem,
  Toolbar,
  Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import { SessionProvider, useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

function StaffLoginLink({ scrolled, variant, onMenuClose }: { scrolled?: boolean; variant: "desktop" | "mobile"; onMenuClose?: () => void }) {
  const { status } = useSession();
  if (status === "authenticated") return null;

  if (variant === "mobile") {
    return (
      <MenuItem onClick={onMenuClose}>
        <Link href="/portal-login" passHref style={{ textDecoration: "none", color: "inherit", width: "100%" }}>
          <Typography variant="body2" color="text.secondary">スタッフログイン</Typography>
        </Link>
      </MenuItem>
    );
  }

  return (
    <Link href="/portal-login" passHref>
      <Button
        sx={{
          color: "text.secondary",
          "&:hover": { backgroundColor: "rgba(0,0,0,0.04)" },
          fontSize: { xs: "10px", md: "11px" },
          padding: { xs: "0.3rem 0.4rem", md: "0.3rem 0.6rem" },
          lineHeight: 1.2,
          textAlign: "center",
        }}
      >
        スタッフ<br />ログイン
      </Button>
    </Link>
  );
}

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const theme = useTheme();
  const isTablet = useMediaQuery(theme.breakpoints.down("md"));
  const { scrollContainerRef } = useSimpleBar();

  const handleScroll = useCallback(() => {
    const scrollContainer = scrollContainerRef.current;
    if (scrollContainer) {
      setScrolled(scrollContainer.scrollTop > 200);
    }
  }, [scrollContainerRef]);

  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    scrollContainer.addEventListener("scroll", handleScroll);
    return () => scrollContainer.removeEventListener("scroll", handleScroll);
  }, [scrollContainerRef, handleScroll]);

  const handleMenuOpen = useCallback((event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  }, []);

  const handleMenuClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  const contentsList = [
    { title: "クリニック概要", href: "/description" },
    { title: "診療案内", href: "/consultation" },
    { title: "内視鏡検査", href: "/endoscopy" },
    { title: "在宅医療", href: "/home-medical-care" },
    { title: "ワクチン接種", href: "/vaccine" },
    { title: "医師紹介", href: "/doctor" },
    { title: "アクセス", href: "/access" },
    { title: "お問い合わせ", href: "/contact" },
    { title: "オンライン診療", href: "/online" },
    { title: "院長俳句展", href: "/blog" },
  ];

  return (
    <>
      <AppBar
        position="fixed"
        sx={{
          backgroundColor: "#fff",
          boxShadow: "0px 2px 5px rgba(0,0,0,0.1)",
        }}
      >
        <Toolbar
          disableGutters
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            minHeight: { xs: 56, md: 64 },
            px: { xs: 1, md: 2 },
          }}
        >
          {/* 左側ロゴ */}
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Link
              href="/"
              passHref
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <Box display="flex" alignItems="center">
                <Image
                  src="/mizuki_logo_transparent.jpg"
                  alt="みずきクリニックロゴ"
                  height={isTablet ? 30 : 40}
                  width={isTablet ? 30 : 40}
                />
                <Typography
                  variant="h6"
                  sx={{
                    ml: 1,
                    fontSize: { xs: "18px", md: "24px" },
                    color: "text.primary",
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                  }}
                >
                  みずきクリニック
                </Typography>
              </Box>
            </Link>
          </Box>

          {/* 右側：PC⇔タブレット/モバイル切り替え */}
          <SessionProvider>
          {isTablet ? (
            <>
              {/* ハンバーガーアイコン */}
              <IconButton
                edge="start"
                color="inherit"
                aria-label="menu"
                onClick={handleMenuOpen}
              >
                <MenuIcon sx={{ color: "text.primary" }} />
              </IconButton>

              <ProfileConsoleModal />

              {/* ドロップダウンメニュー */}
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                sx={{
                  mt: 1,
                }}
              >
                {contentsList.map((content) => (
                  <MenuItem key={content.href} onClick={handleMenuClose}>
                    <Link
                      href={content.href}
                      passHref
                      style={{
                        textDecoration: "none",
                        color: "inherit",
                        width: "100%",
                      }}
                    >
                      <Typography variant="body1">{content.title}</Typography>
                    </Link>
                  </MenuItem>
                ))}
                <StaffLoginLink variant="mobile" onMenuClose={handleMenuClose} />
              </Menu>
            </>
          ) : (
            <>
              <Container
                maxWidth="lg"
                sx={{
                  display: "flex",
                  justifyContent: "flex-end",
                  alignItems: "center",
                  gap: 0,
                  flexWrap: "nowrap",
                }}
              >
                {contentsList.map((content) => (
                  <Link key={content.href} href={content.href} passHref>
                    <Button
                      sx={{
                        color: "text.primary",
                        "&:hover": {
                          backgroundColor: "rgba(0,0,0,0.04)",
                        },
                        fontSize: { xs: "11px", md: "13px" },
                        padding: { xs: "0.4rem 0.3rem", md: "0.4rem 0.5rem" },
                        whiteSpace: "nowrap",
                        minWidth: "auto",
                      }}
                    >
                      {content.title}
                    </Button>
                  </Link>
                ))}
                <StaffLoginLink variant="desktop" scrolled={scrolled} />
                <ProfileConsoleModal />
              </Container>
            </>
          )}
          </SessionProvider>
        </Toolbar>
      </AppBar>

      {/* ヘッダー分の高さを確保 */}
      <Box sx={{ ...theme.mixins.toolbar }} />
    </>
  );
}
