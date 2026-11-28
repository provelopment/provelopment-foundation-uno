"use client";

/**
 * Foundation Uno — the one client interaction island (`UNO-WO-040 / R01`, U04).
 *
 * WHAT THIS IS. The **sole** `"use client"` boundary of the JSON Page renderer. It owns exactly the three interaction
 * modules that cannot be expressed with native elements alone — `interaction.tabs`, `interaction.modal` and
 * `media.carousel` — and nothing else. Accordion uses native `<details>`, motion and watermark are CSS, and every other
 * module is inert server markup, so no other component in this repository is a client component.
 *
 * WHAT IT MAY TOUCH. Only `react` and the props it is handed. It imports no filesystem module, no provider SDK, no
 * environment value, no `deployment` declaration and no analytics client. Every visible string and every image element
 * arrives **already validated and server-rendered** as a child node, so the island cannot read an authored value it was
 * not given, cannot build a URL and cannot fetch anything: the contact surface stays delivery-OFF because no code here
 * can perform a request.
 *
 * ACCESSIBILITY. Tabs implement the WAI-ARIA tabs pattern with a roving tab stop, ArrowLeft/ArrowRight and Home/End.
 * The modal is a real `<dialog>` opened with `showModal()`, so the platform supplies focus containment, `Escape` and
 * background inertness; focus is returned to the trigger on close. A closed dialog is `display: none`, so its content is
 * neither visible nor exposed. The carousel exposes one truthful current item, a live counter and real buttons.
 *
 * PROVENANCE. Original **Uno-owned** implementation, class **NEW**. No Foundation, Solo or Connect component, hook,
 * context or provider is copied, and no third-party interaction library is used.
 */
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";

/** One tab: the panel it controls and the label that names it. Both were validated before reaching this island. */
export interface UnoTabsIslandTab {
  readonly sectionId: string;
  readonly label: string;
}

/** `interaction.tabs` island props. `panels` is one server-rendered node per tab, in the same order. */
export interface UnoTabsIslandProps {
  readonly id: string;
  readonly label: string;
  readonly tabs: readonly UnoTabsIslandTab[];
  readonly panels: readonly ReactNode[];
}

/**
 * `interaction.tabs`. Selection is deterministic (the first tab), the tab list is a single tab stop, and only the
 * selected panel is rendered visible — an unselected panel is `hidden`, so it is out of the tab order and out of the
 * accessibility tree rather than merely transparent.
 */
export function UnoTabsIsland({ id, label, tabs, panels }: UnoTabsIslandProps) {
  const [active, setActive] = useState(0);
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);

  const select = useCallback((index: number) => {
    const bounded = ((index % tabs.length) + tabs.length) % tabs.length;
    setActive(bounded);
    buttons.current[bounded]?.focus();
  }, [tabs.length]);

  const onKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (event.key === "ArrowRight") {
        event.preventDefault();
        select(active + 1);
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        select(active - 1);
      } else if (event.key === "Home") {
        event.preventDefault();
        select(0);
      } else if (event.key === "End") {
        event.preventDefault();
        select(tabs.length - 1);
      }
    },
    [active, select, tabs.length],
  );

  return (
    <div className="uno-json-tabs" id={id}>
      <div aria-label={label} className="uno-json-tablist" onKeyDown={onKeyDown} role="tablist">
        {tabs.map((tab, index) => (
          <button
            aria-controls={`${id}-panel-${tab.sectionId}`}
            aria-selected={index === active}
            className="uno-json-tab"
            data-uno-active={index === active}
            id={`${id}-tab-${tab.sectionId}`}
            key={tab.sectionId}
            onClick={() => select(index)}
            ref={(node) => {
              buttons.current[index] = node;
            }}
            role="tab"
            tabIndex={index === active ? 0 : -1}
            type="button"
          >
            {tab.label}
          </button>
        ))}
      </div>
      {tabs.map((tab, index) => (
        <div
          aria-labelledby={`${id}-tab-${tab.sectionId}`}
          className="uno-json-tabpanel"
          hidden={index !== active}
          id={`${id}-panel-${tab.sectionId}`}
          key={tab.sectionId}
          role="tabpanel"
          tabIndex={0}
        >
          {panels[index]}
        </div>
      ))}
    </div>
  );
}

