import LocationSearch from '../components/LocationSearch';
import { StepCard, WarningCard } from '../components/StepCard';
import HelpCard from '../components/HelpCard';
import Reveal from '../components/Reveal';

const steps = [
  ['STEP 01', 'Stay still, stay calm',
    'Movement speeds venom through the bloodstream. Sit or lie down, and keep the bitten limb still and at or slightly below heart level.'],

  ['STEP 02', 'Remove tight items',
    'Take off rings, watches, and tight clothing near the bite immediately — swelling can start fast and make this impossible later.'],

  ['STEP 03', 'Note what you can, safely',
    "From a safe distance, remember the animal's size, color, and shape — or take a photo. Never try to catch or kill it. This helps doctors choose the right antivenom."],

  ['STEP 04', 'Get to a hospital now',
    'Treat every bite as an emergency, even if symptoms seem mild at first. Use the finder above to locate the nearest hospital stocked with antivenom.'],
];

const mistakes = [
  'No cutting the wound',
  'No sucking out venom',
  'No ice or tourniquet',
  'No alcohol or painkillers unless a doctor says so',
];

const helpCards = [
  {
    title: "You don't know if it was venomous",
    items: [
      "Stay calm, sit or lie down, don't walk around",
      'Remove rings/watches/tight clothing near the bite before swelling starts',
      'Note the time of the bite',
      "Treat it as venomous until a doctor says otherwise — don't wait to see if it's serious",
    ],
  },
  {
    highlighted: true,
    title: 'You can safely see the animal',
    items: [
      'From a distance only — never chase, catch, or kill it',
      'Remember its color, size, shape, or take a photo if safe',
      'This helps the hospital pick the right antivenom',
      "If it's already gone, just describe the bite marks",
    ],
  },
  {
    title: 'Mild symptoms',
    items: [
      'Keep the limb still and at or slightly below heart level',
      "Don't apply ice, heat, or any ointment",
      "Don't take painkillers unless a doctor tells you to",
      'Get to a hospital anyway — mild symptoms can escalate fast',
    ],
  },
  {
    title: 'Severe symptoms',
    items: [
      'This is a medical emergency — call for emergency transport immediately',
      'Loosen tight clothing, keep the person lying down',
      'Do not give food or water',
      'If breathing stops, begin CPR if trained, and continue until help arrives',
    ],
  },
];

export default function Home() {
  return (
    <main className="pb-24">

      <section className="pt-16 pb-20">
        <Reveal>
          <LocationSearch />
        </Reveal>
      </section>

      <section className="mx-auto max-w-6xl px-6">

        <Reveal>
          <div className="mb-10 flex justify-center">
            <h2 className="rounded-full bg-surface px-8 py-4 text-center text-2xl text-ink">
              If a venomous bite or sting happens, act in this order
            </h2>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 items-stretch gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {steps.map(([step, title, text], i) => (
            <Reveal key={step} delay={i * 80} className="h-full">
              <StepCard step={step} title={title}>
                {text}
              </StepCard>
            </Reveal>
          ))}

          <Reveal delay={320} className="h-full">
            <WarningCard
              title="Avoid these common mistakes"
              items={mistakes}
            />
          </Reveal>
        </div>

      </section>

      <section className="mx-auto mt-24 max-w-6xl px-6">

        <Reveal>
          <div className="mb-10 flex justify-center">
            <h2 className="rounded-full bg-surface px-8 py-4 text-center text-2xl text-ink">
              What to do when help is on the way?
            </h2>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 items-stretch gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {helpCards.map((card, i) => (
            <Reveal key={card.title} delay={i * 80} className="h-full">
              <HelpCard {...card} />
            </Reveal>
          ))}
        </div>

      </section>

    </main>
  );
}