import { Box, Typography } from "@mui/material";

export default function Message02() {
  return (
    <Box sx={{ maxWidth: 800, mx: "auto" }}>
      <Typography variant="h6" sx={{ fontWeight: 600, color: "#1a1a1a", mb: 1.5 }}>
        在宅医療とは？
      </Typography>
      <Typography variant="body1" sx={{ mb: 4, ml: 2, lineHeight: 1.8 }}>
        大切な家族の誰かが、病気になり通院できない場合に、病院でなく、自宅などで治療を
        行うことが在宅医療であり、通常病院で行われる入院医療や外来医療に次ぐ第3の医療として、
        多くの人に受け入れられるようになってきました。在宅医療は、医師をはじめ、歯科医師、
        訪問看護師、薬剤師、栄養士、理学療法士、ケアマネジャー、ホームヘルパーなど多くの方々が
        連携して定期的に患者さんのご自宅などを訪問し、チームとなって患者さんの治療やケアを24時間対応で行っていく医療活動です。
      </Typography>

      <Typography variant="h6" sx={{ fontWeight: 600, color: "#1a1a1a", mb: 1.5 }}>
        訪問診療と往診の違いは？
      </Typography>
      <Typography variant="body1" sx={{ mb: 4, ml: 2, lineHeight: 1.8 }}>
        往診とは、患者さん、ご家族からの要請で予定以外で訪問診療することをいいます。
        これに対して、在宅医療を行なう患者さんで、疾病や傷病のため通院が困難な方に対し、
        医師があらかじめ診療の計画を立て、患者さんの同意を得て定期的に（1か月に1回あるいは2回など）
        患者さんの自宅などに赴いて行なう診療が「訪問診療」です。
      </Typography>

      <Typography variant="h6" sx={{ fontWeight: 600, color: "#1a1a1a", mb: 1.5 }}>
        在宅医療の医療費は？
      </Typography>
      <Typography variant="body1" sx={{ mb: 4, ml: 2, lineHeight: 1.8 }}>
        在宅医療（訪問診療）の費用は、月2回の定期診療で1割負担の場合、約7,000円〜8,000円程度、3割負担で約20,000円〜24,000円程度が目安です。これに薬代、訪問看護費、介護保険サービス料が別途加算されます。緊急往診や介護度、居住形態（一戸建てか集合住宅か）により費用は変動します。
      </Typography>

      <Typography variant="h6" sx={{ fontWeight: 600, color: "#1a1a1a", mb: 1.5 }}>
        高額療養費制度とは？
      </Typography>
      <Typography variant="body1" sx={{ ml: 2, lineHeight: 1.8 }}>
        健康保険の毎月の自己負担金が一定以上になった場合、払い戻しが受けられます。
        上限額は、年齢や所得、利用している健康保険の種類によっても異なりますので、
        詳しくは、健康保険証に記載された問い合わせ先（保険者）に確認してください。
        この払い戻しについては、自主的に申請することが必要です。
      </Typography>
    </Box>
  );
}