/** `interaction.modal` island props. `children` is the one validated content node of the dialog. */
export interface UnoModalIslandProps {
  readonly id: string;
  readonly triggerLabel: string;
  readonly title: string;
  readonly closeLabel: string;
  readonly children: ReactNode;
}

/**
 * `interaction.modal`. A real `<dialog>` opened with `showModal()`, so the platform — not this component — provides the
 * top layer, focus containment, `Escape` and background inertness. The accessible name comes from `aria-labelledby` on
 * a plain element rather than a heading, so a dialog can never disturb the Page's heading outline.
 */
export function UnoModalIsland({ id, triggerLabel, title, closeLabel, children }: UnoModalIslandProps) {
  const dialog = useRef<HTMLDialogElement | null>(null);
  const trigger = useRef<HTMLButtonElement | null>(null);
  const titleId = useId();

  const open = useCallback(() => {
    const node = dialog.current;
    if (node === null || node.open) return;
    node.showModal();
  }, []);

  const close = useCallback(() => {
    const node = dialog.current;
    if (node === null || !node.open) return;
    node.close();
  }, []);

  // Focus returns to the control that opened the dialog, whether it was closed by the button or by `Escape`.
  useEffect(() => {
    const node = dialog.current;
    if (node === null) return undefined;
    const onClose = () => {
      trigger.current?.focus();
    };
    node.addEventListener("close", onClose);
    return () => {
      node.removeEventListener("close", onClose);
    };
  }, []);

  return (
    <div className="uno-json-modal" id={id}>
      <button
        aria-haspopup="dialog"
        className="uno-json-modal-trigger"
        onClick={open}
        ref={trigger}
        type="button"
      >
        {triggerLabel}
      </button>
      <dialog aria-labelledby={titleId} className="uno-json-modal-dialog" ref={dialog}>
        <div className="uno-json-modal-header">
          <p className="uno-json-modal-title" id={titleId}>
            {title}
          </p>
          <button className="uno-json-modal-close" onClick={close} type="button">
            {closeLabel}
          </button>
        </div>
        <div className="uno-json-modal-body">{children}</div>
      </dialog>
    </div>
  );
}

/** `media.carousel` island props. `items` is one server-rendered figure per image, in the authored order. */
export interface UnoCarouselIslandProps {
  readonly id: string;
  readonly label: string;
  readonly count: number;
  readonly items: readonly ReactNode[];
}

/**
 * `media.carousel`. Exactly one item is rendered at a time, so the "current" item the counter announces is the item
 * that is actually present — never a stack of all images with one merely faded. The counter is a polite live region, so
 * a change is announced once rather than on every render.
 */
export function UnoCarouselIsland({ id, label, count, items }: UnoCarouselIslandProps) {
  const [active, setActive] = useState(0);
  if (count < 1 || items.length !== count) return null;

  const step = (delta: number) => {
    setActive((current) => (((current + delta) % count) + count) % count);
  };

  return (
    <div
      aria-label={label}
      aria-roledescription="carousel"
      className="uno-json-carousel"
      id={id}
      role="group"
    >
      <div className="uno-json-carousel-stage">{items[active]}</div>
      <div className="uno-json-carousel-controls">
        <button
          aria-label="Previous image"
          className="uno-json-carousel-button"
          onClick={() => step(-1)}
          type="button"
        >
          Previous
        </button>
        <p aria-live="polite" className="uno-json-carousel-status">
          {`Image ${active + 1} of ${count}`}
        </p>
        <button aria-label="Next image" className="uno-json-carousel-button" onClick={() => step(1)} type="button">
          Next
        </button>
      </div>
    </div>
  );
}


/** `media.video` external-mode consent island props: only already-validated, public provider facts. */
export interface UnoExternalVideoIslandProps {
  readonly id: string;
  readonly provider: string;
  readonly providerLabel: string;
  readonly embedUrl: string;
  readonly externalFallbackUrl: string;
  readonly title: string;
  readonly description?: string;
}

