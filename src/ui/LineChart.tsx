// Gràfic de línia mínim (SVG). L'eix X és el temps real: dues sessions separades
// per un mes queden lluny, no al costat. Cap punt inventat entre sessions.
import { useState } from 'react'
import { View } from 'react-native'
import Svg, { Circle, Line, Polyline, Text as SvgText } from 'react-native-svg'

import { formatNumber, formatShortDate } from '@/lib/format'
import type { Point } from '@/lib/stats'
import { colors } from '@/theme/tokens'

const HEIGHT = 180
const PAD = { top: 12, right: 12, bottom: 24, left: 40 }

function niceTicks(min: number, max: number, count = 4): number[] {
  if (min === max) return [min]
  const raw = (max - min) / count
  const mag = 10 ** Math.floor(Math.log10(raw))
  const step = [1, 2, 2.5, 5, 10].map(m => m * mag).find(s => s >= raw) ?? raw
  const start = Math.floor(min / step) * step
  const ticks: number[] = []
  for (let v = start; v <= max + step / 2; v += step) ticks.push(Math.round(v * 100) / 100)
  return ticks
}

export function LineChart({ points }: { points: Point[] }) {
  const [width, setWidth] = useState(0)
  const values = points.map(p => p.value)
  const ticks = niceTicks(Math.min(...values), Math.max(...values))
  const yMin = Math.min(ticks[0], ...values)
  const yMax = Math.max(ticks[ticks.length - 1], ...values)
  const tMin = points[0]?.at ?? 0
  const tMax = points[points.length - 1]?.at ?? 1

  const plotW = Math.max(1, width - PAD.left - PAD.right)
  const plotH = HEIGHT - PAD.top - PAD.bottom
  const x = (at: number) => PAD.left + (tMax === tMin ? plotW / 2 : ((at - tMin) / (tMax - tMin)) * plotW)
  const y = (v: number) => PAD.top + (yMax === yMin ? plotH / 2 : (1 - (v - yMin) / (yMax - yMin)) * plotH)

  return (
    <View onLayout={e => setWidth(e.nativeEvent.layout.width)} style={{ height: HEIGHT }}>
      {width > 0 ? (
        <Svg width={width} height={HEIGHT}>
          {ticks.map(v => (
            <Line key={`g${v}`} x1={PAD.left} x2={width - PAD.right} y1={y(v)} y2={y(v)} stroke={colors.chart.grid} strokeWidth={1} />
          ))}
          {ticks.map(v => (
            <SvgText key={`t${v}`} x={PAD.left - 6} y={y(v) + 4} fontSize={11} fontFamily="sans-serif" fill={colors.chart.axis} textAnchor="end">
              {formatNumber(v)}
            </SvgText>
          ))}
          <SvgText x={PAD.left} y={HEIGHT - 6} fontSize={11} fontFamily="sans-serif" fill={colors.chart.axis} textAnchor="start">
            {formatShortDate(tMin)}
          </SvgText>
          <SvgText x={width - PAD.right} y={HEIGHT - 6} fontSize={11} fontFamily="sans-serif" fill={colors.chart.axis} textAnchor="end">
            {formatShortDate(tMax)}
          </SvgText>
          <Polyline
            points={points.map(p => `${x(p.at)},${y(p.value)}`).join(' ')}
            fill="none"
            stroke={colors.chart.line}
            strokeWidth={2.5}
            strokeLinejoin="round"
          />
          {points.map(p => (
            <Circle key={p.at} cx={x(p.at)} cy={y(p.value)} r={3.5} fill={colors.chart.point} />
          ))}
        </Svg>
      ) : null}
    </View>
  )
}
