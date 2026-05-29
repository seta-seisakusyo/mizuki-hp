import { Box, List, ListItem, Typography } from "@mui/material";

export default function Message01() {
  return (
    <Box sx={{ maxWidth: 800, mx: "auto" }}>
      <Typography variant="body1" sx={{ lineHeight: 1.8, mb: 3 }}>
        かかりつけ医として、ご納得いただくまで対応いたします。ご質問にもお答えいたします。
      </Typography>

      <Typography variant="h6" sx={{ fontWeight: "bold", color: "#1a1a1a", mb: 1 }}>
        生活習慣病管理料について
      </Typography>
      <Typography variant="body1" sx={{ lineHeight: 1.8, mb: 1 }}>
        高血圧症、脂質異常症、糖尿病の患者様について、療養計画書を作成し、総合的な治療管理を行っております。
      </Typography>
      <Typography variant="body1" sx={{ lineHeight: 1.8, mb: 1 }}>
        患者様の状態に応じ、以下について継続的に管理を行います。
      </Typography>
      <List sx={{ listStyleType: "disc", pl: 4, py: 0 }}>
        {[
          "血圧",
          "体重",
          "食事",
          "運動",
          "喫煙",
          "服薬状況",
        ].map((item) => (
          <ListItem key={item} sx={{ display: "list-item", py: 0.3, lineHeight: 1.8 }}>
            {item}
          </ListItem>
        ))}
      </List>
    </Box>
  );
}
