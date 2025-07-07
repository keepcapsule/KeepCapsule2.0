import React from 'react';
import { Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

const renderPie = (used, total, label) => {
  const remaining = Math.max(total - used, 0);
  return (
    <Pie
      data={{
        labels: ['Used', 'Remaining'],
        datasets: [{
          data: [used, remaining],
          backgroundColor: ['#f87171', '#4ade80'],
          borderColor: '#fff',
          borderWidth: 1,
        }],
      }}
      options={{
        plugins: {
          title: { display: true, text: label },
          legend: { position: 'bottom' },
        },
      }}
    />
  );
};

export default function UsagePieCharts({ usage }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', gap: '50px', flexWrap: 'wrap' }}>
      <div style={{ width: '250px' }}>
        <h3 style={{ textAlign: 'center' }}>Storage Usage</h3>
        {renderPie(usage.totalUsageMB || 0, usage.planLimitMB || 1, 'Storage')}
      </div>
      <div style={{ width: '250px' }}>
        <h3 style={{ textAlign: 'center' }}>Retrieval Usage</h3>
        {renderPie(usage.docUsageMB + usage.photoUsageMB || 0, usage.retrievalLimitMB || 1, 'Retrievals')}
      </div>
    </div>
  );
}
