export type IndicatorGuide = {
  id: string;
  title: string;
  family: "모멘텀" | "추세" | "복합신호";
  imageSrc: string;
  summary: string;
  keyword: string;
  idea: string;
};

export const indicatorGuides: IndicatorGuide[] = [
  {
    id: "stochastic",
    title: "스토캐스틱",
    family: "모멘텀",
    imageSrc: "/indicator-guides/stochastic.png",
    summary: "과매수·과매도와 K/D 교차를 빠르게 이해하는 기본 모멘텀 카드입니다.",
    keyword: "스토캐스틱",
    idea: "스토캐스틱이 과매도권에서 K선이 D선을 상향 돌파할 때 관찰하고 싶어.",
  },
  {
    id: "rsi",
    title: "RSI",
    family: "모멘텀",
    imageSrc: "/indicator-guides/rsi.png",
    summary: "RSI와 다이버전스를 함께 보며 반등과 추세 전환 가능성을 읽는 카드입니다.",
    keyword: "RSI",
    idea: "RSI가 30 아래에서 반등하고 다이버전스가 보일 때 관찰하고 싶어.",
  },
  {
    id: "psar",
    title: "PSAR",
    family: "추세",
    imageSrc: "/indicator-guides/psar.png",
    summary: "점의 위치만으로 상승·하락 추세와 전환 가능성을 빠르게 확인하는 카드입니다.",
    keyword: "추세",
    idea: "PSAR 점이 캔들 아래로 바뀌며 추세 전환이 보일 때 관찰하고 싶어.",
  },
  {
    id: "myc",
    title: "MYC Indicator",
    family: "복합신호",
    imageSrc: "/indicator-guides/myc.png",
    summary: "스토캐스틱, RSI, PSAR를 같이 보며 신호 신뢰도를 높이는 복합 카드입니다.",
    keyword: "복합신호",
    idea: "스토캐스틱, RSI, PSAR가 같은 방향일 때만 진입 후보로 보고 싶어.",
  },
];
