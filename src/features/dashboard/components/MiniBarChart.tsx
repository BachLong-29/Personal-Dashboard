interface MiniBarChartProps {
  data: number[];
  labels: string[];
  color: string;
  maxOverride?: number;
}

export function MiniBarChart({ data, labels, color, maxOverride }: MiniBarChartProps) {
  const max = maxOverride ?? Math.max(...data, 1);

  return (
    <div className="bar-chart">
      {data.map((v, i) => (
        <div key={i} className="bar-col">
          <div className="bar-fill-wrap">
            <div
              className="bar-fill"
              style={{
                height: `${(v / max) * 100}%`,
                background: color,
                boxShadow: `0 0 6px ${color}66`,
              }}
            />
          </div>
          <div className="bar-label">{labels[i]}</div>
        </div>
      ))}
    </div>
  );
}
