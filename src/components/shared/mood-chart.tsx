
"use client"

import * as React from "react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { subDays, format } from "date-fns"

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import type { MoodLogEntry } from "../patient/mood-tracker"


const moodToValue = {
    'Very Good': 5,
    'Good': 4,
    'Okay': 3,
    'Bad': 2,
    'Very Bad': 1,
    'No Data': 0,
}

const valueToMood = ['No Data', 'Very Bad', 'Bad', 'Okay', 'Good', 'Very Good'];

const chartConfig = {
  mood: {
    label: "Mood",
  },
  'very good': {
    label: "Very Good",
    color: "hsl(var(--chart-1))",
  },
  good: {
    label: "Good",
    color: "hsl(var(--chart-2))",
  },
  okay: {
    label: "Okay",
    color: "hsl(var(--chart-3))",
  },
  bad: {
    label: "Bad",
    color: "hsl(var(--chart-4))",
  },
  'very bad': {
    label: "Very Bad",
    color: "hsl(var(--chart-5))",
  },
} satisfies ChartConfig

export function MoodChart({ patientId }: { patientId: string }) {
    const MOOD_LOG_KEY = `neuro-ai-${patientId}-mood-log`;
    const [chartData, setChartData] = React.useState([]);

    React.useEffect(() => {
        const log = JSON.parse(localStorage.getItem(MOOD_LOG_KEY) || '[]') as MoodLogEntry[];
        
        const data = Array.from({ length: 7 }).map((_, i) => {
            const date = subDays(new Date(), 6 - i);
            const dateString = date.toISOString().split('T')[0];
            const logEntry = log.find(entry => entry.date === dateString);
            
            const moodValue = logEntry ? moodToValue[logEntry.mood] : 0;
            const moodColorKey = logEntry ? logEntry.mood.toLowerCase().replace(' ', '') : 'no-data';
            const moodColor = logEntry ? (chartConfig as any)[moodColorKey]?.color : 'hsl(var(--muted))';

            return {
                date: format(date, "EEE"), // e.g., "Mon"
                mood: moodValue,
                note: logEntry?.note,
                fill: moodColor
            };
        });

        setChartData(data as any);
    }, [MOOD_LOG_KEY]);


  if (chartData.length === 0) {
    return (
        <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">No mood data available for the past week.</p>
        </div>
    )
  }

  return (
    <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
      <BarChart 
        accessibilityLayer 
        data={chartData} 
        margin={{ top: 20, right: 20, bottom: 20, left: -20 }}
      >
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="date"
          tickLine={false}
          tickMargin={10}
          axisLine={false}
        />
        <YAxis
          dataKey="mood"
          type="number"
          domain={[0, 5]}
          ticks={[1, 2, 3, 4, 5]}
          tickFormatter={(value) => valueToMood[value]}
          tickMargin={10}
          axisLine={false}
          tickLine={false}
        />
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent 
            formatter={(value, name, props) => (
                <div className="flex flex-col gap-1">
                   <span>{valueToMood[Number(value)]}</span>
                   {props.payload.note && <span className="text-xs text-muted-foreground italic">&quot;{props.payload.note}&quot;</span>}
                </div>
            )}
            indicator="dot"
            hideLabel
          />}
        />
        <Bar
            dataKey="mood"
            radius={8}
            barSize={40}
        />
      </BarChart>
    </ChartContainer>
  )
}
