// Lead form checks. Saving and emailing arrive in Phase 3 (save to `leads` first, then email).

const clean = (v, max) => (typeof v === "string" ? v.trim().slice(0, max) : "");

/** @returns {{ lead: object } | { errors: object }} */
export function validateLead(input) {
  const errors = {};
  const name = clean(input?.name, 80);
  const phone = clean(input?.phone, 30);
  const bestTime = clean(input?.best_time, 80);
  const digits = phone.replace(/\D/g, "");

  if (!name) errors.name = "Please enter your name.";
  if (digits.length < 10 || digits.length > 15) errors.phone = "Please enter a phone number we can call.";
  if (Object.keys(errors).length) return { errors };

  return {
    lead: {
      name,
      phone,
      best_time: bestTime || null,
      consent_texts: input?.consent_texts === true,
    },
  };
}
