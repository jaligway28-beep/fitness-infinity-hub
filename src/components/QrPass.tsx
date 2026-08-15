type Props = {
  value: string;
  size?: number;
};

/** Deterministic decorative QR-style matrix for the prototype pass. */
function matrix(value: string, cells: number) {
  let seed = 0;
  for (let i = 0; i < value.length; i++) seed = (seed * 31 + value.charCodeAt(i)) % 100000;
  const grid: boolean[][] = [];
  let state = seed || 7;
  for (let y = 0; y < cells; y++) {
    const row: boolean[] = [];
    for (let x = 0; x < cells; x++) {
      state = (state * 1103515245 + 12345) % 2147483648;
      row.push((state >> 8) % 100 > 48);
    }
    grid.push(row);
  }
  const finder = (ox: number, oy: number) => {
    for (let y = 0; y < 7; y++)
      for (let x = 0; x < 7; x++) {
        const edge = x === 0 || y === 0 || x === 6 || y === 6;
        const core = x >= 2 && x <= 4 && y >= 2 && y <= 4;
        grid[oy + y]![ox + x] = edge || core;
      }
  };
  finder(0, 0);
  finder(cells - 7, 0);
  finder(0, cells - 7);
  return grid;
}

export function QrPass({ value, size = 240 }: Props) {
  const cells = 25;
  const grid = matrix(value, cells);
  const unit = 100 / cells;

  return (
    <div
      className="rounded-2xl bg-foreground p-4"
      style={{ width: size, height: size }}
      aria-label="QR membership pass"
      role="img"
    >
      <svg viewBox="0 0 100 100" className="h-full w-full">
        {grid.map((row, y) =>
          row.map((on, x) =>
            on ? (
              <rect
                key={`${x}-${y}`}
                x={x * unit}
                y={y * unit}
                width={unit}
                height={unit}
                rx={unit * 0.25}
                className="fill-background"
              />
            ) : null,
          ),
        )}
      </svg>
    </div>
  );
}
