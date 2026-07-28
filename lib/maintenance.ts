/** True when MAINTENANCE_MODE is enabled (true / 1 / yes). */
export function isMaintenanceMode(): boolean {
  const value = process.env.MAINTENANCE_MODE?.trim().toLowerCase();
  return value === "true" || value === "1" || value === "yes";
}
