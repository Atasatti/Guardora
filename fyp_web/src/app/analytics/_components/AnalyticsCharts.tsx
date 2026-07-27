"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SecurityAlert, Visitor, MaintenanceTicket } from "@/models";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import { format, isSameDay, subDays } from "date-fns";

interface Props {
  visitors: Visitor[];
  alerts: SecurityAlert[];
  tickets: MaintenanceTicket[];
}

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

export default function AnalyticsCharts({ visitors, alerts, tickets }: Props) {
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = subDays(new Date(), 6 - i);
    return { date: d, label: format(d, "EEE") };
  });

  const weeklyData = last7Days.map((day) => ({
    name: day.label,
    Visitors: visitors.filter((v) => isSameDay(new Date(v.createdAt), day.date))
      .length,
    Security: alerts.filter((a) => isSameDay(new Date(a.timestamp), day.date))
      .length,
  }));

  const ticketTypes = tickets.reduce((acc, curr) => {
    const type = curr.type || "OTHER";
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.keys(ticketTypes).map((key) => ({
    name: key.replace("_", " "),
    value: ticketTypes[key],
  }));

  const last14Days = Array.from({ length: 14 }, (_, i) => {
    const d = subDays(new Date(), 13 - i);
    return { date: d, label: format(d, "dd MMM") };
  });

  const trendData = last14Days.map((day) => ({
    date: day.label,
    Footfall: visitors.filter((v) => isSameDay(new Date(v.createdAt), day.date))
      .length,
  }));

  const alertTypes = alerts.reduce((acc, curr) => {
    const type = curr.type || "UNKNOWN";
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const radarData = Object.keys(alertTypes).map((key) => ({
    subject: key.replace(/_/g, " "),
    count: alertTypes[key],
    fullMark: Math.max(...Object.values(alertTypes)) * 1.2,
  }));

  return (
    <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Weekly Comparison</CardTitle>
          <CardDescription>
            Visitor volume vs Security incidents
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <BarChart data={weeklyData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#e5e7eb"
                />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "#6b7280" }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "#6b7280" }}
                />
                <Tooltip
                  cursor={{ fill: "#f3f4f6" }}
                  contentStyle={{
                    borderRadius: "8px",
                    border: "none",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                  }}
                />
                <Legend wrapperStyle={{ paddingTop: "20px" }} />
                <Bar
                  dataKey="Visitors"
                  fill="#3b82f6"
                  radius={[4, 4, 0, 0]}
                  barSize={20}
                />
                <Bar
                  dataKey="Security"
                  fill="#ef4444"
                  radius={[4, 4, 0, 0]}
                  barSize={20}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>14-Day Traffic Trend</CardTitle>
          <CardDescription>Daily visitor footfall analysis</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient
                    id="colorFootfall"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "#6b7280" }}
                  minTickGap={30}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "#6b7280" }}
                />
                <Tooltip
                  contentStyle={{ borderRadius: "8px", border: "none" }}
                />
                <Area
                  type="monotone"
                  dataKey="Footfall"
                  stroke="#8b5cf6"
                  fillOpacity={1}
                  fill="url(#colorFootfall)"
                  strokeWidth={3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Maintenance Categories</CardTitle>
          <CardDescription>Request breakdown by type</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full min-w-0">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend
                    layout="vertical"
                    verticalAlign="middle"
                    align="right"
                    wrapperStyle={{ fontSize: "12px" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                No maintenance data available.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Threat Analysis</CardTitle>
          <CardDescription>Distribution of detected incidents</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full min-w-0">
            {radarData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <RadarChart
                  cx="50%"
                  cy="50%"
                  outerRadius="70%"
                  data={radarData}
                >
                  <PolarGrid />
                  <PolarAngleAxis
                    dataKey="subject"
                    tick={{ fontSize: 10, fill: "#6b7280" }}
                  />
                  <PolarRadiusAxis
                    angle={30}
                    domain={[0, "auto"]}
                    stroke="none"
                  />
                  <Radar
                    name="Incidents"
                    dataKey="count"
                    stroke="#ef4444"
                    fill="#ef4444"
                    fillOpacity={0.4}
                  />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                No alerts recorded.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
