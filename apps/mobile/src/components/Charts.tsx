import { useState } from "react";
import { View } from "react-native";
import Svg, { Circle, G, Line, Polyline, Rect, Text as SvgText } from "react-native-svg";
import { useTranslations } from "use-intl";
import { useTheme } from "@/theme/theme";
import { Button } from "./ui/Button";
import { Card } from "./ui/Card";
import { Txt, useFontFamily } from "./ui/Txt";

// Hand-built charts (mauve-charts): one y-axis labelled from the same scale as the marks, a recessive grid, the
// usual-range band and thresholds labelled in words, a one-line summary for screen readers, a tap that shows the
// exact value and date, and a table with the same numbers. Time always runs left to right, also in Arabic.

export interface Point {
  key: string;
  label: string; // the date, formatted
  value: number;
  /** What a tap shows, e.g. "Cycle starting 4 Nov: 56 days". */
  detail: string;
}

const H = 180;
const PAD = { top: 12, bottom: 26, start: 30, end: 10 };

/** At most about seven date labels fit on a phone; with more points, label every k-th one and always the last. */
export function showLabel(i: number, n: number): boolean {
  const every = Math.ceil(n / 7);
  return i === n - 1 || (i % every === 0 && n - 1 - i >= every);
}

function scaleFor(width: number, max: number, n: number) {
  const plotW = Math.max(width - PAD.start - PAD.end, 10);
  const plotH = H - PAD.top - PAD.bottom;
  const x = (i: number) => PAD.start + (n <= 1 ? plotW / 2 : (plotW * i) / (n - 1));
  const slot = n > 0 ? plotW / n : plotW;
  const xBar = (i: number) => PAD.start + slot * i + slot / 2;
  const y = (v: number) => PAD.top + plotH - (Math.min(v, max) / max) * plotH;
  return { x, xBar, y, slot, plotW };
}

function Axis({ width, max, ticks }: { width: number; max: number; ticks: number[] }) {
  const { c } = useTheme();
  const font = useFontFamily();
  const { y } = scaleFor(width, max, 1);
  return (
    <G>
      {ticks.map((t) => (
        <G key={t}>
          <Line x1={PAD.start} x2={width - PAD.end} y1={y(t)} y2={y(t)} stroke={c.rule} strokeWidth={1} />
          <SvgText x={PAD.start - 6} y={y(t) + 4} fontSize={10} fill={c.ink3} textAnchor="end" fontFamily={font(500)}>
            {String(t)}
          </SvgText>
        </G>
      ))}
    </G>
  );
}

function Frame({
  title,
  caption,
  summary,
  points,
  colLabel,
  children,
}: {
  title: string;
  caption: string;
  summary: string;
  points: Point[];
  colLabel: string;
  children: (width: number, select: (i: number) => void, selected: number | null) => React.ReactNode;
}) {
  const t = useTranslations("analytics");
  const m = useTranslations("mobile");
  const [width, setWidth] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [table, setTable] = useState(false);
  const sel = selected !== null ? points[selected] : undefined;
  return (
    <Card>
      <Txt variant="h2" accessibilityRole="header">
        {title}
      </Txt>
      <Txt variant="xs" color="ink2">
        {caption}
      </Txt>
      <View
        style={{ direction: "ltr" }}
        onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
        accessible
        accessibilityRole="image"
        accessibilityLabel={`${title}. ${summary}`}
      >
        {width > 0 && children(width, (i) => setSelected(i === selected ? null : i), selected)}
      </View>
      <Txt variant="small" weight={600} accessibilityLiveRegion="polite">
        {sel ? sel.detail : summary}
      </Txt>
      <Button label={table ? m("hideTable") : t("showTable")} kind="ghost" small onPress={() => setTable((v) => !v)} />
      {table &&
        points.map((p) => (
          <View key={p.key} style={{ flexDirection: "row", justifyContent: "space-between", gap: 8 }}>
            <Txt variant="small">{p.label}</Txt>
            <Txt variant="small" weight={700}>
              {`${p.value} ${colLabel}`}
            </Txt>
          </View>
        ))}
    </Card>
  );
}

