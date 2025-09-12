import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const MonthlyRevenueChart = ({ data }) => {
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const chartData = data.map(item => ({
    name: `${monthNames[item.month - 1]} ${item.year}`,
    revenue: item.revenue,
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
        <Legend />
        <Bar dataKey="revenue" fill="#8884d8" />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default MonthlyRevenueChart;