"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
} from "recharts";
import type { MonthPoint } from "@/lib/dashboard";

const COLORS = {
  green: "#268a52",
  gold: "#bd8f1d",
  navy: "#1a2f4a",
  red: "#c2422e",
  blue: "#1f6fbf",
};

export function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="card p-5">
      <div className="mb-4">
        <h3 className="text-sm font-bold text-foreground">{title}</h3>
        {subtitle && <p className="text-xs text-muted">{subtitle}</p>}
      </div>
      <div className="h-56 w-full">{children}</div>
    </div>
  );
}

export function StudentGrowthChart({ data }: { data: MonthPoint[] }) {
  return (
    <ChartCard title="Student Growth" subtitle="New registrations per month">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={COLORS.green} stopOpacity={0.4} />
              <stop offset="100%" stopColor={COLORS.green} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="label" tickLine={false} axisLine={false} />
          <YAxis tickLine={false} axisLine={false} allowDecimals={false} />
          <Tooltip />
          <Area
            type="monotone"
            dataKey="students"
            name="New students"
            stroke={COLORS.green}
            fill="url(#sg)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function AttendanceTrendChart({ data }: { data: MonthPoint[] }) {
  return (
    <ChartCard title="Attendance Trend" subtitle="Monthly attendance percentage">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="label" tickLine={false} axisLine={false} />
          <YAxis domain={[0, 100]} tickLine={false} axisLine={false} />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="attendancePct"
            name="Attendance %"
            stroke={COLORS.gold}
            strokeWidth={2.5}
            dot={{ r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function FeeCollectionChart({ data }: { data: MonthPoint[] }) {
  return (
    <ChartCard title="Fee Collection" subtitle="Income per month (PKR)">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="label" tickLine={false} axisLine={false} />
          <YAxis tickLine={false} axisLine={false} />
          <Tooltip />
          <Bar dataKey="income" name="Collected" fill={COLORS.green} radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function ProfitChart({ data }: { data: MonthPoint[] }) {
  return (
    <ChartCard title="Income vs Expenses" subtitle="Monthly financials (PKR)">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="label" tickLine={false} axisLine={false} />
          <YAxis tickLine={false} axisLine={false} />
          <Tooltip />
          <Legend />
          <Bar dataKey="income" name="Income" fill={COLORS.green} radius={[6, 6, 0, 0]} />
          <Bar dataKey="expenses" name="Expenses" fill={COLORS.red} radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function PaymentMethodsPie({
  data,
}: {
  data: { method: string; amount: number }[];
}) {
  const palette = [COLORS.green, COLORS.gold, COLORS.navy, COLORS.blue, COLORS.red];
  return (
    <ChartCard title="Payment Methods" subtitle="Collection by method">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="amount"
            nameKey="method"
            innerRadius="55%"
            outerRadius="85%"
            paddingAngle={3}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={palette[i % palette.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function PerformanceRadar({
  data,
}: {
  data: {
    batting: number;
    bowling: number;
    fielding: number;
    fitness: number;
    discipline: number;
  };
}) {
  const radar = [
    { subject: "Batting", value: data.batting },
    { subject: "Bowling", value: data.bowling },
    { subject: "Fielding", value: data.fielding },
    { subject: "Fitness", value: data.fitness },
    { subject: "Discipline", value: data.discipline },
  ];
  return (
    <ResponsiveContainer width="100%" height="100%">
      <RadarChart data={radar}>
        <PolarGrid />
        <PolarAngleAxis dataKey="subject" />
        <Radar
          dataKey="value"
          stroke={COLORS.gold}
          fill={COLORS.gold}
          fillOpacity={0.35}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}

export function SkillDistributionChart({ data }: { data: { name: string; value: number }[] }) {
  const palette = [COLORS.green, COLORS.blue, COLORS.gold, COLORS.navy];
  return (
    <ChartCard title="Skill Distribution" subtitle="Students by skill level">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius="50%"
            outerRadius="80%"
            paddingAngle={3}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={palette[i % palette.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function BatchDistributionChart({ data }: { data: { name: string; value: number }[] }) {
  return (
    <ChartCard title="Batch Distribution" subtitle="Students per batch">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 8, right: 8 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
          <XAxis type="number" tickLine={false} axisLine={false} allowDecimals={false} />
          <YAxis
            type="category"
            dataKey="name"
            tickLine={false}
            axisLine={false}
            width={90}
            tick={{ fontSize: 11 }}
          />
          <Tooltip />
          <Bar dataKey="value" name="Students" fill={COLORS.navy} radius={[0, 6, 6, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export { COLORS };
