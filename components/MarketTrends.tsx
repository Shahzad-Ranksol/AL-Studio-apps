
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
// Fix: Import DEFAULT_MARKET_PRICES instead of non-existent CURRENT_MARKET_PRICES
import { PRICE_HISTORY_DATA, DEFAULT_MARKET_PRICES } from '../constants';

const MarketTrends: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Fix: Map over DEFAULT_MARKET_PRICES and updated grid-cols-4 since there are 4 main materials */}
        {DEFAULT_MARKET_PRICES.map((item) => (
          <div key={item.type} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start mb-2">
              <span className="text-sm font-semibold text-slate-500 uppercase">{item.type}</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                item.trend === 'up' ? 'bg-red-100 text-red-600' : 
                item.trend === 'down' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-600'
              }`}>
                {item.trend}
              </span>
            </div>
            <div className="text-2xl font-bold text-slate-800">Rs. {item.price.toLocaleString()}</div>
            <div className="text-xs text-slate-400 mt-1">per {item.unit}</div>
          </div>
        ))}
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100">
        <h3 className="text-lg font-bold text-slate-800 mb-6">Price Trend Index (PKR)</h3>
        {/* Added h-[400px] and overflow-hidden to provide a stable container for Recharts */}
        <div className="h-[400px] w-full min-h-[400px] overflow-hidden">
          {/* Added minWidth={0} to satisfy the Recharts ResponsiveContainer requirement */}
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <LineChart 
              data={PRICE_HISTORY_DATA}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="month" 
                stroke="#94a3b8" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false} 
                dy={10}
              />
              <YAxis 
                stroke="#94a3b8" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false} 
                tickFormatter={(val) => `Rs.${val >= 1000 ? (val/1000).toFixed(0) + 'k' : val}`}
              />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                formatter={(value: any) => [`Rs. ${value.toLocaleString()}`, '']}
              />
              <Legend verticalAlign="top" height={36} iconType="circle" />
              <Line 
                type="monotone" 
                dataKey="cement" 
                name="Cement (Bag)" 
                stroke="#10b981" 
                strokeWidth={3} 
                dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }} 
                activeDot={{ r: 6, strokeWidth: 0 }} 
              />
              <Line 
                type="monotone" 
                dataKey="steel" 
                name="Steel (Ton/1000)" 
                stroke="#3b82f6" 
                strokeWidth={3} 
                dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }} 
                activeDot={{ r: 6, strokeWidth: 0 }} 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default MarketTrends;
