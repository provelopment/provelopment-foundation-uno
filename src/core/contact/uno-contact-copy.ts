/**
 * Foundation Uno — localized contact copy (`U05`).
 *
 * WHAT THIS IS. The one table of visitor-facing contact strings, keyed by a language subtag, with a strict English
 * fallback. It exists so the contact surface is localized without importing a framework, a dictionary service or
 * authored copy: these are Uno's own interface strings, fixed and reviewable, not adopter content.
 *
 * WHY A TABLE AND NOT A TEMPLATE LANGUAGE. Every string here is a complete sentence with no markup and no
 * placeholder except one length hint, so a translation can never change the shape of the interface or inject an
 * element. The one parameterised string is formatted by `unoContactLengthHint` from a bound the caller declared.
 *
 * WHAT IT IS NOT. Not a locale negotiation policy: the caller passes the locale tag the publication proved, and an
 * unknown language falls back to English rather than to an empty interface.
 */

/** The exact keys the contact surface asks for. */
export const UNO_CONTACT_COPY_KEYS = Object.freeze([
  "formHeading",
  "labelName",
  "labelEmail",
  "labelMessage",
  "requiredHint",
  "lengthHint",
  "submit",
  "sending",
  "statusInvalid",
  "statusOff",
  "statusUnavailable",
  "statusNotSent",
  "statusOfflineAccepted",
  "statusProviderAccepted",
  "statusRefused",
  "statusAmbiguous",
  "fieldRequired",
  "fieldEmailInvalid",
] as const);

export type UnoContactCopyKey = (typeof UNO_CONTACT_COPY_KEYS)[number];

/** One complete copy set. Every key is required, so a translation cannot silently omit a state. */
export type UnoContactCopy = Readonly<Record<UnoContactCopyKey, string>>;

/** English is the fallback and the reference. */
const ENGLISH: UnoContactCopy = Object.freeze({
  formHeading: "Send a message",
  labelName: "Name",
  labelEmail: "Email",
  labelMessage: "Message",
  requiredHint: "Required.",
  lengthHint: "Up to {count} characters.",
  submit: "Send message",
  sending: "Sending this message now.",
  statusInvalid: "Some fields need attention before this can be sent.",
  statusOff: "Delivery is switched off. Nothing entered here is sent or stored.",
  statusUnavailable: "Messaging is not available right now. Nothing was sent.",
  statusNotSent: "This message was not sent. Nothing has been stored.",
  statusOfflineAccepted: "This demonstration accepted the form but did not send a message.",
  statusProviderAccepted: "This message was handed to the mail service. Receipt is not confirmed.",
  statusRefused: "The mail service refused this message. Nothing was sent.",
  statusAmbiguous: "The result is unknown. The message may not have been sent, so please try again later.",
  fieldRequired: "needs a value",
  fieldEmailInvalid: "needs an address in the form name@example.com",
});

/**
 * Spanish, written as a complete set rather than an overlay: a missing key would be a type error, not a silent
 * English sentence in the middle of a translated form.
 */
const SPANISH: UnoContactCopy = Object.freeze({
  formHeading: "Enviar un mensaje",
  labelName: "Nombre",
  labelEmail: "Correo electrónico",
  labelMessage: "Mensaje",
  requiredHint: "Obligatorio.",
  lengthHint: "Hasta {count} caracteres.",
  submit: "Enviar mensaje",
  sending: "Enviando este mensaje.",
  statusInvalid: "Algunos campos necesitan atención antes de enviar.",
  statusOff: "El envío está desactivado. Nada de lo escrito aquí se envía ni se guarda.",
  statusUnavailable: "La mensajería no está disponible ahora. No se envió nada.",
  statusNotSent: "Este mensaje no se envió. No se ha guardado nada.",
  statusOfflineAccepted: "Esta demostración aceptó el formulario pero no envió un mensaje.",
  statusProviderAccepted: "El mensaje se entregó al servicio de correo. La recepción no está confirmada.",
  statusRefused: "El servicio de correo rechazó este mensaje. No se envió nada.",
  statusAmbiguous: "El resultado es desconocido. Es posible que el mensaje no se haya enviado.",
  fieldRequired: "necesita un valor",
  fieldEmailInvalid: "necesita una dirección con el formato nombre@ejemplo.com",
});

/** The language subtag Uno currently translates. An absent language falls back to English. */
const BY_LANGUAGE: Readonly<Record<string, UnoContactCopy>> = Object.freeze({
  en: ENGLISH,
  es: SPANISH,
});

/**
 * The copy set for one proven locale tag, falling back to English by language subtag and then to English.
 *
 * `en-001` and `en` both resolve to English; a language Uno does not translate resolves to English, which is a
 * visible, honest fallback rather than a half-translated form.
 */
export function unoContactCopy(localeTag: unknown): UnoContactCopy {
  if (typeof localeTag !== "string") return ENGLISH;
  const language = localeTag.trim().toLowerCase().split("-")[0] ?? "";
  return BY_LANGUAGE[language] ?? ENGLISH;
}

/** The one parameterised string, formatted from a bound the caller already declared. */
export function unoContactLengthHint(copy: UnoContactCopy, count: number): string {
  const bounded = Number.isFinite(count) && count > 0 ? Math.floor(count) : 0;
  return copy.lengthHint.replace("{count}", String(bounded));
}

