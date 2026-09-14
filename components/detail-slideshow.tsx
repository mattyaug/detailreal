"use client";
import { useEffect, useState } from "react";
const slides = [
  { src: "/paint-correction.jpg", label: "Paint correction", alt: "Machine polishing a car's paintwork" },
  { src: "/interior-vacuum.jpg", label: "Interior care", alt: "Vacuum extraction cleaning a vehicle carpet" },
  { src: "/detailing-care.jpg", label: "The finishing details", alt: "Carefully drying water from a car's exterior trim" },
];
export function DetailSlideshow() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (paused || preference.matches) return;
    const timer = window.setInterval(() => setActive(index => (index + 1) % slides.length), 6000);
    return () => window.clearInterval(timer);
  }, [paused]);
  return <>
    <div className="detail-slides">{slides.map((slide, index) => <img key={slide.src} src={slide.src} alt={slide.alt} aria-hidden={index !== active} className={index === active ? "active" : ""} fetchPriority={index === 0 ? "high" : "auto"} />)}</div>
    <div className="slide-controls" aria-label="Detailing slideshow">
      {slides.map((slide, index) => <button type="button" key={slide.src} aria-pressed={active === index} onClick={() => { setActive(index); setPaused(true); }}>{slide.label}</button>)}
      <button type="button" onClick={() => setPaused(value => !value)}>{paused ? "Play" : "Pause"}</button>
    </div>
  </>;
}

