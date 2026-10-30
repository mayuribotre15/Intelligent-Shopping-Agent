import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, Title, Tooltip, Legend, Filler,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, Title, Tooltip, Legend, Filler
);

export function PriceLineChart({ history, title }) {
  if (!history || history.length === 0) return <p style={{ color: 'var(--color-muted)', fontSize: 13 }}>No price history data available.</p>;

  const labels = history.map((h) => h.date || h.fetched_at?.slice(0, 10));
  const prices = history.map((h) => h.price);
  const avg = prices.reduce((a, b) => a + b, 0) / prices.length;

  const data = {
    labels,
    datasets: [
      {
        label: 'Price (USD)',
        data: prices,
        borderColor: '#1a56db',
        backgroundColor: 'rgba(26,86,219,0.08)',
        borderWidth: 2,
        pointRadius: 4,
        pointBackgroundColor: '#1a56db',
        fill: true,
        tension: 0.35,
      },
      {
        label: 'Average Price',
        data: Array(prices.length).fill(avg),
        borderColor: '#d97706',
        borderWidth: 1.5,
        borderDash: [6, 3],
        pointRadius: 0,
        fill: false,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { position: 'top', labels: { font: { size: 12 }, boxWidth: 12 } },
      title: { display: !!title, text: title, font: { size: 14 } },
      tooltip: {
        callbacks: {
          label: (ctx) => `$${ctx.parsed.y.toFixed(2)}`,
        },
      },
    },
    scales: {
      y: {
        ticks: { callback: (v) => `$${v}`, font: { size: 11 } },
        grid: { color: '#f1f5f9' },
      },
      x: { ticks: { font: { size: 11 } }, grid: { display: false } },
    },
  };

  return <Line data={data} options={options} />;
}

export function PlatformBarChart({ platformSummary }) {
  if (!platformSummary) return null;

  const labels = Object.keys(platformSummary).map((k) => k.replace('_mock', '').toUpperCase());
  const avgPrices = Object.values(platformSummary).map((v) => v.avg_price);
  const counts = Object.values(platformSummary).map((v) => v.count);

  const data = {
    labels,
    datasets: [
      {
        label: 'Avg Price (USD)',
        data: avgPrices,
        backgroundColor: ['#1a56db', '#e53238', '#0071ce', '#003087', '#ff9900'].slice(0, labels.length),
        borderRadius: 6,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: (ctx) => `Avg: $${ctx.parsed.y.toFixed(2)}` } },
    },
    scales: {
      y: { ticks: { callback: (v) => `$${v}`, font: { size: 11 } }, grid: { color: '#f1f5f9' } },
      x: { ticks: { font: { size: 11 } }, grid: { display: false } },
    },
  };

  return <Bar data={data} options={options} />;
}

export function CategoryDonutChart({ categories }) {
  if (!categories || Object.keys(categories).length === 0) return null;
  const labels = Object.keys(categories);
  const values = Object.values(categories);

  const data = {
    labels,
    datasets: [{
      data: values,
      backgroundColor: ['#1a56db', '#7c3aed', '#059669', '#d97706', '#0ea5e9', '#dc2626'],
      borderWidth: 0,
    }],
  };

  // Use Bar chart in horizontal mode as a simple alternative to Doughnut
  const options = {
    indexAxis: 'y',
    responsive: true,
    plugins: { legend: { display: false } },
    scales: {
      x: { ticks: { font: { size: 11 } }, grid: { color: '#f1f5f9' } },
      y: { ticks: { font: { size: 11 } }, grid: { display: false } },
    },
  };
  return <Bar data={{ labels, datasets: [{ data: values, backgroundColor: data.datasets[0].backgroundColor, borderRadius: 4 }] }} options={options} />;
}

export function SavingsBarChart({ deals }) {
  if (!deals || deals.length < 2) return null;
  const top = deals.slice(0, 5);
  const maxPrice = Math.max(...top.map((d) => d.price));

  const labels = top.map((d) => (d.platform || '').replace('_mock', '').toUpperCase());
  const prices = top.map((d) => d.price);
  const savings = top.map((d) => parseFloat((maxPrice - d.price).toFixed(2)));

  const data = {
    labels,
    datasets: [
      { label: 'Price', data: prices, backgroundColor: '#1a56db', borderRadius: 6 },
      { label: 'Potential Saving vs Highest', data: savings, backgroundColor: '#059669', borderRadius: 6 },
    ],
  };

  const options = {
    responsive: true,
    plugins: { legend: { position: 'top', labels: { font: { size: 12 }, boxWidth: 12 } } },
    scales: {
      y: { ticks: { callback: (v) => `$${v}`, font: { size: 11 } }, grid: { color: '#f1f5f9' } },
      x: { ticks: { font: { size: 11 } }, grid: { display: false } },
    },
  };
  return <Bar data={data} options={options} />;
}
