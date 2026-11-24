/** Last 10 digits of a phone number, so "+1 (613) 555-0199" and "613.555.0199" match. */
export function phoneKey(p: string) {
  const d = (p || "").replace(/\D/g, "");
  return d.length > 10 ? d.slice(-10) : d;
}
