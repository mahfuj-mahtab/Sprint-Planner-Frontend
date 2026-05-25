import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const TOOLTIP_STYLE = {
  backgroundColor: "#0d1117",
  border: "1px solid #1e2a3a",
  borderRadius: "8px",
  fontSize: "12px",
};

const COLORS = ["#00ff94", "#00d4ff", "#a78bfa", "#ff6b35", "#f87171", "#94a3b8"];

export function MonthlyTrendChart({ data, formatValue }) {
  if (!data?.length) return null;
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e2a3a" />
        <XAxis dataKey="label" tick={{ fill: "#94a3b8", fontSize: 11 }} />
        <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} tickFormatter={formatValue} />
        <Tooltip
          contentStyle={TOOLTIP_STYLE}
          formatter={(value, name) => [formatValue ? formatValue(value) : value, name]}
        />
        <Legend wrapperStyle={{ fontSize: "12px" }} />
        <Bar dataKey="income" name="Income" fill="#00ff94" radius={[4, 4, 0, 0]} />
        <Bar dataKey="expense" name="Expense" fill="#f87171" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function ProfitLineChart({ data, formatValue }) {
  if (!data?.length) return null;
  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e2a3a" />
        <XAxis dataKey="label" tick={{ fill: "#94a3b8", fontSize: 11 }} />
        <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} tickFormatter={formatValue} />
        <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => [formatValue ? formatValue(v) : v, "Profit"]} />
        <Line type="monotone" dataKey="profit" stroke="#00d4ff" strokeWidth={2} dot={{ fill: "#00d4ff", r: 4 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function CategoryBarChart({ data, formatValue, color = "#00ff94" }) {
  if (!data?.length) return null;
  const trimmed = data.slice(0, 8);
  return (
    <ResponsiveContainer width="100%" height={Math.max(200, trimmed.length * 36)}>
      <BarChart data={trimmed} layout="vertical" margin={{ top: 4, right: 12, left: 4, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e2a3a" horizontal={false} />
        <XAxis type="number" tick={{ fill: "#94a3b8", fontSize: 11 }} tickFormatter={formatValue} />
        <YAxis type="category" dataKey="name" width={100} tick={{ fill: "#e8edf2", fontSize: 11 }} />
        <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => [formatValue ? formatValue(v) : v, "Amount"]} />
        <Bar dataKey="amount" fill={color} radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function TaskStatusPie({ data }) {
  const filtered = data.filter((d) => d.value > 0);
  if (!filtered.length) return null;
  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={filtered}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          innerRadius={56}
          outerRadius={90}
          paddingAngle={2}
        >
          {filtered.map((entry, i) => (
            <Cell key={entry.name} fill={entry.color || COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip contentStyle={TOOLTIP_STYLE} />
        <Legend wrapperStyle={{ fontSize: "11px" }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

const TEAM_STATUS_COLORS = {
  Completed: "#00ff94",
  "Work In Progress": "#00d4ff",
  Pending: "#94a3b8",
  Hold: "#a78bfa",
  Cancelled: "#f87171",
};

export function TeamStackedTaskChart({ data }) {
  if (!data?.length) return null;
  return (
    <ResponsiveContainer width="100%" height={Math.max(260, data.length * 48)}>
      <BarChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e2a3a" />
        <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 11 }} />
        <YAxis allowDecimals={false} tick={{ fill: "#94a3b8", fontSize: 11 }} />
        <Tooltip contentStyle={TOOLTIP_STYLE} />
        <Legend wrapperStyle={{ fontSize: "11px" }} />
        <Bar dataKey="completed" name="Completed" stackId="s" fill={TEAM_STATUS_COLORS.Completed} />
        <Bar dataKey="wip" name="In progress" stackId="s" fill={TEAM_STATUS_COLORS["Work In Progress"]} />
        <Bar dataKey="pending" name="Pending" stackId="s" fill={TEAM_STATUS_COLORS.Pending} />
        <Bar dataKey="hold" name="Hold" stackId="s" fill={TEAM_STATUS_COLORS.Hold} />
        <Bar dataKey="cancelled" name="Cancelled" stackId="s" fill={TEAM_STATUS_COLORS.Cancelled} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function MemberWorkloadBarChart({ data, barKey = "total", color = "#00d4ff" }) {
  if (!data?.length) return null;
  const height = Math.max(280, data.length * 44);
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, left: 4, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e2a3a" horizontal={false} />
        <XAxis type="number" allowDecimals={false} tick={{ fill: "#94a3b8", fontSize: 11 }} />
        <YAxis type="category" dataKey="name" width={120} tick={{ fill: "#e8edf2", fontSize: 11 }} />
        <Tooltip contentStyle={TOOLTIP_STYLE} />
        <Bar dataKey={barKey} fill={color} radius={[0, 6, 6, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function MemberGroupedBarChart({ data }) {
  if (!data?.length) return null;
  const height = Math.max(280, data.length * 44);
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, left: 4, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e2a3a" horizontal={false} />
        <XAxis type="number" allowDecimals={false} tick={{ fill: "#94a3b8", fontSize: 11 }} />
        <YAxis type="category" dataKey="name" width={120} tick={{ fill: "#e8edf2", fontSize: 11 }} />
        <Tooltip contentStyle={TOOLTIP_STYLE} />
        <Legend wrapperStyle={{ fontSize: "11px" }} />
        <Bar dataKey="completed" name="Completed" fill="#00ff94" radius={[0, 0, 0, 0]} stackId="m" />
        <Bar dataKey="wip" name="In progress" fill="#00d4ff" radius={[0, 0, 0, 0]} stackId="m" />
        <Bar dataKey="pending" name="Pending" fill="#64748b" radius={[0, 6, 6, 0]} stackId="m" />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function PriorityPieChart({ data }) {
  const filtered = data.filter((d) => d.value > 0);
  if (!filtered.length) return null;
  const priorityColors = { High: "#f87171", Medium: "#fbbf24", Low: "#94a3b8" };
  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={filtered}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          innerRadius={56}
          outerRadius={90}
          paddingAngle={2}
        >
          {filtered.map((entry) => (
            <Cell key={entry.name} fill={priorityColors[entry.name] || COLORS[0]} />
          ))}
        </Pie>
        <Tooltip contentStyle={TOOLTIP_STYLE} />
        <Legend wrapperStyle={{ fontSize: "11px" }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function ProjectProfitChart({ data, formatValue }) {
  if (!data?.length) return null;
  return (
    <ResponsiveContainer width="100%" height={Math.max(220, data.length * 40)}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 12, left: 4, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e2a3a" horizontal={false} />
        <XAxis type="number" tick={{ fill: "#94a3b8", fontSize: 11 }} tickFormatter={formatValue} />
        <YAxis type="category" dataKey="name" width={120} tick={{ fill: "#e8edf2", fontSize: 11 }} />
        <Tooltip contentStyle={TOOLTIP_STYLE} />
        <Legend wrapperStyle={{ fontSize: "11px" }} />
        <Bar dataKey="revenue" name="Revenue" fill="#00ff94" radius={[0, 4, 4, 0]} />
        <Bar dataKey="cost" name="Cost" fill="#f87171" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
