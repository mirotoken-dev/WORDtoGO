import { useEffect, useRef, useState } from "react";

const css = `
.mascot{display:block;cursor:pointer;-webkit-tap-highlight-color:transparent}
.mascot .char{transform-box:fill-box;transform-origin:50% 100%}
.mascot .eyes{transform-box:fill-box;transform-origin:50% 50%;animation:mascot-blink 4s infinite}
.mascot .pupil{transition:transform .3s}
.mascot .m{opacity:0;transition:opacity .15s}
.mascot .arm{transform-box:fill-box;transition:transform .25s ease-out}
.mascot .arm-l{transform-origin:70% 12%}
.mascot .arm-r{transform-origin:30% 12%}
.mascot .spark{transform-box:fill-box;transform-origin:50% 50%;opacity:0}
.mascot.idle .char{animation:mascot-breathe 3.2s ease-in-out infinite}
.mascot.tap .char{animation:mascot-squish .65s ease-out}
.mascot.happy .char{animation:mascot-jump .6s ease-in-out 2}
.mascot.sad .char{animation:mascot-droop .8s ease-out forwards}
.mascot.idle .m-idle,.mascot.tap .m-idle{opacity:1}
.mascot.happy .m-happy{opacity:1}
.mascot.sad .m-sad,.mascot.sad .tear{opacity:1}
.mascot.sad .pupil{transform:translateY(5px)}
.mascot.happy .arm-l{transform:rotate(130deg)}
.mascot.happy .arm-r{transform:rotate(-130deg)}
.mascot.happy .spark{animation:mascot-pop .75s ease-out 2}
@keyframes mascot-breathe{0%,100%{transform:scale(1,1)}50%{transform:scale(1.025,.975)}}
@keyframes mascot-squish{0%{transform:scale(1,1)}25%{transform:scale(1.1,.88)}55%{transform:translateY(-26px) scale(.95,1.06)}80%{transform:translateY(0) scale(1.06,.94)}100%{transform:scale(1,1)}}
@keyframes mascot-jump{0%{transform:translateY(0) scale(1,1)}20%{transform:scale(1.08,.92)}50%{transform:translateY(-34px) scale(.96,1.05)}80%{transform:translateY(0) scale(1.06,.94)}100%{transform:scale(1,1)}}
@keyframes mascot-droop{0%{transform:scale(1,1)}100%{transform:translateY(6px) scale(1.03,.92)}}
@keyframes mascot-blink{0%,90%,100%{transform:scaleY(1)}95%{transform:scaleY(.08)}}
@keyframes mascot-pop{0%{opacity:0;transform:scale(.2) rotate(0deg)}40%{opacity:1;transform:scale(1.2) rotate(40deg)}100%{opacity:0;transform:scale(.6) rotate(90deg)}}
@media (prefers-reduced-motion:reduce){.mascot .char,.mascot .eyes,.mascot .spark{animation:none!important}}
`;

/**
 * Animated mascot.
 *
 * Props:
 *   mood    "idle" | "happy" | "sad"   (default "idle")
 *   size    width in px                (default 240)
 *   onTap   called when the mascot is tapped
 *
 * Tapping plays a short bounce, then returns to the current mood.
 * To replay "happy" for two correct answers in a row, change the `key` prop.
 */
export default function Mascot({ mood = "idle", size = 240, onTap }) {
  const [tapped, setTapped] = useState(false);
  const timer = useRef(null);

  useEffect(() => () => clearTimeout(timer.current), []);

  const handleTap = () => {
    clearTimeout(timer.current);
    setTapped(false);
    requestAnimationFrame(() => {
      setTapped(true);
      timer.current = setTimeout(() => setTapped(false), 700);
    });
    if (onTap) onTap();
  };

  const state = tapped ? "tap" : mood;

  return (
    <>
      <style>{css}</style>
      <svg
        className={`mascot ${state}`}
        viewBox="0 0 380 300"
        width={size}
        role="img"
        aria-label="Friendly purple mascot"
        onClick={handleTap}
      >
        <ellipse cx="190" cy="278" rx="92" ry="9" fill="#6FCDB9" />
        <g className="char">
          <ellipse cx="150" cy="268" rx="28" ry="12" fill="#6D28D9" />
          <ellipse cx="230" cy="268" rx="28" ry="12" fill="#6D28D9" />
          <circle cx="118" cy="122" r="24" fill="#7C3AED" />
          <circle cx="118" cy="122" r="12" fill="#FDBA74" />
          <circle cx="262" cy="122" r="24" fill="#7C3AED" />
          <circle cx="262" cy="122" r="12" fill="#FDBA74" />
          <ellipse cx="190" cy="190" rx="88" ry="78" fill="#8B5CF6" />
          <ellipse cx="190" cy="220" rx="50" ry="40" fill="#FDBA74" />
          <ellipse className="arm arm-l" cx="104" cy="204" rx="14" ry="26" fill="#7C3AED" />
          <ellipse className="arm arm-r" cx="276" cy="204" rx="14" ry="26" fill="#7C3AED" />
          <g className="eyes">
            <ellipse cx="158" cy="165" rx="27" ry="31" fill="#FFFFFF" />
            <ellipse cx="222" cy="165" rx="27" ry="31" fill="#FFFFFF" />
            <circle className="pupil" cx="163" cy="170" r="13" fill="#2E1065" />
            <circle className="pupil" cx="217" cy="170" r="13" fill="#2E1065" />
            <circle cx="167" cy="164" r="4.5" fill="#FFFFFF" />
            <circle cx="221" cy="164" r="4.5" fill="#FFFFFF" />
          </g>
          <circle cx="125" cy="198" r="10" fill="#F472B6" opacity="0.7" />
          <circle cx="255" cy="198" r="10" fill="#F472B6" opacity="0.7" />
          <path className="m m-idle" d="M170 198 Q190 214 210 198" fill="none" stroke="#2E1065" strokeWidth="4" strokeLinecap="round" />
          <g className="m m-happy">
            <path d="M164 194 Q190 240 216 194 Z" fill="#3B0764" />
            <ellipse cx="190" cy="218" rx="11" ry="6" fill="#F472B6" />
          </g>
          <path className="m m-sad" d="M172 210 Q190 194 208 210" fill="none" stroke="#2E1065" strokeWidth="4" strokeLinecap="round" />
          <path className="m tear" d="M238 192 q-6 10 0 14 q6 -4 0 -14Z" fill="#7DD3FC" />
        </g>
        <g transform="translate(66,112)"><path className="spark" d="M0 -11L3 -3L11 0L3 3L0 11L-3 3L-11 0L-3 -3Z" fill="#FDE047" /></g>
        <g transform="translate(316,102)"><path className="spark" d="M0 -11L3 -3L11 0L3 3L0 11L-3 3L-11 0L-3 -3Z" fill="#FB923C" /></g>
        <g transform="translate(338,188)"><path className="spark" d="M0 -9L2.5 -2.5L9 0L2.5 2.5L0 9L-2.5 2.5L-9 0L-2.5 -2.5Z" fill="#FDE047" /></g>
        <g transform="translate(46,196)"><path className="spark" d="M0 -9L2.5 -2.5L9 0L2.5 2.5L0 9L-2.5 2.5L-9 0L-2.5 -2.5Z" fill="#F472B6" /></g>
      </svg>
    </>
  );
}
