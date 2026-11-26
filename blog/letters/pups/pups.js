(() => {
  "use strict";
  const scene = document.getElementById("pups");
  if (!scene) return;
  const lineup = scene.querySelector("#pup-lineup");
  const dialog = scene.querySelector(".pup-album");
  const photo = dialog.querySelector(".pup-photo");
  const original = dialog.querySelector(".pup-original");
  const count = dialog.querySelector(".pup-count");
  const close = dialog.querySelector(".pup-close");
  const previous = dialog.querySelector(".pup-prev");
  const next = dialog.querySelector(".pup-next");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  let selected;
  let at = 0;

  function element(tag, className, text) {
    const el = document.createElement(tag);
    el.className = className;
    if (text) el.textContent = text;
    return el;
  }
  function button(className, label, text) {
    const el = element("button", className, text);
    el.type = "button";
    el.setAttribute("aria-label", label);
    return el;
  }
  function showPhoto(position) {
    const pictures = selected.photos;
    at = (position + pictures.length) % pictures.length;
    const entry = pictures[at];
    photo.alt = entry.alt || selected.name + "的第 " + (at + 1) + " 张照片";
    photo.onerror = null;
    if (entry.previewSrc && entry.previewSrc !== entry.src) {
      photo.onerror = () => { photo.onerror = null; photo.src = entry.src; };
    }
    photo.src = entry.previewSrc || entry.src;
    original.href = entry.src;
    count.textContent = (at + 1) + " / " + pictures.length;
  }
  function openAlbum(dog) {
    if (!dog.photos.length) return;
    selected = dog;
    dialog.querySelector("#pup-album-title").textContent = dog.name + "的相册";
    previous.hidden = next.hidden = dog.photos.length < 2;
    showPhoto(0);
    dialog.showModal();
  }
  previous.addEventListener("click", () => showPhoto(at - 1));
  next.addEventListener("click", () => showPhoto(at + 1));
  close.addEventListener("click", () => dialog.close());
  dialog.addEventListener("close", () => {
    photo.onerror = null;
    photo.removeAttribute("src");
    selected = null;
  });
  dialog.addEventListener("keydown", event => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    showPhoto(at + (event.key === "ArrowLeft" ? -1 : 1));
  });
  dialog.addEventListener("click", event => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  });
  let touch;
  photo.addEventListener("pointerdown", event => {
    if (event.pointerType === "touch" && event.isPrimary) {
      touch = {id:event.pointerId, x:event.clientX, y:event.clientY};
      photo.setPointerCapture(event.pointerId);
    }
  });
  photo.addEventListener("pointercancel", () => { touch = null; });
  photo.addEventListener("pointerup", event => {
    if (!touch || event.pointerId !== touch.id) return;
    const dx = event.clientX - touch.x;
    const dy = event.clientY - touch.y;
    touch = null;
    if (Math.abs(dx) > 40 && Math.abs(dx) > 1.4 * Math.abs(dy)) showPhoto(at + (dx < 0 ? 1 : -1));
  });

  function puppy(dog) {
    const card = element("div", "pup-entry");
    const figure = button("pup-figure", "摸摸" + dog.name);
    figure.dataset.pup = dog.id;
    const art = element("img", "pup-render");
    art.src = "pups/" + dog.id + ".webp";
    art.alt = "";
    art.decoding = "async";
    art.draggable = false;
    art.addEventListener("error", () => {
      const first = dog.photos[0];
      if (first) art.src = first.previewSrc || first.src;
    }, {once:true});
    figure.append(art);
    let reactionTimer;
    figure.addEventListener("click", () => {
      clearTimeout(reactionTimer);
      figure.classList.remove("greet");
      void figure.offsetWidth;
      figure.classList.add("greet");
      const status = scene.querySelector("#pup-reaction");
      status.textContent = "你摸了摸" + dog.name + "。";
      reactionTimer = setTimeout(() => {
        figure.classList.remove("greet");
        if (status.textContent === "你摸了摸" + dog.name + "。") status.textContent = "";
      }, 840);
    });
    figure.addEventListener("pointermove", event => {
      if (event.pointerType !== "mouse" || reduced.matches) return;
      const box = figure.getBoundingClientRect();
      const x = (event.clientX - box.left) / box.width - .5;
      figure.style.setProperty("--pup-turn", (x * 14).toFixed(1) + "deg");
      figure.style.setProperty("--pup-lean", (x * 4).toFixed(1) + "deg");
    });
    figure.addEventListener("pointerleave", () => {
      figure.style.removeProperty("--pup-turn");
      figure.style.removeProperty("--pup-lean");
    });
    const tools = element("div", "pup-tools");
    const angles = button("pup-orbit-button", "换个角度看" + dog.name, "换个角度");
    angles.addEventListener("click", () => window.letterPupOrbit.open(dog.id, dog.name, angles));
    if (window.letterPupOrbit?.open) tools.append(angles);
    if (dog.photos.length) {
      const browse = button("pup-browse", "查看" + dog.name + "的照片", "看照片");
      browse.addEventListener("click", () => openAlbum(dog));
      tools.append(browse);
    }
    card.append(figure, element("h3", "pup-name", dog.name));
    if (dog.age && dog.sexLabel) card.append(element("p", "pup-detail", dog.age + " 岁 · " + dog.sexLabel));
    card.append(tools);
    return card;
  }

  async function init() {
    let family = window.letterPups || [];
    if (window.loadLetterPups) {
      try { family = await window.loadLetterPups(); }
      catch { /* The bundled album is also available offline. */ }
    }
    if (!family?.length) return;
    lineup.replaceChildren(...family.map(puppy));
    scene.hidden = false;
  }
  init();
})();
