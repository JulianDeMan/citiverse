import React, { useEffect, useMemo, useState } from "react";

type FieldErrors = Partial<
  Record<"name" | "email" | "subject" | "message" | "consent", string>
>;

export default function FeedbackCard() {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});

  const ids = useMemo(() => {
    const mk = (k: string) => `${k}-${Math.random().toString(36).slice(2, 8)}`;
    return {
      title: mk("title"),
      desc: mk("desc"),
      name: mk("name"),
      email: mk("email"),
      subject: mk("subject"),
      message: mk("message"),
      consent: mk("consent"),
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  function validate(form: FormData): FieldErrors {
    const errs: FieldErrors = {};
    const name = (form.get("name") || "").toString().trim();
    const email = (form.get("email") || "").toString().trim();
    const subject = (form.get("subject") || "").toString().trim();
    const message = (form.get("message") || "").toString().trim();
    const consent = form.get("consent");

    if (!name) errs.name = "Vul je naam in.";
    if (!email) errs.email = "Vul je e-mail in.";
    else if (!/^\S+@\S+\.\S+$/.test(email)) errs.email = "Dit lijkt geen geldig e-mailadres.";
    if (!subject) errs.subject = "Geef een kort onderwerp op.";
    if (!message || message.length < 10) errs.message = "Vertel iets meer (minimaal 10 tekens).";
    if (!consent) errs.consent = "Geef toestemming om je reactie te verwerken.";
    return errs;
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors({});
    const form = new FormData(e.currentTarget);
    const errs = validate(form);
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setBusy(true);
    try {
      // 👉 Hier kun je later een echte endpoint-call toevoegen:
      // await fetch("/api/feedback", { method:"POST", body: JSON.stringify(Object.fromEntries(form)), headers:{ "Content-Type":"application/json" }});
      await new Promise((r) => setTimeout(r, 800));
      setSent(true);
      (e.currentTarget as HTMLFormElement).reset();
    } catch {
      setErrors({ subject: "Versturen mislukt. Probeer later opnieuw." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {/* Kaart */}
      <div className="pv-card">
        <div className="pv-card-header">
          <span className="pv-badge" aria-hidden>💬</span>
          <span>Meedenken</span>
        </div>
        <div className="pv-card-body">
          <p className="pv-text">
            Denk mee over plannen in jouw buurt. Deel ideeën of zorgen – we koppelen terug wat ermee
            gebeurt.
          </p>
          <button
            className="pv-btn pv-btn--primary mt-16"
            onClick={() => { setOpen(true); setSent(false); }}
          >
            ✍️ Geef feedback
          </button>
        </div>
      </div>

      {/* Modal */}
      {open && (
        <div className="pv-modal" role="dialog" aria-modal="true" aria-labelledby={ids.title} aria-describedby={ids.desc}>
          <div className="pv-modal__overlay" onClick={() => setOpen(false)} />
          <div className="pv-modal__panel">
            <div className="pv-modal__header">
              <div>
                <h2 id={ids.title} className="pv-modal__title">Feedback geven</h2>
                <p id={ids.desc} className="pv-muted">
                  Deel je idee, vraag of zorg. We koppelen terug wat ermee gebeurt.
                </p>
              </div>
              <button className="pv-iconbtn" aria-label="Sluiten" onClick={() => setOpen(false)}>✕</button>
            </div>

            <div className="pv-modal__body">
              {sent ? (
                <div className="pv-alert pv-alert--success">
                  <div className="pv-alert__title">Bedankt voor je feedback! ✅</div>
                  <div className="pv-alert__text">We hebben je bericht ontvangen.</div>
                  <div className="mt-16">
                    <button className="pv-btn pv-btn--primary" onClick={() => setOpen(false)}>Sluiten</button>
                  </div>
                </div>
              ) : (
                <form className="pv-form" onSubmit={onSubmit} noValidate>
                  <Field id={ids.name} name="name" label="Naam" placeholder="Bijv. Sam Jansen" error={errors.name} />
                  <Field id={ids.email} name="email" type="email" label="E-mail" placeholder="jij@voorbeeld.nl" error={errors.email} />
                  <Field id={ids.subject} name="subject" label="Onderwerp" placeholder="Kort onderwerp" error={errors.subject} />
                  <TextArea id={ids.message} name="message" label="Bericht" placeholder="Beschrijf je idee of feedback…" error={errors.message} rows={6} />


                  <div className="pv-actions">
                    <button type="button" className="pv-btn pv-btn--ghost" onClick={() => setOpen(false)}>Annuleren</button>
                    <button type="submit" className="pv-btn pv-btn--primary" disabled={busy}>
                      {busy ? "Versturen…" : "Versturen"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ---------- Subcomponents ---------- */

function Field(props: {
  id: string; name: string; label: string; placeholder?: string; type?: string; error?: string;
}) {
  const { id, name, label, placeholder, type = "text", error } = props;
  return (
    <div className="pv-field">
      <label htmlFor={id} className="pv-label">{label}</label>
      <input id={id} name={name} type={type} placeholder={placeholder}
             className={`pv-input ${error ? "is-invalid" : ""}`} aria-invalid={!!error} />
      {error && <div className="pv-error">{error}</div>}
    </div>
  );
}

function TextArea(props: {
  id: string; name: string; label: string; placeholder?: string; rows?: number; error?: string;
}) {
  const { id, name, label, placeholder, rows = 5, error } = props;
  return (
    <div className="pv-field">
      <label htmlFor={id} className="pv-label">{label}</label>
      <textarea id={id} name={name} rows={rows} placeholder={placeholder}
                className={`pv-textarea ${error ? "is-invalid" : ""}`} aria-invalid={!!error} />
      {error && <div className="pv-error">{error}</div>}
    </div>
  );
}
