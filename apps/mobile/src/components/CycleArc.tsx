import { View } from "react-native";
import Svg, { Circle, Defs, G, Line, Path, Pattern, Rect } from "react-native-svg";
import { useTranslations } from "use-intl";
import { isKnownCycle, type AfterBirthStatus, type CycleStatus, type HomeStatus, type PregnancyStatus } from "@/api/types";
import { useI18n } from "@/i18n/i18n";
import { afterBirthSegments, ARC, arcPath, cycleSegments, markerAt, pregnancySegments, trimesterOf, type Segment } from "@/shared/arc";
import { formatDayMonth } from "@/shared/format";
import { useTheme } from "@/theme/theme";
import { Card } from "./ui/Card";
import { Txt } from "./ui/Txt";

// The signature arc (docs/06), the same geometry as the web (src/shared/arc.ts is synced from apps/web/src/lib).
// Colour is never the only channel (mauve-charts): a worded legend, gaps between segments, a hatched fertile
// segment, and a one-sentence summary for screen readers on the figure.

type Swatch = { label: string; color: string; hatch?: boolean };

function ArcSvg({ segments, max, pos, colors, hatchKey, inner }: {
  segments: Segment[];
  max: number;
  pos: number;
  colors: Record<string, string>;
  hatchKey?: string;
  inner?: { from: number; to: number };
}) {
  const { c, dark } = useTheme();
  const [mx, my] = markerAt(pos, max);
  const outline = dark ? "transparent" : c.rule2;
  return (
    <Svg viewBox={`0 0 ${ARC.W} ${ARC.H}`} width="100%" height={210} importantForAccessibility="no-hide-descendants">
      <Defs>
        <Pattern id="hatch" patternUnits="userSpaceOnUse" width={6} height={6} patternTransform="rotate(45)">
          <Rect width={6} height={6} fill={c.phO} />
          <Line x1={0} y1={0} x2={0} y2={6} stroke={c.phL} strokeOpacity={0.7} strokeWidth={2.4} />
        </Pattern>
      </Defs>
      <Path d={arcPath(0, max, max)} stroke={c.rule} strokeWidth={ARC.stroke} strokeLinecap="round" fill="none" />
      {segments.map((s) => {
        const d = arcPath(s.from, s.to, max);
        if (!d) return null;
        return (
          <G key={s.key}>
            <Path d={d} stroke={outline} strokeWidth={ARC.stroke + 2} strokeLinecap="round" fill="none" />
            <Path d={d} stroke={s.key === hatchKey ? "url(#hatch)" : colors[s.key]} strokeWidth={ARC.stroke} strokeLinecap="round" fill="none" />
          </G>
        );
      })}
      {inner && <Path d={arcPath(inner.from, inner.to, max, ARC.r - 18)} stroke={c.plum} strokeWidth={4} strokeLinecap="round" fill="none" />}
      <Circle cx={mx} cy={my} r={13} fill={c.plum} stroke={c.sheet} strokeWidth={4} />
    </Svg>
  );
}

function Legend({ items }: { items: Swatch[] }) {
  const { c } = useTheme();
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 12 }}>
      {items.map((i) => (
        <View key={i.label} style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <View
            style={{
              width: 12,
              height: 12,
              borderRadius: 6,
              backgroundColor: i.hatch ? c.phO : i.color,
              borderWidth: i.hatch ? 2 : 1,
              borderColor: i.hatch ? c.phL : c.rule2,
            }}
          />
          <Txt variant="xs" color="ink2">
            {i.label}
          </Txt>
        </View>
      ))}
    </View>
  );
}

function Centre({ big, small }: { big: string; small: string }) {
  return (
    <View style={{ position: "absolute", top: 86, start: 0, end: 0, alignItems: "center" }} pointerEvents="none">
      <Txt variant="display" weight={800}>
        {big}
      </Txt>
      <Txt variant="small" color="ink2">
        {small}
      </Txt>
    </View>
  );
}

