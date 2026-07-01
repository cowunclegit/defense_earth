export const clonePlanets = (planets) => {
  if (!planets) return {};
  const copy = {};
  for (const planetId of Object.keys(planets)) {
    const p = planets[planetId];
    copy[planetId] = {
      ...p,
      groundBasesList: p.groundBasesList ? { ...p.groundBasesList } : {},
      groundBaseTimers: p.groundBaseTimers ? { ...p.groundBaseTimers } : {},
      orbitalSatellitesList: p.orbitalSatellitesList ? { ...p.orbitalSatellitesList } : {},
      satelliteTimers: p.satelliteTimers ? { ...p.satelliteTimers } : {},
      orbitalStationsList: p.orbitalStationsList ? { ...p.orbitalStationsList } : {},
      stationTimers: p.stationTimers ? { ...p.stationTimers } : {},
      infrastructure: p.infrastructure ? { ...p.infrastructure } : {}
    };
  }
  return copy;
};
