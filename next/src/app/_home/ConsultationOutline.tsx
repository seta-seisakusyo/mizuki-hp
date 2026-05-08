"use client";

import { Box, Grid } from "@mui/material";
import Link from "next/link";
import React from "react";

// 診療内容データ
const contents = [
    {
        title: "診療案内",
        color: "#42a5f5",
        image: "/description/description5.png",
        link: "/consultation",
    },
    {
        title: "内視鏡検査",
        color: "#009688",
        image: "/endoscopy/endoscopy2.png",
        link: "/endoscopy",
    },
    {
        title: "在宅医療",
        color: "#ec407a",
        image: "/online/online3.png",
        link: "/home-medical-care",
    },
    {
        title: "ワクチン接種",
        color: "#26a69a",
        image: "/beauty/beauty1.png",
        link: "/vaccine",
    },
];

const ConsultationOutline: React.FC = () => {
    return (
        <Box sx={{ py: 0, px: { xs: 2, md: 8 }, textAlign: "center" }}>
            {/* カードエリア */}
            <Box
                sx={{
                    width: "100%",
                    maxWidth: "950px", // ★ 幅を少し狭めて中央に
                    mx: "auto", // ★ 中央寄せ
                }}
            >
                <Grid
                    container
                    spacing={3}
                    justifyContent="center" // ★ グリッドを中央寄せ
                    alignItems="stretch"
                >
                    {contents.map((item, index) => (
                        <Grid
                            item
                            xs={12}
                            sm={6}
                            md={3}
                            key={index}
                            sx={{ display: "flex", justifyContent: "center" }}
                        >
                            <Link href={item.link} style={{ textDecoration: "none" }}>
                                <Box
                                    sx={{
                                        width: 200, // ★ 各カードの幅を固定
                                        borderRadius: 2,
                                        overflow: "hidden",
                                        boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
                                        transition: "transform 0.3s, box-shadow 0.3s",
                                        "&:hover": {
                                            transform: "translateY(-5px)",
                                            boxShadow: "0 8px 20px rgba(0,0,0,0.2)",
                                        },
                                        backgroundColor: "#fff",
                                        textAlign: "center",
                                    }}
                                >
                                    {/* ヘッダー */}
                                    <Box
                                        sx={{
                                            backgroundColor: item.color,
                                            color: "#fff",
                                            py: 1.5,
                                            fontWeight: "bold",
                                            fontSize: "1.1rem",
                                        }}
                                    >
                                        {item.title}
                                    </Box>

                                    {/* 画像部分 */}
                                    <Box
                                        component="img"
                                        src={item.image}
                                        alt={item.title}
                                        sx={{
                                            width: "80%",       // ← 少し縮小（カード幅の80%）
                                            height: "130px",     // ← 自動高さに変更
                                            mx: "auto",         // ← 中央寄せ
                                            my: 2,              // ← 上下に余白
                                            display: "block",
                                            objectFit: "contain" // ← トリミングしない
                                        }}
                                    />
                                </Box>
                            </Link>
                        </Grid>
                    ))}
                </Grid>
            </Box>
        </Box>
    );
};

export default ConsultationOutline;
