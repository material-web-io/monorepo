// Each logo as its own site draws it (m3.material.io, react-aria.adobe.com, tailwindcss.com/brand),
// one path in one color, in a box its edges touch; and the keyline it is fit to in a 24 by 24 icon.
const logos = {
  'material-design': {
    // m3.material.io's own symbol, material_design, outlined at weight 400 (its font's 960 to
    // the em, flipped): a circle, 20 as Material's circle keyline.
    keyline: 20,
    viewBox: '40 40 880 880',
    d: 'M480 920Q389 920 308.5 885.5Q228 851 168.5 791.5Q109 732 74.5 651.5Q40 571 40 480Q40 389 74.5 309Q109 229 168.5 169Q228 109 308.5 74.5Q389 40 480 40Q571 40 651 74.5Q731 109 791 169Q851 229 885.5 309Q920 389 920 480Q920 571 885.5 651.5Q851 732 791 791.5Q731 851 651 885.5Q571 920 480 920ZM200 706V254Q162 301 141 358.5Q120 416 120 480Q120 545 141 602Q162 659 200 706ZM480 840Q544 840 601 819Q658 798 705 761L254 760Q301 798 358 819Q415 840 480 840ZM253 201H707Q660 163 602.5 141.5Q545 120 480 120Q415 120 357.5 141.5Q300 163 253 201ZM280 680H440L280 361ZM481 581 631 280H330ZM519 680H680V359ZM759 707Q797 660 818.5 602.5Q840 545 840 480Q840 416 819 358.5Q798 301 760 254Z',
  },
  'react-aria': {
    // A square, 16: smaller than Material's square keyline of 18, since its solid mass read
    // larger than the symbols beside it there.
    keyline: 16,
    viewBox: '213.3 206 773.4 789',
    d: 'M720.67 205.995C867.583 205.995 986.679 325.091 986.68 472.003C986.68 590.753 908.865 691.325 801.446 725.521L979.312 948.055C994.438 966.98 980.963 995 956.736 995H795.612C778.743 995 762.715 987.629 751.734 974.823L697.365 911.421L493.126 653.39C457.134 607.918 489.518 540.979 547.511 540.977L720.67 540.971C758.758 540.971 789.635 510.091 789.635 472.003C789.634 433.915 758.758 403.038 720.67 403.038H429.939C404.955 403.038 388.623 391.886 373.994 373.623L277.349 252.966C262.194 234.045 275.664 205.996 299.905 205.995H720.67Z M396.605 720.706C407.798 705.406 430.443 704.843 442.381 719.568L503.816 797.018H502.786L535.569 838.934C548.074 854.358 549.943 877.191 538.047 893.09L476.638 972.545C465.692 986.707 448.803 995 430.903 995H242.276C218.18 995 204.665 967.248 219.523 948.278L337.992 797.018H337.923L396.605 720.706Z',
  },
  tailwind: {
    // A landscape rectangle, the 20 wide of the live area.
    keyline: 20,
    viewBox: '0 0 34.365 20.619',
    d: 'M17.183 0C12.6 0 9.737 2.291 8.59 6.873c1.719-2.29 3.723-3.15 6.014-2.577 1.307.326 2.242 1.274 3.275 2.324 1.685 1.71 3.635 3.689 7.894 3.689 4.582 0 7.445-2.291 8.591-6.872-1.718 2.29-3.723 3.15-6.013 2.576-1.308-.326-2.243-1.274-3.276-2.324C23.39 1.98 21.44 0 17.183 0ZM8.59 10.309C4.01 10.309 1.145 12.6 0 17.182c1.718-2.291 3.723-3.15 6.013-2.577 1.308.326 2.243 1.274 3.276 2.324 1.685 1.71 3.635 3.689 7.894 3.689 4.582 0 7.445-2.29 8.59-6.872-1.718 2.29-3.722 3.15-6.013 2.577-1.307-.327-2.242-1.276-3.276-2.325-1.684-1.71-3.634-3.689-7.893-3.689Z',
  },
}

export type LogoName = keyof typeof logos

/**
 * A logo where a Material Symbol would be: in the color of the text, in the square box of an
 * icon, the size of the nearest icon-*, and as large in it as a symbol is in its own: in the
 * middle of a 24 by 24 box, as large as fits its keyline.
 */
export function Logo({ name }: { name: LogoName }) {
  const { keyline, viewBox, d } = logos[name]
  const inset = (24 - keyline) / 2
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="docs-logo">
      <svg x={inset} y={inset} width={keyline} height={keyline} viewBox={viewBox}>
        <path d={d} />
      </svg>
    </svg>
  )
}
