import { REGISTRATION_STEPS } from '../data/RegistrationSteps';

export default function RegistrationTimeline({ activeIndex = 0 }) {
  return (
    <div className="space-y-4">
      {REGISTRATION_STEPS.map((step, i) => {
        const state = i < activeIndex ? 'done' : i === activeIndex ? 'active' : 'upcoming';
        return (
          <div key={step.title} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  state === 'done'
                    ? 'bg-olive text-cream'
                    : state === 'active'
                    ? 'bg-select text-white'
                    : 'border border-ink/20 text-ink/40'
                }`}
              >
                {state === 'done' ? '✓' : i + 1}
              </span>
              {i < REGISTRATION_STEPS.length - 1 && <span className="mt-1 h-full w-px flex-1 bg-ink/10" />}
            </div>
            <div className="pb-4">
              <p className={`font-semibold ${state === 'upcoming' ? 'text-ink/40' : 'text-ink'}`}>{step.title}</p>
              <p className={`text-sm ${state === 'upcoming' ? 'text-ink/30' : 'text-ink/60'}`}>{step.body}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}