/**
 * The external-video consent variant of the single island.
 *
 * CONSENT FIRST. Until the visitor activates the control, this renders an accessible explanation, one clearly labelled
 * activation button and one ordinary outbound link. There is then **no** `iframe`, no `src`, no preconnect, preload or
 * prefetch, no remote poster, no provider script and no automatic provider request: the fixed-origin frame is mounted
 * only inside the click/keyboard handler, so a plain document load never contacts a third party.
 *
 * HONESTY. A loaded frame is *not* proof of playback. Provider restrictions, regional limits, privacy settings and
 * network faults can all prevent a stream, so the loaded state keeps the outbound link and says plainly that Uno cannot
 * confirm playback. Nothing is retried automatically and no fake success state exists.
 *
 * TEARDOWN. "Unload video" removes the frame entirely and returns focus to the control that opened it, restoring the
 * initial no-third-party state. Consent is deliberately not persisted anywhere — no cookie, storage or analytics.
 */
export function UnoExternalVideoIsland({
  id,
  provider,
  providerLabel,
  embedUrl,
  externalFallbackUrl,
  title,
  description,
}: UnoExternalVideoIslandProps) {
  const [loaded, setLoaded] = useState(false);
  const activateRef = useRef<HTMLButtonElement>(null);

  const load = useCallback(() => {
    setLoaded(true);
  }, []);

  const unload = useCallback(() => {
    setLoaded(false);
    // Return focus to the control that started the session, so the visitor is never dropped at the document root.
    activateRef.current?.focus();
  }, []);

  return (
    <div className="uno-video-consent" data-uno-embed-id={id} data-uno-embed-provider={provider}>
      {loaded ? (
        <>
          <div className="uno-video-frame">
            <iframe
              allow="fullscreen; encrypted-media; picture-in-picture"
              className="uno-video-iframe"
              loading="lazy"
              referrerPolicy="strict-origin-when-cross-origin"
              sandbox="allow-scripts allow-same-origin allow-presentation"
              src={embedUrl}
              title={title}
            />
          </div>
          <div className="uno-video-consent-actions">
            <button className="uno-video-unload" onClick={unload} type="button">
              Unload video
            </button>
            <a className="uno-video-link" href={externalFallbackUrl} rel="noreferrer noopener" target="_blank">
              Open on {providerLabel}
            </a>
          </div>
          <p className="uno-video-consent-note">
            If the player does not start, {providerLabel} may have restricted playback, required a sign-in, or the
            network may be unavailable. Uno cannot confirm whether the video actually played.
          </p>
        </>
      ) : (
        <>
          {description === undefined ? null : <p className="uno-video-consent-note">{description}</p>}
          <p className="uno-video-consent-note">
            This video is hosted by {providerLabel}. Loading it connects your browser to {providerLabel}, which may
            process information under its own terms.
          </p>
          <div className="uno-video-consent-actions">
            <button className="uno-video-activate" onClick={load} ref={activateRef} type="button">
              Load video from {providerLabel}
            </button>
            <a className="uno-video-link" href={externalFallbackUrl} rel="noreferrer noopener" target="_blank">
              Open on {providerLabel}
            </a>
          </div>
        </>
      )}
    </div>
  );
}

/**
 * `U05`: the opt-in contact form. It exists only when the server holds a validated webhook configuration, and it reports exactly
 * four outcomes — accepted by the configured endpoint, invalid, not delivered, unavailable. It never claims a delivery it cannot
 * support, never writes storage and never generates an identifier.
 */


import type { UnoContactField } from "../core/page-document";
import { unoContactLengthHint, type UnoContactCopy } from "../core/contact/uno-contact-copy";

/** The declared client bounds, matching the contract the endpoint enforces. */
const FIELD_LIMITS: Readonly<Record<UnoContactField, number>> = Object.freeze({
  name: 100,
  email: 254,
  message: 4000,
});

/** The readable label of one field, from the active localized copy set. */
function fieldLabel(copy: UnoContactCopy, field: UnoContactField): string {
  return field === "name" ? copy.labelName : field === "email" ? copy.labelEmail : copy.labelMessage;
}

