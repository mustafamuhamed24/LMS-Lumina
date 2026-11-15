'use client';

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const axisProps = {
  stroke: 'var(--muted-foreground)',
  fontSize: 11,
  tickLine: false,
  axisLine: false,
} as const;

const tooltipStyle = {
  backgroundColor: 'var(--popover)',
  border: '1px solid var(--border)',
  borderRadius: '8px',
  fontSize: '12px',
  color: 'var(--popover-foreground)',
} as const;

export function EnrollmentTrendChart({ data }: { data: { month: string; enrollments: number; completions: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
        <defs>
          <linearGradient id="enrollmentsFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.28} />
            <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="completionsFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--chart-3)" stopOpacity={0.22} />
            <stop offset="100%" stopColor="var(--chart-3)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis dataKey="month" {...axisProps} />
        <YAxis {...axisProps} allowDecimals={false} width={34} />
        <Tooltip contentStyle={tooltipStyle} />
        <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: '11px' }} />
        <Area type="monotone" dataKey="enrollments" name="Enrollments" stroke="var(--chart-1)" strokeWidth={2} fill="url(#enrollmentsFill)" />
        <Area type="monotone" dataKey="completions" name="Completions" stroke="var(--chart-3)" strokeWidth={2} fill="url(#completionsFill)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function PlatformGrowthChart({ data }: { data: { month: string; users: number; enrollments: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
        <defs>
          <linearGradient id="platformUsersFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.28} />
            <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="platformEnrollmentsFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--chart-2)" stopOpacity={0.22} />
            <stop offset="100%" stopColor="var(--chart-2)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis dataKey="month" {...axisProps} />
        <YAxis {...axisProps} allowDecimals={false} width={34} />
        <Tooltip contentStyle={tooltipStyle} />
        <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: '11px' }} />
        <Area type="monotone" dataKey="users" name="New users" stroke="var(--chart-1)" strokeWidth={2} fill="url(#platformUsersFill)" />
        <Area
          type="monotone"
          dataKey="enrollments"
          name="Enrollments"
          stroke="var(--chart-2)"
          strokeWidth={2}
          fill="url(#platformEnrollmentsFill)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function CategoryBreakdownChart({ data }: { data: { name: string; color: string; count: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
        <XAxis type="number" {...axisProps} allowDecimals={false} />
        <YAxis type="category" dataKey="name" {...axisProps} width={96} />
        <Tooltip contentStyle={tooltipStyle} />
        <Bar dataKey="count" name="Courses" radius={[0, 4, 4, 0]} barSize={14}>
          {data.map((entry) => (
            <Cell key={entry.name} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function EngagementChart({
  data,
}: {
  data: { month: string; activeLearners: number; lessonsCompleted: number; quizAttempts: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis dataKey="month" {...axisProps} />
        <YAxis {...axisProps} allowDecimals={false} width={34} />
        <Tooltip contentStyle={tooltipStyle} />
        <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: '11px' }} />
        <Line type="monotone" dataKey="activeLearners" name="Active learners" stroke="var(--chart-1)" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="lessonsCompleted" name="Lessons completed" stroke="var(--chart-2)" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="quizAttempts" name="Quiz attempts" stroke="var(--chart-4)" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function HorizontalBars({
  data,
  dataKey,
  color = 'var(--chart-1)',
}: {
  data: { name: string; [key: string]: string | number }[];
  dataKey: string;
  color?: string;
}) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
        <XAxis type="number" {...axisProps} allowDecimals={false} />
        <YAxis type="category" dataKey="name" {...axisProps} width={110} />
        <Tooltip contentStyle={tooltipStyle} />
        <Bar dataKey={dataKey} fill={color} radius={[0, 4, 4, 0]} barSize={14} />
      </BarChart>
    </ResponsiveContainer>
  );
}
