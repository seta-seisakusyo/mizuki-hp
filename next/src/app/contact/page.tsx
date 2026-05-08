import React from "react";
import ContactForm from "./ContactForm";
import ContactPageMainTitle from "./ContactPageMainTitle";
import { Box } from "@mui/material";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "お問い合わせ",
  description:
    "みずきクリニックへのお問い合わせはこちらから。診療に関するご質問やご相談をお気軽にお寄せください。",
};

export default function ContactPage() {
  const recaptchaSiteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || "";

  return (
    <Box
      sx={{
        backgroundSize: "contain",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <ContactPageMainTitle />
      <ContactForm recaptchaSiteKey={recaptchaSiteKey} />
    </Box>
  );
}
