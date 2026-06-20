import ReactECharts from 'echarts-for-react'

interface GaugeChartProps {
  value: number
  name: string
  max?: number
  unit?: string
  color?: string
}

export default function GaugeChart({ value, name, max = 100, unit = '%', color = '#1890ff' }: GaugeChartProps) {
  const option = {
    series: [
      {
        type: 'gauge',
        startAngle: 200,
        endAngle: -20,
        min: 0,
        max: max,
        splitNumber: 10,
        itemStyle: {
          color: color
        },
        progress: {
          show: true,
          width: 20,
          roundCap: true
        },
        pointer: {
          show: false
        },
        axisLine: {
          lineStyle: {
            width: 20,
            color: [[1, 'rgba(24, 144, 255, 0.1)']]
          },
          roundCap: true
        },
        axisTick: {
          show: false
        },
        splitLine: {
          show: false
        },
        axisLabel: {
          show: false
        },
        title: {
          show: false
        },
        detail: {
          valueAnimation: true,
          width: '60%',
          lineHeight: 40,
          borderRadius: 8,
          offsetCenter: [0, '0%'],
          fontSize: 28,
          fontWeight: 'bold',
          formatter: `{value}${unit}`,
          color: color
        },
        data: [
          {
            value: value,
            name: name
          }
        ]
      }
    ]
  }

  return (
    <div>
      <ReactECharts option={option} style={{ height: 160 }} />
      <div className="text-center text-gray-400 text-sm -mt-4">{name}</div>
    </div>
  )
}
