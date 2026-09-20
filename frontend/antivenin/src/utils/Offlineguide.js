import { helplines } from '../data/Helplines';
import { biteTypes } from '../data/BiteTypes';

export function buildOfflineGuideText() {
  const speciesLines = biteTypes.flatMap((b) => [
    '',
    `${b.label.toUpperCase()}:`,
    ...b.steps.map((s, i) => `${i + 1}. ${s}`),
  ]);

  const lines = [
    'ANTIVENIN — OFFLINE EMERGENCY GUIDE',
    'First aid by type of bite or sting',
    '='.repeat(40),
    ...speciesLines,
    '',
    'DO NOT (applies to all of the above):',
    '- Do not cut the wound',
    '- Do not suck out venom',
    '- Do not apply ice or a tourniquet',
    '- Do not give alcohol or painkillers unless a doctor says so',
    '',
    'MILD SYMPTOMS:',
    '- Keep the limb still and at or slightly below heart level',
    "- Don't apply ice, heat, or any ointment",
    "- Don't take painkillers unless a doctor tells you to",
    '- Get to a hospital anyway — mild symptoms can escalate fast',
    '',
    'SEVERE SYMPTOMS:',
    '- This is a medical emergency — call for emergency transport immediately',
    '- Loosen tight clothing, keep the person lying down',
    '- Do not give food or water',
    '- If breathing stops, begin CPR if trained, and continue until help arrives',
    '',
    'HELPLINE NUMBERS:',
    ...helplines.map((h) => `- ${h.label}: ${h.number}${h.limitedAvailability ? ' (limited availability — see app for details)' : ''}`),
    '',
    '='.repeat(40),
    'Saved from the Antivenin app for offline use.',
    'This is first-aid guidance only, not a substitute for professional',
    'medical treatment — get to a hospital as soon as possible.',
  ];
  return lines.join('\n');
}

export function downloadOfflineGuide() {
  const text = buildOfflineGuideText();
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'antivenin-offline-emergency-guide.txt';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
