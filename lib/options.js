// Customer-facing labels for a field's enum options, from the client's own rules.
// A service_id option uses that service's label; everything else is the option made readable.

export const humanize = (option) => String(option).replace(/_/g, " ");

const capitalize = (s) => s.replace(/^./, (c) => c.toUpperCase());

export function optionLabel(rules, field, option) {
  if (option === "unknown") return "Not sure";
  const service = field.id === "service_id" ? rules.services?.find((s) => s.id === option) : null;
  return service ? service.label : capitalize(humanize(option));
}
