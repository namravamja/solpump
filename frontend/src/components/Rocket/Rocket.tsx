"use client";

import type React from "react";
import { useEffect, useRef } from "react";

interface RocketProps {
  position?: number;
  size?: number;
  multiplierScaleRef?: React.RefObject<HTMLDivElement | null>;
  flameIntensity?: number;
  smokeDensity?: number;
  speedArray?: number[];
  totalDuration?: number;
}

export default function Rocket({
  position = 20,
  size = 250,
  multiplierScaleRef,
  flameIntensity = 1,
  smokeDensity = 1,
  speedArray = [1, 1, 1],
  totalDuration = 6,
}: RocketProps) {
  const flameRef = useRef<SVGGElement>(null);
  const turbulenceRef = useRef<SVGFETurbulenceElement>(null);
  const frameRef = useRef<number | undefined>(undefined);
  const rocketContainerRef = useRef<HTMLDivElement>(null);
  const motionPathRef = useRef<null | undefined>(undefined);

  useEffect(() => {
    if (!flameRef.current) return;

    const animateTurbulence = () => {
      if (turbulenceRef.current) {
        const time = Date.now() * 0.001;
        turbulenceRef.current.setAttribute(
          "baseFrequency",
          `${0.03 + Math.sin(time * 3) * 0.015} ${
            0.04 + Math.cos(time * 2.5) * 0.02
          }`
        );
        turbulenceRef.current.setAttribute(
          "seed",
          Math.floor(time * 15).toString()
        );
      }
      frameRef.current = requestAnimationFrame(animateTurbulence);
    };

    animateTurbulence();

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [flameIntensity, smokeDensity]);

  return (
    <>
      <div
        ref={rocketContainerRef}
        className="absolute"
        style={{
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
          animation: "jitter 0.2s linear infinite",
        }}
      >
        <svg
          width="220"
          height="180"
          viewBox="0 0 280 300"
          className="absolute"
          style={{
            bottom: "-10px",
            left: "-120px",
            zIndex: 2,
          }}
        >
          <defs>
            <filter
              id="flameTurbulence"
              x="-50%"
              y="-50%"
              width="200%"
              height="200%"
            >
              <feTurbulence
                ref={turbulenceRef}
                baseFrequency="0.03 0.04"
                numOctaves="5"
                result="noise"
                seed="1"
              />
              <feDisplacementMap
                in="SourceGraphic"
                in2="noise"
                scale="20"
                result="displacement"
              />
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="displacement" />
              </feMerge>
            </filter>

            <linearGradient id="flameCore" x1="100%" y1="50%" x2="0%" y2="50%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
              <stop offset="8%" stopColor="#ffffff" stopOpacity="1" />
              <stop offset="15%" stopColor="#00ffff" stopOpacity="0.98" />
              <stop offset="25%" stopColor="#0099ff" stopOpacity="0.95" />
              <stop offset="40%" stopColor="#6600ff" stopOpacity="0.9" />
              <stop offset="60%" stopColor="#9900cc" stopOpacity="0.8" />
              <stop offset="80%" stopColor="#cc0099" stopOpacity="0.6" />
              <stop offset="100%" stopColor="transparent" stopOpacity="0" />
            </linearGradient>

            <linearGradient id="flameMid" x1="100%" y1="50%" x2="0%" y2="50%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
              <stop offset="12%" stopColor="#66ffff" stopOpacity="0.85" />
              <stop offset="25%" stopColor="#0099ff" stopOpacity="0.8" />
              <stop offset="45%" stopColor="#3366ff" stopOpacity="0.75" />
              <stop offset="65%" stopColor="#6600cc" stopOpacity="0.6" />
              <stop offset="85%" stopColor="#990099" stopOpacity="0.4" />
              <stop offset="100%" stopColor="transparent" stopOpacity="0" />
            </linearGradient>

            <linearGradient id="flameOuter" x1="100%" y1="50%" x2="0%" y2="50%">
              <stop offset="0%" stopColor="#99ffff" stopOpacity="0.7" />
              <stop offset="20%" stopColor="#0099ff" stopOpacity="0.6" />
              <stop offset="40%" stopColor="#3366ff" stopOpacity="0.5" />
              <stop offset="60%" stopColor="#6600cc" stopOpacity="0.4" />
              <stop offset="80%" stopColor="#990099" stopOpacity="0.3" />
              <stop offset="100%" stopColor="transparent" stopOpacity="0" />
            </linearGradient>

            <linearGradient id="flameGlow" x1="100%" y1="50%" x2="0%" y2="50%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.6" />
              <stop offset="15%" stopColor="#66ffff" stopOpacity="0.4" />
              <stop offset="35%" stopColor="#0099ff" stopOpacity="0.3" />
              <stop offset="60%" stopColor="#6600cc" stopOpacity="0.2" />
              <stop offset="100%" stopColor="transparent" stopOpacity="0" />
            </linearGradient>

            <filter
              id="intenseGlow"
              x="-100%"
              y="-100%"
              width="300%"
              height="300%"
            >
              <feGaussianBlur stdDeviation="8" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            <radialGradient id="ultraBrightCore" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
              <stop offset="20%" stopColor="#ffffff" stopOpacity="0.95" />
              <stop offset="40%" stopColor="#66ffff" stopOpacity="0.9" />
              <stop offset="70%" stopColor="#0099ff" stopOpacity="0.7" />
              <stop offset="100%" stopColor="transparent" stopOpacity="0" />
            </radialGradient>

            <linearGradient
              id="metallicRed"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop offset="0%" stopColor="#FF6B6B" />
              <stop offset="15%" stopColor="#E53E3E" />
              <stop offset="35%" stopColor="#C53030" />
              <stop offset="55%" stopColor="#9B2C2C" />
              <stop offset="75%" stopColor="#742A2A" />
              <stop offset="100%" stopColor="#4A1D1D" />
            </linearGradient>

            <linearGradient
              id="metallicHighlight"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="0%"
            >
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.6" />
              <stop offset="20%" stopColor="#FED7D7" stopOpacity="0.4" />
              <stop offset="40%" stopColor="#FC8181" stopOpacity="0.3" />
              <stop offset="70%" stopColor="#E53E3E" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#9B2C2C" stopOpacity="0.1" />
            </linearGradient>

            <radialGradient id="metallicShine" cx="30%" cy="20%" r="40%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.8" />
              <stop offset="30%" stopColor="#FED7D7" stopOpacity="0.5" />
              <stop offset="60%" stopColor="#FC8181" stopOpacity="0.2" />
              <stop offset="100%" stopColor="transparent" stopOpacity="0" />
            </radialGradient>

            <linearGradient
              id="metallicShadow"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop offset="0%" stopColor="#742A2A" stopOpacity="0.3" />
              <stop offset="50%" stopColor="#4A1D1D" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#2D1B1B" stopOpacity="0.8" />
            </linearGradient>

            <linearGradient
              id="metallicReflection"
              x1="0%"
              y1="0%"
              x2="0%"
              y2="100%"
            >
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.4" />
              <stop offset="15%" stopColor="#FFF5F5" stopOpacity="0.3" />
              <stop offset="30%" stopColor="transparent" stopOpacity="0" />
              <stop offset="70%" stopColor="transparent" stopOpacity="0" />
              <stop offset="85%" stopColor="#742A2A" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#4A1D1D" stopOpacity="0.4" />
            </linearGradient>

            <radialGradient id="metallicSpotlight" cx="25%" cy="25%" r="60%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.7" />
              <stop offset="20%" stopColor="#FFFFFF" stopOpacity="0.4" />
              <stop offset="40%" stopColor="#FFF5F5" stopOpacity="0.2" />
              <stop offset="80%" stopColor="transparent" stopOpacity="0" />
            </radialGradient>
          </defs>

          <g ref={flameRef} filter="url(#flameTurbulence)">
            <ellipse
              cx="230"
              cy="120"
              rx="180"
              ry="50"
              fill="url(#flameGlow)"
              opacity="0.3"
              filter="url(#intenseGlow)"
            />
            <ellipse
              cx="225"
              cy="120"
              rx="150"
              ry="42"
              fill="url(#flameGlow)"
              opacity="0.5"
            />
            <ellipse
              cx="220"
              cy="120"
              rx="130"
              ry="35"
              fill="url(#flameOuter)"
              opacity="0.8"
            />
            <ellipse
              cx="215"
              cy="120"
              rx="110"
              ry="30"
              fill="url(#flameOuter)"
              opacity="0.9"
            />
            <ellipse
              cx="210"
              cy="120"
              rx="90"
              ry="25"
              fill="url(#flameMid)"
              opacity="0.95"
            />
            <ellipse
              cx="205"
              cy="120"
              rx="70"
              ry="20"
              fill="url(#flameMid)"
              opacity="1"
            />
            <ellipse
              cx="200"
              cy="120"
              rx="55"
              ry="16"
              fill="url(#flameCore)"
              opacity="1"
            />
            <ellipse
              cx="195"
              cy="120"
              rx="40"
              ry="12"
              fill="url(#ultraBrightCore)"
              opacity="1"
              filter="url(#intenseGlow)"
            />
            <ellipse
              cx="190"
              cy="120"
              rx="25"
              ry="8"
              fill="#ffffff"
              opacity="1"
              filter="url(#intenseGlow)"
            />
          </g>
        </svg>

        <svg
          width="200"
          height="200"
          viewBox="0 0 751 749"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ zIndex: 3, position: "relative" }}
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M238.753 447.983C243 427.204 244.537 404.018 242.741 379.741C240.988 356.065 236.253 333.883 229.286 314.317L187.414 317.415C194.381 336.982 199.116 359.164 200.868 382.84C202.665 407.117 201.128 430.303 196.881 451.081L238.753 447.983Z"
            fill="#242E22"
          />
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M235.567 310.245L423.783 296.316C423.747 295.557 423.701 294.797 423.645 294.035C420.246 248.106 380.257 213.628 334.328 217.027L179.106 228.515C174.394 228.864 169.802 229.598 165.359 230.684C192.45 250.178 216.438 277.39 235.567 310.245Z"
            fill="url(#metallicRed)"
          />
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M241.263 439.489L429.479 425.56C429.555 426.316 429.621 427.074 429.678 427.836C433.077 473.765 398.599 513.754 352.67 517.153L197.448 528.641C192.736 528.989 188.086 528.939 183.531 528.519C207.458 505.25 227.179 474.803 241.263 439.489Z"
            fill="url(#metallicRed)"
          />
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M415.346 280.488C382.043 274.578 344.175 271.471 303.984 271.962C273.097 272.34 243.534 274.809 216.322 278.984C224.457 289.248 231.995 300.428 238.842 312.412L417.682 297.084C417.656 296.36 417.62 295.634 417.575 294.907C417.266 289.943 416.509 285.125 415.346 280.488ZM313.263 475.578C279.923 480.566 247.849 482.915 218.409 482.89C227.769 468.516 235.977 452.716 242.858 435.767L421.697 420.439C421.761 421.16 421.816 421.883 421.862 422.61C422.472 432.398 421.292 441.923 418.604 450.856C387.244 461.284 351.504 469.856 313.263 475.578Z"
            fill="#421116"
          />
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M202.714 310.225C213.27 337.551 219.601 368.943 220.319 402.424C220.699 420.187 219.476 437.43 216.843 453.85C260.914 469.25 331.495 473.591 409.188 462.877C502.995 449.942 580.648 418.717 611.314 385.196C622.032 375.524 627.932 364.959 627.93 353.897C627.921 307.715 525.058 270.346 398.18 270.429C315.6 270.484 243.201 286.391 202.714 310.225Z"
            fill="url(#metallicRed)"
          />
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M202.714 310.225C213.27 337.551 219.601 368.943 220.319 402.424C220.699 420.187 219.476 437.43 216.843 453.85C260.914 469.25 331.495 473.591 409.188 462.877C502.995 449.942 580.648 418.717 611.314 385.196C622.032 375.524 627.932 364.959 627.93 353.897C627.921 307.715 525.058 270.346 398.18 270.429C315.6 270.484 243.201 286.391 202.714 310.225Z"
            fill="url(#metallicShadow)"
          />
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M202.714 310.225C213.27 337.551 219.601 368.943 220.319 402.424C220.699 420.187 219.476 437.43 216.843 453.85C260.914 469.25 331.495 473.591 409.188 462.877C502.995 449.942 580.648 418.717 611.314 385.196C622.032 375.524 627.932 364.959 627.93 353.897C627.921 307.715 525.058 270.346 398.18 270.429C315.6 270.484 243.201 286.391 202.714 310.225Z"
            fill="url(#metallicHighlight)"
          />
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M202.714 310.225C213.27 337.551 219.601 368.943 220.319 402.424C220.699 420.187 219.476 437.43 216.843 453.85C260.914 469.25 331.495 473.591 409.188 462.877C502.995 449.942 580.648 418.717 611.314 385.196C622.032 375.524 627.932 364.959 627.93 353.897C627.921 307.715 525.058 270.346 398.18 270.429C315.6 270.484 243.201 286.391 202.714 310.225Z"
            fill="url(#metallicReflection)"
          />
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M202.714 310.225C213.27 337.551 219.601 368.943 220.319 402.424C220.699 420.187 219.476 437.43 216.843 453.85C260.914 469.25 331.495 473.591 409.188 462.877C502.995 449.942 580.648 418.717 611.314 385.196C622.032 375.524 627.932 364.959 627.93 353.897C627.921 307.715 525.058 270.346 398.18 270.429C315.6 270.484 243.201 286.391 202.714 310.225Z"
            fill="url(#metallicShine)"
          />
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M202.714 310.225C213.27 337.551 219.601 368.943 220.319 402.424C220.699 420.187 219.476 437.43 216.843 453.85C260.914 469.25 331.495 473.591 409.188 462.877C502.995 449.942 580.648 418.717 611.314 385.196C622.032 375.524 627.932 364.959 627.93 353.897C627.921 307.715 525.058 270.346 398.18 270.429C315.6 270.484 243.201 286.391 202.714 310.225Z"
            fill="url(#metallicSpotlight)"
          />
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M395.915 464.571C400.313 464.055 404.739 463.491 409.188 462.877C421.027 461.245 432.608 459.321 443.87 457.138C445.027 427.689 444.512 396.306 442.108 363.822C439.703 331.318 435.589 300.183 430.104 271.209C419.67 270.688 409.012 270.422 398.18 270.43C392.579 270.433 387.026 270.51 381.526 270.657C387.405 300.783 391.797 333.321 394.316 367.359C396.827 401.279 397.277 433.999 395.915 464.571ZM318.888 275.596C334.074 273.554 350.013 272.077 366.512 271.238C373.142 303.421 378.066 338.52 380.794 375.379C383.124 406.869 383.68 437.324 382.657 465.986C366.231 467.568 350.244 468.464 334.894 468.716C335.877 440.289 335.311 410.11 333.002 378.916C330.297 342.37 325.433 307.555 318.888 275.596Z"
            fill="url(#paint3_radial_2_148)"
          />
          <ellipse
            cx="364.612"
            cy="372.896"
            rx="18"
            ry="60.375"
            transform="rotate(85.7674 364.612 372.896)"
            fill="url(#paint4_linear_2_148)"
          />
          <path
            d="M366.231 390.825C342.396 392.589 318.759 393.872 296.672 394.599C274.584 395.327 254.477 395.486 237.5 395.066C220.522 394.646 207.006 393.657 197.724 392.154C188.441 390.651 183.574 388.664 183.399 386.307C183.225 383.95 187.747 381.268 196.707 378.415C205.667 375.562 218.89 372.594 235.621 369.68C252.352 366.765 272.263 363.962 294.217 361.43C316.171 358.899 339.739 356.688 363.574 354.924L364.903 372.875L366.231 390.825Z"
            fill="url(#paint5_linear_2_148)"
          />
          <g filter="url(#filter0_d_2_148)">
            <circle
              cx="538.987"
              cy="358.58"
              r="51"
              transform="rotate(85.7674 538.987 358.58)"
              fill="#C4C4C4"
            />
            <g filter="url(#filter1_i_2_148)">
              <circle
                cx="538.987"
                cy="358.58"
                r="27"
                transform="rotate(85.7674 538.987 358.58)"
                fill="#6CCAD7"
              />
            </g>
          </g>
          <defs>
            <filter
              id="filter0_d_2_148"
              x="483.984"
              y="307.578"
              width="110.005"
              height="110.005"
              filterUnits="userSpaceOnUse"
              colorInterpolationFilters="sRGB"
            >
              <feFlood floodOpacity="0" result="BackgroundImageFix" />
              <feColorMatrix
                in="SourceAlpha"
                type="matrix"
                values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                result="hardAlpha"
              />
              <feOffset dy="4" />
              <feGaussianBlur stdDeviation="2" />
              <feComposite in2="hardAlpha" operator="out" />
              <feColorMatrix
                type="matrix"
                values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"
              />
              <feBlend
                mode="normal"
                in2="BackgroundImageFix"
                result="effect1_dropShadow_2_148"
              />
              <feBlend
                mode="normal"
                in="SourceGraphic"
                in2="effect1_dropShadow_2_148"
                result="shape"
              />
            </filter>
            <filter
              id="filter1_i_2_148"
              x="511.986"
              y="331.579"
              width="54.0024"
              height="58.0024"
              filterUnits="userSpaceOnUse"
              colorInterpolationFilters="sRGB"
            >
              <feFlood floodOpacity="0" result="BackgroundImageFix" />
              <feBlend
                mode="normal"
                in="SourceGraphic"
                in2="BackgroundImageFix"
                result="shape"
              />
              <feColorMatrix
                in="SourceAlpha"
                type="matrix"
                values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                result="hardAlpha"
              />
              <feOffset dy="4" />
              <feGaussianBlur stdDeviation="2" />
              <feComposite
                in2="hardAlpha"
                operator="arithmetic"
                k2="-1"
                k3="1"
              />
              <feColorMatrix
                type="matrix"
                values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"
              />
              <feBlend
                mode="normal"
                in2="shape"
                result="effect1_innerShadow_2_148"
              />
            </filter>
            <radialGradient
              id="paint3_radial_2_148"
              cx="0"
              cy="0"
              r="1"
              gradientUnits="userSpaceOnUse"
              gradientTransform="translate(380.059 368.069) rotate(116.597) scale(109.869 107.628)"
            >
              <stop stopColor="white" />
              <stop offset="0.408333" stopColor="white" />
              <stop offset="0.647916" stopColor="white" />
              <stop offset="1" stopColor="#E3E3E3" />
            </radialGradient>
            <linearGradient
              id="paint4_linear_2_148"
              x1="314.204"
              y1="355.309"
              x2="324.8"
              y2="407.597"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#D84444" />
              <stop offset="1" stopColor="#960202" />
            </linearGradient>
            <linearGradient
              id="paint5_linear_2_148"
              x1="414.054"
              y1="318.692"
              x2="300.268"
              y2="400.312"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#D84444" />
              <stop offset="1" stopColor="#960202" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </>
  );
}
