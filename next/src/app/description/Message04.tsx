import { Box, List, ListItem, Typography } from "@mui/material";

export default function Message03() {
  return (
    <Box sx={{ maxWidth: 800, mx: "auto" }}>
      <Typography variant="body1" sx={{ lineHeight: 1.8, mb: 2 }}>
        当クリニックは、下記医療機関と緊密な診療連携を結んでいますので、
        入院や精密な検査が必要な際には、適切なタイミングでのご紹介が可能です。
      </Typography>
      <List sx={{ listStyleType: "disc", pl: 4 }}>
        <ListItem sx={{ display: "list-item", py: 0.3 }}>
          金沢大学付属病院
        </ListItem>
        <ListItem sx={{ display: "list-item", py: 0.3 }}>
          金沢医科大学付属病院
        </ListItem>
        <ListItem sx={{ display: "list-item", py: 0.3 }}>
          石川県立中央病院
        </ListItem>
        <ListItem sx={{ display: "list-item", py: 0.3 }}>
          金沢医療センター
        </ListItem>
        <ListItem sx={{ display: "list-item", py: 0.3 }}>
          浅ノ川総合病院
        </ListItem>
        <ListItem sx={{ display: "list-item", py: 0.3 }}>
          JCHO金沢病院
        </ListItem>
        <ListItem sx={{ display: "list-item", py: 0.3 }}>
          石川県済生会金沢病院
        </ListItem>
        <ListItem sx={{ display: "list-item", py: 0.3 }}>
          金沢聖霊総合病院
        </ListItem>
      </List>
    </Box>
  );
}