function Cycle({ status, peri }: { status: CycleStatus; peri: boolean }) {
  const t = useTranslations("arc");
  const { c } = useTheme();
  const { locale } = useI18n();
  if (!isKnownCycle(status)) {
    return (
      <Card>
        <Txt variant="h2">{t("noCycleTitle")}</Txt>
        <Txt variant="small" color="ink2">
          {t("noCycleBody")}
        </Txt>
      </Card>
    );
  }
  const max = Math.max(status.length, status.day);
  const phase = t(`phases.${status.phase}`);
  const longer = status.day > status.length;
  const colors = { period: c.phM, follicular: c.phF, luteal: c.phL };
  return (
    <Card accessible accessibilityRole="image" accessibilityLabel={t("summaryCycle", { day: status.day, length: status.length, phase })}>
      <View>
        <ArcSvg segments={cycleSegments(status.phases, status.length)} max={max} pos={status.day} colors={colors} hatchKey="fertile" />
        <Centre
          big={t("day", { day: status.day })}
          small={longer ? t("longer", { length: status.length }) : status.estimate ? t("phaseEstimate", { phase }) : t("phase", { phase })}
        />
      </View>
      <Legend
        items={[
          { label: t("phases.period"), color: c.phM },
          { label: t("phases.follicular"), color: c.phF },
          ...(status.phases.some((p) => p.key === "fertile") ? [{ label: t("phases.fertile"), color: c.phO, hatch: true }] : []),
          { label: t("phases.luteal"), color: c.phL },
        ]}
      />
      {status.estimate && (
        <Txt variant="xs" color="faintText" align="center">
          {peri ? t("estimateNotePeri") : status.estimate_reason === "little_data" ? t("estimateNoteNew") : t("estimateNote")}
        </Txt>
      )}
      {status.next_period_from && !status.estimate && (
        <Txt variant="xs" color="ink2" align="center">
          {t("nextPeriod", { date: formatDayMonth(status.next_period_from, locale) })}
        </Txt>
      )}
      <Txt variant="xs" color="faintText" align="center">
        {t("notContraception")}
      </Txt>
    </Card>
  );
}

function Pregnancy({ status }: { status: PregnancyStatus }) {
  const t = useTranslations("arc");
  const { c } = useTheme();
  const w = status.windows[0];
  const tri = trimesterOf(status.week);
  const colors = { t1: c.phO, t2: c.phM, t3: c.phL };
  return (
    <Card accessible accessibilityRole="image" accessibilityLabel={`${t("summaryPregnancy", { week: status.week })} ${t("trimester", { n: String(tri) })}.`}>
      <View>
        <ArcSvg segments={pregnancySegments()} max={40} pos={status.week} colors={colors} inner={w ? { from: w.from, to: w.to } : undefined} />
        <Centre big={t("week", { week: status.week })} small={`${t("trimester", { n: String(tri) })} · ${t("weeksLeft", { left: Math.max(40 - status.week, 0) })}`} />
      </View>
      <Legend
        items={[
          { label: t("t1"), color: c.phO },
          { label: t("t2"), color: c.phM },
          { label: t("t3"), color: c.phL },
          ...(w ? [{ label: t("window", { from: w.from, to: w.to }), color: c.plum }] : []),
        ]}
      />
    </Card>
  );
}

function AfterBirth({ status }: { status: AfterBirthStatus }) {
  const t = useTranslations("arc");
  const { c } = useTheme();
  const w = status.windows[0] ?? { label: "", from: 4, to: 12 };
  const max = status.of || 12;
  return (
    <Card accessible accessibilityRole="image" accessibilityLabel={t("summaryAfter", { week: status.week, from: w.from, to: w.to })}>
      <View>
        <ArcSvg segments={afterBirthSegments(w, max)} max={max} pos={Math.min(status.week, max)} colors={{ recovery: c.phL, window: c.ok }} />
        <Centre big={t("week", { week: status.week })} small={t("afterBirth")} />
      </View>
      <Legend
        items={[
          { label: t("recovery", { to: w.from }), color: c.phL },
          { label: t("window", { from: w.from, to: w.to }), color: c.ok },
        ]}
      />
    </Card>
  );
}

export function StatusArc({ status, peri = false }: { status: HomeStatus; peri?: boolean }) {
  if (status.mode === "pregnancy") return <Pregnancy status={status} />;
  if (status.mode === "after_birth") return <AfterBirth status={status} />;
  return <Cycle status={status} peri={peri} />;
}
