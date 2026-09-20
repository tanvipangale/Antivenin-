import snake from '../assets/snake.png';

export function StepCard({ step, title, children }) {
  return (
    <div className="card-lift card-pop min-h-[260px] rounded-[14px] bg-surface p-6">
      <div className="mb-4 flex items-start justify-between">
        <span className="text-sm font-bold tracking-wide text-clay">
          {step}
        </span>

        <img
          src={snake}
          alt=""
          className="h-5 w-5 object-contain"
        />
      </div>

      <h3 className="mb-3 text-xl font-semibold text-ink">
        {title}
      </h3>

      <p className="text-[15px] leading-relaxed text-ink/80">
        {children}
      </p>
    </div>
  );
}

export function WarningCard({ title, items }) {
  return (
    <div className="card-lift card-pop min-h-[260px] rounded-[14px] bg-warning-bg p-6">
      <div className="mb-4 flex items-start justify-between">
        <span className="text-sm font-bold tracking-wide text-warning-text">
          DO NOT
        </span>

        <img
          src={snake}
          alt=""
          className="h-5 w-5 object-contain"
        />
      </div>

      <h3 className="mb-3 text-xl font-semibold text-warning-text">
        {title}
      </h3>

      <ul className="list-disc space-y-1 pl-5 text-[15px] leading-relaxed text-warning-text">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}