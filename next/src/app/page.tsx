import { Box, Typography, Paper } from "@mui/material";
import React from "react";
import ClinicInfo from "./_home/ClinicInfo";
import ClinicInfoMainTitle from "./_home/ClinicInfoMainTitle";
import ConsultationOutline from "./_home/ConsultationOutline";
import ConsultationOutlineMainTitle from "./_home/ConsultationOutlineMainTitle";
import HeroTopSection from "./_home/HeroTopSection";
import MedicalHoursMainTitle from "./_home/MedicalHoursMainTitle";
import News from "./_home/News";
import NewsMainTitle from "./_home/NewsMainTitle";
import Reserve from "./_home/Reserve";
import ReserveMainTitle from "./_home/ReserveMainTitle";
import Message01 from "./consultation/Message01";

const HomePageContent: React.FC = () => {
  return (
    <Box>

      {/* トップセクション */}
      <HeroTopSection></HeroTopSection>

      {/* ご来院の皆様へ */}
      <Box sx={{ display: "flex", justifyContent: "center", px: 2, mt: 4, mb: 2 }}>
        <Paper
          elevation={0}
          sx={{
            maxWidth: 800,
            width: "100%",
            border: "2px solid #c62828",
            borderRadius: 2,
            p: 3,
          }}
        >
          <Typography
            variant="h6"
            sx={{ fontWeight: 700, color: "#c62828", mb: 1.5, textAlign: "center" }}
          >
            ご来院の皆様へ
          </Typography>
          <Typography variant="body1" sx={{ lineHeight: 1.8 }}>
            ※発熱外来においては、受診歴の有無に関わらず、発熱その他感染症を疑わせるような症状を呈する患者さんの受入れを行っております。感染防止対策として、発熱患者さんの動線を分ける対応を行っております。
          </Typography>
        </Paper>
      </Box>

      {/* お知らせセクション */}
      <NewsMainTitle></NewsMainTitle>
      <News></News>

      {/* 基本情報セクション */}
      <ClinicInfoMainTitle></ClinicInfoMainTitle>
      <ClinicInfo></ClinicInfo>

      {/* 診療案内セクション */}
      <ConsultationOutlineMainTitle></ConsultationOutlineMainTitle>
      <ConsultationOutline></ConsultationOutline>

      {/* 診療時間セクション */}
      <MedicalHoursMainTitle></MedicalHoursMainTitle>
      <Message01></Message01>

      {/* 人間ドック予約セクション */}
      <ReserveMainTitle></ReserveMainTitle>
      <Reserve></Reserve>

      {/* セクションの下にスペース */}
      <Box sx={{ height: "200px" }} />

    </Box>
  );
};

export default HomePageContent;
