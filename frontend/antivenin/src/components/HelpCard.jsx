export default function HelpCard({ title, items, highlighted = false }) {
  return (
    <div className="card-lift card-pop flex h-[440px] w-full flex-col rounded-[14px] bg-surface p-6">
      
      <h3 className="mb-4 text-center text-lg font-semibold text-ink">
        {title}
      </h3>

      <ul className="list-disc space-y-2 pl-5 text-[15px] leading-relaxed text-ink/80">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>

    </div>
  );
}