/**
 * What the visitor is told, and only what actually happened.
 *
 * Every state below corresponds to one closed answer the endpoint can give. There is deliberately no generic
 * "sent" state: `accepted` and `accepted-not-sent` are different facts, and `ambiguous` never renders as success.
 */
type Outcome =
  | { readonly kind: "idle" }
  | { readonly kind: "sending" }
  | { readonly kind: "accepted" }
  | { readonly kind: "accepted-not-sent" }
  | { readonly kind: "invalid"; readonly message: string }
  | { readonly kind: "off" }
  | { readonly kind: "unauthorized" }
  | { readonly kind: "unavailable" }
  | { readonly kind: "refused" }
  | { readonly kind: "ambiguous" };

export interface UnoContactFormProps {
  readonly fields: readonly UnoContactField[];
  readonly submitLabel: string;
  /** The served Page's own route path. The endpoint re-plans it and refuses a claim that disagrees. */
  readonly page: string;
  /** The form reference the served Page declares. The endpoint reads it from the Page, not from this value. */
  readonly formRef: string;
  /** The Site whose publication was proved; sent only so the endpoint can compare it with its own proof. */
  readonly siteId: string;
  /** The localized copy set for the Page's proven locale. */
  readonly copy: UnoContactCopy;
}


/** Render one form control with its label, hint and error wiring. */
function Field(props: {
  readonly field: UnoContactField;
  readonly value: string;
  readonly invalid: boolean;
  readonly copy: UnoContactCopy;
  readonly onChange: (value: string) => void;
}) {
  const { field, value, invalid, copy, onChange } = props;
  const id = `uno-contact-${field}`;
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const shared = {
    id,
    name: field,
    required: true,
    value,
    "aria-invalid": invalid ? true : undefined,
    "aria-describedby": invalid ? `${hintId} ${errorId}` : hintId,
    onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange(event.target.value),
  } as const;

  return (
    <div className="uno-contact-field">
      {field === "message" ? (
        <>
          <label htmlFor={id}>{fieldLabel(copy, field)}</label>
          <textarea {...shared} maxLength={FIELD_LIMITS[field]} rows={6} />
        </>
      ) : (
        <>
          <label htmlFor={id}>{fieldLabel(copy, field)}</label>
          <input
            {...shared}
            autoComplete={field === "name" ? "name" : "email"}
            maxLength={FIELD_LIMITS[field]}
            type={field === "email" ? "email" : "text"}
          />
        </>
      )}
      <p className="uno-contact-hint" id={hintId}>
        {field === "message" ? unoContactLengthHint(copy, FIELD_LIMITS[field]) : copy.requiredHint}
      </p>
      {invalid ? (
        <p className="uno-contact-error" id={errorId}>
          {fieldLabel(copy, field)} {field === "email" ? copy.fieldEmailInvalid : copy.fieldRequired}.
        </p>
      ) : null}
    </div>
  );
}

