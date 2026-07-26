import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function AdminStatsChart({
  values
}: {
  values: { clients: number; orders: number; projects: number };
}) {
  const data = [
    { name: "Clients", value: values.clients },
    { name: "Orders", value: values.orders },
    { name: "Projects", value: values.projects }
  ];
  return (
    <div className="glass card mt-6 h-80">
      <h2 className="mb-5 font-bold">Studio activity</h2>
      <ResponsiveContainer width="100%" height="85%">
        <BarChart data={data}>
          <CartesianGrid stroke="rgba(255,255,255,.06)" vertical={false} />
          <XAxis dataKey="name" stroke="#8f92a3" />
          <YAxis allowDecimals={false} stroke="#8f92a3" />
          <Tooltip
            contentStyle={{
              background: "#111426",
              border: "1px solid rgba(255,255,255,.1)",
              borderRadius: 12
            }}
          />
          <Bar dataKey="value" fill="#7775ff" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
