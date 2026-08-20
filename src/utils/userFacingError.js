// Do not surface server, network, or device implementation details in alerts.
export function getUserFacingError(_error, fallback) {
  return fallback;
}
