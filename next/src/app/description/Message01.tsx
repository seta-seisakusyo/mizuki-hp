import { Box, Typography } from "@mui/material";

export default function InspectionMessage() {
  return (
    <Box sx={{ maxWidth: 800, mx: "auto", lineHeight: 1.8 }}>
      {/* 胃・大腸内視鏡検査 */}
      <Typography variant="h6" sx={{ fontWeight: "bold", color: "#1a1a1a", mb: 1 }}>
        胃・大腸内視鏡検査
      </Typography>
      <Typography variant="body1" sx={{ mb: 3 }}>
        普段お忙しくて検査の出来ない方に、
        <Typography component="span" sx={{ color: "#d32f2f", fontWeight: "bold" }}>
          土曜日
        </Typography>
        にも内視鏡検査・手術を行っております。
      </Typography>

      {/* 超音波検査 */}
      <Typography variant="h6" sx={{ fontWeight: "bold", color: "#1a1a1a", mb: 1 }}>
        超音波検査
      </Typography>
      <Typography variant="body1" sx={{ mb: 3 }}>
        <Typography component="span" sx={{ color: "#d32f2f", fontWeight: "bold" }}>
          腹部、頚部、甲状腺、乳腺
        </Typography>
        のエコー検査を行っております。
      </Typography>

      {/* 心電図・レントゲン検査 */}
      <Typography variant="h6" sx={{ fontWeight: "bold", color: "#1a1a1a", mb: 1 }}>
        心電図・レントゲン検査
      </Typography>
      <Typography variant="body1">
        <Typography component="span" sx={{ color: "#d32f2f", fontWeight: "bold" }}>
          人間ドック・検診
        </Typography>
        としての検査を行っております。
      </Typography>
    </Box>
  );
}
