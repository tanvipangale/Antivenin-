export const registeredHospitals = [
  {
    id: 'reg-1',
    name: 'Wockhardt Hospital, Mira Road',
    address: 'Mira Road East, Thane, Maharashtra 401107',
    verified: true,
    stock: [
      { id: 'av-1', name: 'Polyvalent (Big Four) antivenom', quantity: 9, updatedAt: '2026-07-20T09:14:00Z' },
      { id: 'av-2', name: 'Scorpion antivenom', quantity: 0, updatedAt: '2026-07-18T15:02:00Z' },
    ],
  },
];

export function findRegisteredMatch(osmName) {
  if (!osmName) return null;
  const normalize = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
  const target = normalize(osmName);
  return (
    registeredHospitals.find((h) => {
      const n = normalize(h.name);
      return target.includes(n) || n.includes(target);
    }) || null
  );
}