(() => {
  if (!Element.prototype.animate) return;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const palette = ["#a84564", "#cf637e", "#ed97a6", "#a33956", "#df8294"];
  const active = new Set();
  const limit = 3;
  const svgNS = "http://www.w3.org/2000/svg";
  const heart = "M12 21C9.8 19.1 2 13.6 2 7.9 2 2 9.2.6 12 5.7 14.8.6 22 2 22 7.9 22 13.6 14.2 19.1 12 21Z";
  const glint = "M12 1Q13 10 22 12Q13 13 12 23Q11 14 2 12Q11 11 12 1Z";

  function clearBurst(origin) {
    active.delete(origin);
    origin.remove();
  }

  function scatter(origin, index, twist) {
    const sparkle = index % 3 === 2;
    const angle = twist + index * Math.PI / 5 + (Math.random() - 0.5) * 0.32;
    const distance = 29 + Math.random() * 35;
    const dx = Math.cos(angle) * distance;
    const dy = Math.sin(angle) * distance;
    const tilt = Math.round(Math.random() * 64 - 32);
    const size = sparkle ? 6 + Math.random() * 5 : 9 + Math.random() * 7;
    const particle = document.createElementNS(svgNS, "svg");
    particle.setAttribute("viewBox", "0 0 24 24");
    particle.setAttribute("width", size);
    particle.setAttribute("height", size);
    particle.setAttribute("focusable", "false");
    particle.style.cssText = "position:absolute;overflow:visible;pointer-events:none";
    particle.style.left = particle.style.top = -size / 2 + "px";
    const shape = document.createElementNS(svgNS, "path");
    shape.setAttribute("d", sparkle ? glint : heart);
    shape.setAttribute("fill", sparkle ? "#d8a24f" : palette[index % palette.length]);
    shape.setAttribute("stroke", "#fff5e9");
    shape.setAttribute("stroke-width", "0.8");
    particle.append(shape);
    origin.append(particle);

    particle.animate([
      { opacity: 0.9, transform: "scale(.32)" },
      { offset: 0.38, opacity: 1, transform: `translate(${dx * .70}px, ${dy * .70 - 3}px) rotate(${tilt}deg) scale(1)` },
      { opacity: 0, transform: `translate(${dx}px, ${dy - 17}px) rotate(${tilt * 1.6}deg) scale(.42)` },
    ], { duration: 520 + Math.random() * 240, easing: "ease-out", fill: "forwards" });
  }

  document.addEventListener("click", event => {
    if (reducedMotion.matches || event.detail === 0 || event.button !== 0) return;
    if (active.size >= limit) clearBurst(active.values().next().value);

    const origin = document.createElement("span");
    origin.className = "letter-heart-burst";
    origin.setAttribute("aria-hidden", "true");
    origin.style.cssText = "position:fixed;width:0;height:0;overflow:visible;pointer-events:none;z-index:2147483647";
    origin.style.left = event.clientX + "px";
    origin.style.top = event.clientY + "px";
    const host = event.target.closest?.("dialog[open]") || document.fullscreenElement || document.body;
    host.append(origin);
    active.add(origin);
    const twist = Math.random() * Math.PI;
    for (let i = 0; i < 10; i++) scatter(origin, i, twist);
    setTimeout(() => clearBurst(origin), 820);
  }, { capture: true, passive: true });

  const clearAll = () => active.forEach(clearBurst);
  window.addEventListener("pagehide", clearAll);
  reducedMotion.addEventListener?.("change", () => {
    if (reducedMotion.matches) clearAll();
  });
})();
