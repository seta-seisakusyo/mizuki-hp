import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  List,
  ListItem,
  Typography,
} from "@mui/material";

const noticeItems = [
  {
    title: "医療DX推進体制整備加算について",
    paragraphs: [
      "当院では、質の高い診療を実施するため、医療DXを推進し、以下の体制を整備しております。",
    ],
    bullets: [
      "オンライン資格確認等システムにより取得した診療情報等を活用して診療を実施しています。",
      "マイナ保険証の利用を促進しております。",
      "電子処方箋の発行体制を整備しています。",
      "電子カルテ情報共有サービスを活用できる体制について整備を進めています。",
      "医療DX推進体制整備加算を算定しております。",
    ],
  },
  {
    title: "医療情報取得加算について",
    paragraphs: [
      "当院ではオンライン資格確認を行う体制を有しており、患者様の受診歴、薬剤情報、特定健診情報その他必要な診療情報を取得・活用して診療を行っております。",
    ],
  },
  {
    title: "明細書発行体制等加算について",
    paragraphs: [
      "当院では医療の透明化および患者様への情報提供を推進する観点から、領収書発行の際に個別の診療報酬算定項目が分かる明細書を無料で発行しております。",
      "明細書の発行を希望されない場合は、受付までお申し出ください。",
    ],
  },
  {
    title: "外来感染対策向上加算について",
    paragraphs: ["当院では院内感染防止対策として、以下の取り組みを実施しております。"],
    bullets: [
      "感染管理者を配置しています。",
      "標準感染予防策に基づいた院内感染対策を実施しています。",
      "感染対策マニュアルを整備しています。",
      "定期的に感染対策研修を実施しています。",
      "発熱患者様等の動線分離を行っています。",
      "地域の医療機関・医師会と感染対策連携を行っています。",
    ],
  },
  {
    title: "発熱患者等対応加算について",
    paragraphs: [
      "当院では、受診歴の有無にかかわらず、発熱その他感染症を疑わせる症状を呈する患者様の受け入れを行っております。",
      "感染防止対策として、時間的・空間的分離を行い診療しております。",
    ],
  },
  {
    title: "時間外対応加算について",
    paragraphs: [
      "当院では継続的に受診されている患者様からの電話等による問い合わせに対し、診療時間外にも対応できる体制を整えております。",
      "※時間外対応加算は、再診料を算定する患者様が対象となります。",
    ],
  },
  {
    title: "ベースアップ評価料について",
    paragraphs: [
      "当院では医療従事者の処遇改善を目的としてベースアップ評価料を算定しております。",
      "これにより職員の賃上げを実施し、安心・安全な医療提供体制の維持に努めています。",
    ],
  },
];

export default function MedicalFeeNoticeMessage() {
  return (
    <Box sx={{ maxWidth: 960, mx: "auto" }}>
      <Box sx={{ mb: { xs: 3, sm: 4 } }}>
        <Typography variant="body1" sx={{ lineHeight: 1.8, mb: 1, fontWeight: 600 }}>
          患者の皆様へ
        </Typography>
        <List sx={{ listStyleType: "disc", pl: 3, py: 0 }}>
          <ListItem sx={{ display: "list-item", py: 0.35, lineHeight: 1.8 }}>
            当院はマイナンバーカードによるオンライン資格確認を行なっています。
          </ListItem>
          <ListItem sx={{ display: "list-item", py: 0.35, lineHeight: 1.8 }}>
            オンライン資格確認により診療情報を取得・活用し、質の高い医療の提供に努めています
          </ListItem>
          <ListItem sx={{ display: "list-item", py: 0.35, lineHeight: 1.8 }}>
            正確な情報を取得するために・活用するために、マイナ保険証の利用にご協力をお願い致します。
          </ListItem>
        </List>
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" },
          gap: { xs: 2, sm: 2.5 },
        }}
      >
        {noticeItems.map((item) => (
          <Accordion
            key={item.title}
            disableGutters
            elevation={0}
            sx={{
              "&:before": { display: "none" },
              alignSelf: "start",
              overflow: "hidden",
              border: "1px solid #dfe9e5",
              borderTop: "4px solid #2a7d8f",
              borderRadius: 2,
              bgcolor: "#fff",
              boxShadow: "0 8px 20px rgba(42, 125, 143, 0.08)",
              minWidth: 0,
            }}
          >
            <AccordionSummary
              expandIcon={<ExpandMoreIcon sx={{ color: "#2a7d8f" }} />}
              sx={{
                minHeight: 72,
                px: { xs: 2, sm: 2.5 },
                py: 1,
                "& .MuiAccordionSummary-content": {
                  my: 1,
                  minWidth: 0,
                },
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  fontSize: { xs: "1rem", sm: "1.05rem" },
                  fontWeight: "bold",
                  color: "#1a1a1a",
                  lineHeight: 1.55,
                }}
              >
                {item.title}
              </Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ px: { xs: 2, sm: 2.5 }, pt: 0, pb: { xs: 2, sm: 2.5 } }}>
              {item.paragraphs.map((paragraph) => (
                <Typography
                  key={paragraph}
                  variant="body2"
                  sx={{ color: "text.secondary", lineHeight: 1.8, mb: 1 }}
                >
                  {paragraph}
                </Typography>
              ))}
              {item.bullets && (
                <List sx={{ listStyleType: "disc", pl: 3, py: 0, mt: 0.5 }}>
                  {item.bullets.map((bullet) => (
                    <ListItem
                      key={bullet}
                      sx={{
                        display: "list-item",
                        color: "text.secondary",
                        fontSize: "0.875rem",
                        lineHeight: 1.75,
                        py: 0.2,
                        pl: 0,
                      }}
                    >
                      {bullet}
                    </ListItem>
                  ))}
                </List>
              )}
            </AccordionDetails>
          </Accordion>
        ))}
      </Box>
    </Box>
  );
}
