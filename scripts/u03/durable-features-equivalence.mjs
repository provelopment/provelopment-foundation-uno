/**
 * `UNO-WO-127 / R01` — the durable Features equivalence proof.
 *
 * The committed durable Components Page is never rewritten (`UNO-WO-123 / R06`), so it still carries the *historical*
 * Features outline the adapter used to compose: one `layout.stack` wrapper holding an authored level-2 heading, a plain
 * prose lede and an ordinary `layout.grid` whose `itemSemantics: "list"` stacks one level-3 title heading per unit.
 * The accepted adapter now composes exactly one native, childless `layout.grid` **features** node carrying the same
 * authored heading, lede and column intent plus an ordered `features[]` of `{title}` units.
 *
 * This module proves those two representations say the same thing. It never exempts the section: identity, module
 * pairing, authored heading and its level, authored lede and its plain-text semantics, column configuration, unit
 * count, unit order, unit titles, the exact authored key set on both sides and the preservation of every absent optional
 * field (body, bodyMarkdown, icon, surface, meta, image, action) are each decided here, and any single disagreement
 * fails the whole predicate. Because every clause is decided from the two nodes alone, an altered, missing, reordered or
 * invented field is detected by construction — the deployment suite mutates each clause to prove it.
 */

/** The one Features family id this proof is closed over. */
export const FEATURES_SECTION_ID = "family-16-features";

/** True when `value` is a non-array object. */
const isRecord = (value) => value !== null && typeof value === "object" && !Array.isArray(value);

/** True when the record owns `key` itself rather than inheriting it. */
const owns = (value, key) => Object.prototype.hasOwnProperty.call(value, key);

/** True when every authored key of `value` is one of `allowed`. */
const keysWithin = (value, allowed) => Object.keys(value).every((key) => allowed.includes(key));

/** True when `value`'s authored key set is exactly `expected`. */
const keysExactly = (value, expected) => {
  const authored = Object.keys(value).sort();
  const wanted = [...expected].sort();
  return authored.length === wanted.length && authored.every((key, index) => key === wanted[index]);
};
/** Every clause of the equivalence, each one load-bearing on its own. */
const NO_CLAUSE = Object.freeze({
  anchor: false,
  representation: false,
  heading: false,
  lede: false,
  columns: false,
  items: false,
  absence: false,
  fields: false,
});



/**
 * Compare the committed historical Features wrapper with the composed native features node.
 *
 * Returns one boolean per clause so a failure names the disagreement instead of reporting an opaque `false`.
 */
export function featuresEquivalenceDelta(committedNode, composedNode) {
  if (!isRecord(committedNode) || !isRecord(composedNode)) return { ...NO_CLAUSE };
  const committedProps = isRecord(committedNode.props) ? committedNode.props : {};
  const composedProps = isRecord(composedNode.props) ? composedNode.props : {};
  const children = Array.isArray(committedNode.children) ? committedNode.children : [];
  const [committedHeading, committedLede, committedGrid] = children;
  const gridProps = isRecord(committedGrid?.props) ? committedGrid.props : {};
  const gridChildren = Array.isArray(committedGrid?.children) ? committedGrid.children : [];
  const features = Array.isArray(composedProps.features) ? composedProps.features : [];

  // Stable section identity: the same id in the same place, with the documented wrapper/native module pairing.
  const anchor = committedNode.id === FEATURES_SECTION_ID
    && composedNode.id === FEATURES_SECTION_ID
    && committedNode.module === "layout.stack"
    && composedNode.module === "layout.grid";

  // The historical outline is exactly heading + lede + grid, and the native node stays authentically childless: its empty
  // consumer list is non-enumerable, so it never serializes as authored `children`.
  const representation = keysExactly(committedProps, [])
    && children.length === 3
    && committedHeading?.module === "content.heading"
    && committedLede?.module === "content.prose"
    && committedGrid?.module === "layout.grid"
    && Array.isArray(composedNode.children)
    && composedNode.children.length === 0
    && !Object.prototype.propertyIsEnumerable.call(composedNode, "children");

  // The authored heading reaches the native node with the donor's own level, never a synthesized or altered one.
  const heading = isRecord(committedHeading?.props)
    && keysExactly(committedHeading.props, ["text", "level"])
    && committedHeading.props.level === 2
    && typeof composedProps.heading === "string"
    && composedProps.level === 2
    && committedHeading.props.text === composedProps.heading;

  // The authored lede is plain prose on both sides, so no Markdown declaration is invented on the native node.
  const lede = isRecord(committedLede?.props)
    && keysExactly(committedLede.props, ["text"])
    && typeof composedProps.lede === "string"
    && !owns(composedProps, "ledeMarkdown")
    && committedLede.props.text === composedProps.lede;


  // The authored column intent is preserved exactly, and only as an authored number.
  const columns = gridProps.columns === composedProps.columns && typeof composedProps.columns === "number";

  // Unit count, order and titles agree one for one; the native unit never overrides the level-3 title contract.
  const items = features.length > 0
    && gridChildren.length === features.length
    && gridChildren.every((stack, index) => {
      const feature = features[index];
      if (!isRecord(feature) || !isRecord(stack)) return false;
      const stackChildren = Array.isArray(stack.children) ? stack.children : [];
      const title = stackChildren[0];
      return stack.module === "layout.stack"
        && stackChildren.length === 1
        && title?.module === "content.heading"
        && isRecord(title?.props)
        && title.props.level === 3
        && !owns(feature, "level")
        && feature.title === title.props.text;
    });

  // Nothing is invented on either side: no body, icon, surface, meta, image or action appears anywhere in this section.
  const absence = !owns(composedProps, "surface")
    && !owns(composedProps, "cards")
    && features.every((feature) => isRecord(feature)
      && !owns(feature, "body")
      && !owns(feature, "bodyMarkdown")
      && !owns(feature, "icon")
      && !owns(feature, "meta")
      && !owns(feature, "image")
      && !owns(feature, "action")
      && !owns(feature, "actions"));

  // Both key sets are closed: the committed outline authors only its own structural keys and the native node only the five
  // authored ones, so a dropped field and an extra field both fail instead of slipping through a permissive comparison.
  const fields = keysExactly(gridProps, ["columns", "itemSemantics"])
    && gridProps.itemSemantics === "list"
    && gridChildren.every((stack) => isRecord(stack) && keysExactly(isRecord(stack.props) ? stack.props : {}, ["gap"]))
    && keysExactly(composedProps, ["features", "columns", "heading", "level", "lede"])
    && features.every((feature) => keysExactly(feature, ["title"]))
    && keysWithin(composedProps, ["features", "columns", "heading", "level", "lede"])
    && keysWithin(gridProps, ["columns", "itemSemantics"]);

  return { anchor, representation, heading, lede, columns, items, absence, fields };
}

/** True only when every equivalence clause holds. */
export function featuresEquivalenceHolds(delta) {
  return Object.values(delta).every((value) => value === true);
}
