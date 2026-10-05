import { useState } from 'react';
import SpeciesCard from '../components/Speciescard';
import { PhoneIcon, DownloadIcon, PrinterIcon } from '../components/Icons';
import { downloadOfflineGuide } from '../utils/Offlineguide';
import { helplines } from '../data/Helplines';
import { biteTypes } from '../data/BiteTypes';
import { antivenomInfo, antivenomGaps } from '../data/antivenomInfo';
import Reveal from '../components/Reveal';
import ShareLocationButton from '../components/ShareLocationButton';

const mistakes = [
  'No cutting the wound',
  'No sucking out venom',
  'No ice or tourniquet',
  'No alcohol or painkillers unless a doctor says so',
];

const symptomCards = [
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

export default function Emergency() {
  const [active, setActive] = useState(0);

  return (
    <main className="pb-24">

      {/* Header */}
      <section className="mx-auto max-w-4xl px-6 pt-16 text-center">
        <Reveal>
          <h1 className="text-4xl text-ink">
            Emergency instructions
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-ink/70">
            If you or someone near you has been bitten or stung by a venomous
            animal, treat it as a medical emergency — even if symptoms seem mild.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-3">

            <a
              href="tel:112"
              className="btn-press inline-flex items-center gap-2 rounded-full bg-olive px-7 py-2 font-semibold text-cream transition hover:opacity-90"
            >
              <PhoneIcon className="h-5 w-5" />
              Call Emergency Services
            </a>

            <a
              href="tel:108"
              className="btn-press inline-flex items-center gap-2 rounded-full bg-clay px-7 py-2 font-semibold text-cream transition hover:opacity-90"
            >
              <PhoneIcon className="h-5 w-5" />
              Call Ambulance (108)
            </a>

            <ShareLocationButton />

            <button
              onClick={downloadOfflineGuide}
              className="btn-press inline-flex items-center gap-2 rounded-full border border-ink/10 bg-surface px-6 py-4 text-sm font-semibold text-ink hover:bg-ink/5 print:hidden"
            >
              <DownloadIcon className="h-4 w-4" />
              Save offline guide
            </button>

            <button
              onClick={() => window.print()}
              className="btn-press inline-flex items-center gap-2 rounded-full border border-ink/10 px-6 py-4 text-sm font-semibold text-ink/60 hover:bg-ink/5 print:hidden"
            >
              <PrinterIcon className="h-4 w-4" />
              Print page
            </button>

          </div>
        </Reveal>
      </section>

      {/* Bite type */}
      <section className="mx-auto mt-16 max-w-4xl px-6">
        <Reveal>

          <div className="mb-6">
            <h2 className="text-2xl text-ink">
              What happened?
            </h2>

            <p className="mt-1 text-sm text-ink/50">
              Pick the closest match for immediate steps.
            </p>
          </div>

          <div className="mb-5 flex flex-wrap gap-2">
            {biteTypes.map((bite, i) => (
              <button
                key={bite.id}
                onClick={() => setActive(i)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  active === i
                    ? 'bg-olive text-cream shadow-sm'
                    : 'border border-ink/10 bg-surface text-ink/60 hover:bg-ink/5'
                }`}
              >
                {bite.label}
              </button>
            ))}
          </div>

          <ol className="space-y-3">
            {biteTypes[active].steps.map((step, i) => (
              <li
                key={i}
                className="flex gap-4 rounded-[14px] border border-ink/10 bg-surface p-5"
              >
                <span className="shrink-0 font-bold text-olive">
                  {String(i + 1).padStart(2, '0')}
                </span>

                <p className="text-[15px] leading-relaxed text-ink/75">
                  {step}
                </p>
              </li>
            ))}
          </ol>

        </Reveal>
      </section>

      {/* Helplines */}
      <section className="mx-auto mt-20 max-w-4xl px-6">
        <Reveal>

          <div className="mb-6">
            <h2 className="text-2xl text-ink">
              Helpline numbers
            </h2>

            <p className="mt-1 text-sm text-ink/50">
              Tap a number on your phone to call directly.
            </p>
          </div>

          <div className="space-y-3">
            {helplines.map((h) => (
              <a
                key={h.id}
                href={`tel:${h.number.replace(/[^\d+]/g, '')}`}
                className="card-lift flex items-center justify-between gap-4 rounded-[14px] border border-ink/10 bg-surface p-5 no-underline hover:bg-ink/5"
              >
                <div>
                  <p className="font-semibold text-ink">
                    {h.label}
                  </p>

                  <p className="text-sm text-ink/60">
                    {h.description}
                  </p>
                </div>

                <span className="shrink-0 rounded-full bg-olive/10 px-4 py-2 font-mono font-bold text-olive">
                  {h.number}
                </span>
              </a>
            ))}
          </div>

        </Reveal>
      </section>
{/* SPECIES GUIDE */}
      <section className="mx-auto mt-20 max-w-4xl px-6">
        <Reveal>
          <div className="mb-7">
            <p className="text-xs font-bold uppercase tracking-[.15em] text-olive">Quick reference</p>
            <h2 className="mt-1 text-2xl text-ink">Antivenom & species guide</h2>
          </div>
        </Reveal>

        <div className="grid gap-5 md:grid-cols-2 md:items-stretch">
          {antivenomInfo.map((item, index) => (
            <Reveal key={item.id} delay={index * 60}>
              <article className="flex h-full flex-col overflow-hidden rounded-[18px] border border-ink/10 bg-surface">
                <div className="flex items-center justify-between border-b border-ink/10 px-5 py-4">
                  <div>
                    <h3 className="font-semibold text-ink">{item.name}</h3>
                    <p className="mt-0.5 text-[10px] uppercase tracking-[.12em] text-ink/35">Species covered</p>
                  </div>
                  <span className="rounded-full bg-olive/10 px-3 py-1.5 text-[9px] font-bold uppercase tracking-wide text-olive">
                    {item.forWhat}
                  </span>
                </div>

                {item.covers.length > 0 && (
                  <div className="grid grid-cols-2 gap-3 p-4 auto-rows-fr">
                    {item.covers.map(species => (
                      <SpeciesCard key={species.name} species={species} caption="Venomous species" />
                    ))}
                  </div>
                )}

                <div className="mt-auto border-t border-ink/10 px-5 py-4">
                  <p className="text-xs leading-5 text-ink/55">{item.details}</p>
                </div>
              </article>
            </Reveal>
          ))}
        </div>

        <Reveal>
          <div className="mt-5 rounded-[18px] border border-clay/15 bg-clay/5 p-5">
            <p className="text-xs font-bold uppercase tracking-[.14em] text-clay">Important</p>
            <h3 className="mt-1 font-semibold text-ink">Species not reliably covered</h3>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {antivenomGaps.map(gap => (
                <div key={gap.id} className="flex items-center gap-3 rounded-xl bg-surface p-3">
                  <SpeciesCard species={gap} compact />
                  <p className="text-xs leading-5 text-ink/60">{gap.note}</p>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </section>
    </main>
  );
}