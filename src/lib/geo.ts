/** Approximate position (rounded to ~1 km). Only called when the user has enabled location. */
export function getApproxLocation(): Promise<{ lat: number; lon: number } | undefined> {
  return new Promise((resolve) => {
    if (!('geolocation' in navigator)) return resolve(undefined);
    navigator.geolocation.getCurrentPosition(
      (p) =>
        resolve({
          lat: Math.round(p.coords.latitude * 100) / 100,
          lon: Math.round(p.coords.longitude * 100) / 100,
        }),
      () => resolve(undefined),
      { maximumAge: 600_000, timeout: 5000, enableHighAccuracy: false },
    );
  });
}
