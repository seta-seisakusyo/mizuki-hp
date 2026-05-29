import { Box, Button, Typography } from "@mui/material";
import Link from "next/link";

export default function Message02() {
  return (
    <Box sx={{ maxWidth: 800, mx: "auto" }}>
      <Typography variant="body1" sx={{ lineHeight: 2, mb: 3 }}>
        オンライン診療をご希望の方は、お気軽にお問い合わせください。
        <br />
        ご不明な点やご相談がございましたら、スタッフが丁寧にご案内いたします。
      </Typography>

      <Typography variant="h6" sx={{ fontWeight: "bold", color: "#1a1a1a", mb: 1 }}>
        情報通信機器を用いた診療について
      </Typography>
      <Typography variant="body1" sx={{ lineHeight: 1.8, mb: 1 }}>
        当院では情報通信機器を用いたオンライン診療を実施しております。
      </Typography>
      <Typography variant="body1" sx={{ lineHeight: 1.8, mb: 3 }}>
        なお、初診において向精神薬の処方は行っておりません。
      </Typography>

      <Box sx={{ textAlign: "center", mt: 3 }}>
        <Button
          component={Link}
          href="/contact"
          variant="contained"
          sx={{
            fontWeight: 700,
            fontSize: "1rem",
            px: 4,
            py: 1.5,
            borderRadius: 2,
          }}
        >
          お問い合わせページへ
        </Button>
      </Box>
    </Box>
  );
}
