"use client";

// The sample estimate on the home page. Every result it shows was computed on the server by
// engine/price.js and passed in as `variants`; this component only picks one. It never sees
// the price list and never does math (golden rule 1).

import { useState } from "react";

const OPTIONS = [
  { id: "texture", label: "Wall texture", choices: [["smooth", "Smooth"], ["knockdown", "Knockdown"]] },
  { id: "paint", label: "Paint the patches", choices: [["yes", "Yes"], ["no", "No"]] },
  { id: "water", label: "Water stains nearby", choices: [["no", "No"], ["yes", "Yes"]] },
];

const usd = (n) => `$${n.toLocaleString("en-US")}`;

export default function EstimateSheet({ businessName, jobSummary, variants }) {
  const [picked, setPicked] = useState({ texture: "smooth", paint: "yes", water: "no" });
  const result = variants[`${picked.texture}|${picked.paint}|${picked.water}`];
  const ok = result?.status === "ok";

  return (
    <figure className="sc-sheet" aria-label="Sample estimate">
      <div className="sc-sheet-head">
        <span className="sc-sheet-from">{businessName}</span>
        <span className={ok ? "sc-chip" : "sc-chip sc-chip-review"}>{ok ? "Estimate, not a quote" : "Needs a person"}</span>
      </div>

      <p className="sc-sheet-job">{jobSummary}</p>

      <div className="sc-sheet-options">
        {OPTIONS.map((opt) => (
          <fieldset key={opt.id} className="sc-seg">
            <legend className="sc-seg-label">{opt.label}</legend>
            <div className="sc-seg-buttons">
              {opt.choices.map(([value, text]) => (
                <button
                  key={value}
                  type="button"
                  id={`sc-${opt.id}-${value}`}
                  aria-pressed={picked[opt.id] === value}
                  onClick={() => setPicked((p) => ({ ...p, [opt.id]: value }))}
                >
                  {text}
                </button>
              ))}
            </div>
          </fieldset>
        ))}
      </div>

      <div className="sc-sheet-result" aria-live="polite">
        {ok ? (
          <>
            <ul className="sc-lines">
              {result.line_items.map((item) => (
                <li key={item.id}>
                  <span>{item.label}</span>
                  <span className="sc-leader" aria-hidden="true" />
                  <span className="sc-amount">{usd(item.amount)}</span>
                </li>
              ))}
            </ul>
            <p className="sc-range">
              <span className="sc-range-label">Estimated range</span>
              <span className="sc-range-value">
                {usd(result.low)} to {usd(result.high)}
              </span>
            </p>
          </>
        ) : (
          <div className="sc-review">
            <p className="sc-review-title">No price shown for this one.</p>
            <p>{result?.reasons?.[0]}</p>
            <p>The contractor calls to set up an inspection first.</p>
          </div>
        )}
      </div>

      <ol className="sc-track" aria-label="Where this estimate is">
        <li aria-current={ok ? "step" : undefined}>Estimate</li>
        <li aria-current={ok ? undefined : "step"}>Contractor checks the job</li>
        <li>Firm quote</li>
      </ol>
    </figure>
  );
}