/** The form itself: three fields, one submit control, one status region and one honest outcome. */
export function UnoContactForm({ fields, submitLabel, page, formRef, siteId, copy }: UnoContactFormProps) {
  const [values, setValues] = useState<Record<UnoContactField, string>>({ name: "", email: "", message: "" });
  const [invalid, setInvalid] = useState<readonly UnoContactField[]>([]);
  const [outcome, setOutcome] = useState<Outcome>({ kind: "idle" });
  const [honeypot, setHoneypot] = useState("");
  const summaryRef = useRef<HTMLDivElement | null>(null);
  const formId = `uno-contact-form-${formRef}`;

  const sending = outcome.kind === "sending";

  /** Validate locally first, so an obviously incomplete form never reaches the network. */
  function localProblems(): readonly UnoContactField[] {
    const problems: UnoContactField[] = [];
    for (const field of fields) {
      if (values[field].trim().length === 0) problems.push(field);
      else if (field === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(values[field].trim())) problems.push(field);
    }
    return problems;
  }

  function statusText(): string {
    switch (outcome.kind) {
      case "sending":
        return copy.sending;
      case "accepted":
        return copy.statusProviderAccepted;
      case "accepted-not-sent":
        return copy.statusOfflineAccepted;
      case "off":
        return copy.statusOff;
      case "unauthorized":
        return copy.statusNotSent;
      case "unavailable":
        return copy.statusUnavailable;
      case "refused":
        return copy.statusRefused;
      case "ambiguous":
        return copy.statusAmbiguous;
      default:
        return "";
    }
  }

  async function submit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const problems = localProblems();
    setInvalid(problems);
    if (problems.length > 0) {
      // The summary is rendered by this very update, so focus moves once it exists rather than pointing at nothing.
      setOutcome({ kind: "invalid", message: copy.statusInvalid });
      requestAnimationFrame(() => summaryRef.current?.focus());
      return;
    }

    setOutcome({ kind: "sending" });
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: values.name,
          email: values.email,
          message: values.message,
          website: honeypot,
          page,
          formRef,
          siteId,
        }),
        cache: "no-store",
        credentials: "omit",
        redirect: "manual",
      });
      const body = (await response.json().catch(() => ({}))) as { readonly status?: unknown };
      const status = typeof body.status === "string" ? body.status : "unknown";
      if (response.status === 202 && status === "accepted") setOutcome({ kind: "accepted" });
      else if (response.status === 202 && status === "accepted-not-sent") setOutcome({ kind: "accepted-not-sent" });
      else if (response.status === 400 || response.status === 413) {
        setOutcome({ kind: "invalid", message: copy.statusInvalid });
      } else if (response.status === 403) setOutcome({ kind: "unauthorized" });
      else if (response.status === 409) setOutcome({ kind: "off" });
      else if (response.status === 502) setOutcome({ kind: "refused" });
      else if (response.status === 504) setOutcome({ kind: "ambiguous" });
      else setOutcome({ kind: "unavailable" });
    } catch {
      // A transport failure is ambiguous — never a success and never a retry loop.
      setOutcome({ kind: "ambiguous" });
    }
  }

  return (
    <form className="uno-contact-form" id={formId} noValidate onSubmit={submit}>
      <div aria-live="polite" className="uno-contact-status" role="status">
        {statusText()}
      </div>

      {outcome.kind === "invalid" ? (
        <div className="uno-contact-summary" ref={summaryRef} role="alert" tabIndex={-1}>
          {outcome.message}
        </div>
      ) : null}

      {fields.map((field) => (
        <Field
          copy={copy}
          field={field}
          invalid={invalid.includes(field)}
          key={field}
          onChange={(value) => setValues((current) => ({ ...current, [field]: value }))}
          value={values[field]}
        />
      ))}

      {/* The trap a person never fills in. It is hidden from assistive technology and taken out of the tab order. */}
      <div aria-hidden="true" className="uno-contact-honeypot">
        <label htmlFor={`${formId}-website`}>Website</label>
        <input
          autoComplete="off"
          id={`${formId}-website`}
          name="website"
          onChange={(event) => setHoneypot(event.target.value)}
          tabIndex={-1}
          value={honeypot}
        />
      </div>

      <button aria-busy={sending ? true : undefined} className="uno-contact-submit" disabled={sending} type="submit">
        {sending ? copy.sending : submitLabel}
      </button>
    </form>
  );
}


/**
 * `U05`: the opt-in analytics beacon. It renders nothing, and only when an operator authored an enabled declaration does it post
 * one same-origin `page-view` to `/api/analytics` — no cookie, no storage, no identifier, no referrer, no third-party host.
 */


export interface UnoAnalyticsBeaconProps {
  /** The exact Page path this view reports, already validated by the server. */
  readonly path: string;
}

export function UnoAnalyticsBeacon({ path }: UnoAnalyticsBeaconProps) {
  const sent = useRef(false);

  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    // One fire-and-forget request, same origin, no credentials, no referrer, no cache. A failure is deliberately silent: an
    // opt-in measurement must never disturb the Page or the visitor.
    void fetch("/api/analytics", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ event: "page-view", path }),
      cache: "no-store",
      credentials: "omit",
      referrerPolicy: "no-referrer",
      keepalive: true,
      redirect: "manual",
    }).catch(() => undefined);
  }, [path]);

  return null;
}