/** Cycle length per cycle: a 2px plum line over the 21–35 day band (green, dashed edges, labelled). */
export function CycleLengthChart({ points, band, title, caption, summary, unit }: { points: Point[]; band: [number, number]; title: string; caption: string; summary: string; unit: string }) {
  const { c } = useTheme();
  const font = useFontFamily();
  const t = useTranslations("analytics");
  const max = Math.max(60, ...points.map((p) => p.value + 5));
  return (
    <Frame title={title} caption={caption} summary={summary} points={points} colLabel={unit}>
      {(width, select, selected) => {
        const s = scaleFor(width, max, points.length);
        return (
          <Svg width={width} height={H}>
            <Rect x={PAD.start} width={s.plotW} y={s.y(band[1])} height={s.y(band[0]) - s.y(band[1])} fill={c.okSoft} />
            <Line x1={PAD.start} x2={width - PAD.end} y1={s.y(band[0])} y2={s.y(band[0])} stroke={c.ok} strokeDasharray="4 4" />
            <Line x1={PAD.start} x2={width - PAD.end} y1={s.y(band[1])} y2={s.y(band[1])} stroke={c.ok} strokeDasharray="4 4" />
            <SvgText x={width - PAD.end - 4} y={s.y(band[1]) + 12} fontSize={10} fill={c.okText} textAnchor="end" fontFamily={font(700)}>
              {t("band")}
            </SvgText>
            <Axis width={width} max={max} ticks={[0, 20, 40, Math.round(max / 10) * 10]} />
            <Polyline points={points.map((p, i) => `${s.x(i)},${s.y(p.value)}`).join(" ")} fill="none" stroke={c.plum} strokeWidth={2} />
            {points.map((p, i) => (
              <G key={p.key} onPress={() => select(i)}>
                <Circle cx={s.x(i)} cy={s.y(p.value)} r={14} fill="transparent" />
                <Circle cx={s.x(i)} cy={s.y(p.value)} r={selected === i ? 6 : 4.5} fill={c.plum} stroke={c.sheet} strokeWidth={2} />
                {showLabel(i, points.length) && (
                  // The last point sits on the right edge: anchor its date at the edge so it is never clipped.
                  <SvgText
                    x={i === points.length - 1 && points.length > 1 ? width - 1 : s.x(i)}
                    y={H - 8}
                    fontSize={9.5}
                    fill={c.ink3}
                    textAnchor={i === points.length - 1 && points.length > 1 ? "end" : "middle"}
                    fontFamily={font(500)}
                  >
                    {p.label}
                  </SvgText>
                )}
              </G>
            ))}
          </Svg>
        );
      }}
    </Frame>
  );
}

/** Bars (pain 0–10, or bleeding score with the 100 threshold): magenta, 4px rounded ends. */
export function BarChart({
  points,
  max,
  ticks,
  threshold,
  title,
  caption,
  summary,
  unit,
}: {
  points: Point[];
  max: number;
  ticks: number[];
  threshold?: { value: number; label: string };
  title: string;
  caption: string;
  summary: string;
  unit: string;
}) {
  const { c } = useTheme();
  const font = useFontFamily();
  const top = Math.max(max, ...points.map((p) => p.value));
  return (
    <Frame title={title} caption={caption} summary={summary} points={points} colLabel={unit}>
      {(width, select, selected) => {
        const s = scaleFor(width, top, points.length);
        const bw = Math.min(22, s.slot * 0.6);
        return (
          <Svg width={width} height={H}>
            <Axis width={width} max={top} ticks={ticks} />
            {threshold && (
              <G>
                <Line x1={PAD.start} x2={width - PAD.end} y1={s.y(threshold.value)} y2={s.y(threshold.value)} stroke={c.warn} strokeDasharray="4 4" />
                <SvgText x={width - PAD.end - 4} y={s.y(threshold.value) - 4} fontSize={10} fill={c.warnText} textAnchor="end" fontFamily={font(700)}>
                  {threshold.label}
                </SvgText>
              </G>
            )}
            {points.map((p, i) => {
              const yTop = s.y(p.value);
              const h = Math.max(s.y(0) - yTop, 2);
              return (
                <G key={p.key} onPress={() => select(i)}>
                  <Rect x={s.xBar(i) - s.slot / 2} y={PAD.top} width={s.slot} height={H - PAD.top - PAD.bottom} fill="transparent" />
                  <Rect x={s.xBar(i) - bw / 2} y={yTop} width={bw} height={h} rx={4} fill={c.phM} opacity={selected === null || selected === i ? 1 : 0.55} />
                  {showLabel(i, points.length) && (
                    <SvgText x={s.xBar(i)} y={H - 8} fontSize={9.5} fill={c.ink3} textAnchor="middle" fontFamily={font(500)}>
                      {p.label}
                    </SvgText>
                  )}
                </G>
              );
            })}
          </Svg>
        );
      }}
    </Frame>
  );
}
