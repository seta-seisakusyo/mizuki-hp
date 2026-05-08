import { Box, List, ListItem, Typography } from "@mui/material";

export default function Message02() {
  return (
    <Box sx={{ maxWidth: 800, mx: "auto" }}>
      <Typography variant="body1" sx={{ lineHeight: 1.8, mb: 1 }}>
        当院ではハートネットホスピタルに参加しています。
      </Typography>
      <List sx={{ listStyleType: "disc", pl: 4 }}>
        <ListItem sx={{ display: "list-item", py: 0.5, lineHeight: 1.8 }}>
          医療情報連携とは病院と診療所、医師とコメディカルがスムーズに連携するための
          患者情報共有システムのことで、施設間で患者さんの情報を共有することにより
          質の高い医療及び介護の提供を目的としています。
        </ListItem>
      </List>
    </Box>
  );
}
