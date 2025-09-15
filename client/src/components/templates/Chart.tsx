"use client";
import { Label, Pie, PieChart } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  //   ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Appliance } from "@/types/type";
import { transformDataToChartProps } from "@/helper/function";

type ChartComponentProps = {
  appliance: Appliance[];
  totalEnergy: number;
  date: string;
};

export function ChartComponent({
  appliance,
  totalEnergy,
  date,
}: ChartComponentProps) {
  const { chartData, chartConfig } = transformDataToChartProps(appliance);

  return (
    <Card className="flex flex-col bg-transparent justify-evenly h-full border-none">
      <CardHeader className="items-center pb-0">
        <CardTitle className="text-white text-xl font-light -mb-2 tracking-wide">
          Daily Energy Consumption Overview
        </CardTitle>
        <CardDescription className="text-tealBright font-semibold text-sm">
          Total Energy Used Today - Average Energy per Device
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[250px]"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="category"
              innerRadius={60}
              strokeWidth={5}
            >
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        style={{
                          fill: "white",
                          fontSize: "16px",
                          fontWeight: "bold",
                        }} // Menggunakan style inline
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          style={{
                            fill: "white",
                            fontSize: "32px",
                            fontWeight: "bold",
                          }}
                        >
                          {totalEnergy.toLocaleString()}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                          style={{
                            fill: "lightgray",
                            fontSize: "12px",
                            fontWeight: "lighter",
                          }}
                        >
                          kWh
                        </tspan>
                      </text>
                    );
                  }
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm">
        <div className="flex items-center gap-2 font-medium leading-none text-white text-center">
          Keep track of your energy usage and optimize your consumption
          effortlessly.
        </div>
        <div className="leading-none text-muted-foreground text-tealBright">
          Last Synced: {date && date.split(" ")[0]}
        </div>
      </CardFooter>
    </Card>
  );
}
