(() => {
  "use strict";

  const gallery = document.getElementById("portrait-list");
  if (!gallery) return;

  const styles = new Map([
    ["氛围感", "reel"], ["可爱风", "prints"], ["韩系风", "contact"],
    ["小公主", "fan"], ["清纯风", "book"], ["忧郁风", "dusk"]
  ]);
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  const playback = new EventTarget();
  const preferenceKey = "letters-gallery-paused";
  let automatic = !motion.matches;
  try {
    if (localStorage.getItem(preferenceKey) === "yes") automatic = false;
  } catch { /* The album also works with browser storage disabled. */ }
  document.documentElement.toggleAttribute("data-album-paused", !automatic);
  function setAutomatic(value, remember = false) {
    automatic = value;
    document.documentElement.toggleAttribute("data-album-paused", !automatic);
    if (remember) {
      try { localStorage.setItem(preferenceKey, value ? "no" : "yes"); } catch {}
    }
    playback.dispatchEvent(new Event("change"));
  }
  motion.addEventListener("change", event => {
    if (event.matches) setAutomatic(false);
  });
  const intervals = {reel:2200, prints:2400, contact:2300, fan:2550, book:2750, dusk:2450};
  const wrap = (i, n) => (i % n + n) % n;

  function make(tag, className, text) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text) el.textContent = text;
    return el;
  }

  function button(className, label, text, callback) {
    const el = make("button", className, text);
    el.type = "button";
    el.title = label;
    el.setAttribute("aria-label", label);
    if (callback) el.addEventListener("click", callback);
    return el;
  }

  function edgeButtons(step, fullSize = false) {
    const label = fullSize ? "原图" : "照片";
    return [
      button("fg-edge fg-prev", (fullSize ? "查看" : "") + "上一张" + label, "", () => step(-1)),
      button("fg-edge fg-next", (fullSize ? "查看" : "") + "下一张" + label, "", () => step(1))
    ];
  }

  function enableSwipe(surface, step) {
    let start = null;
    let swiped = false;
    surface.addEventListener("pointerdown", event => {
      if (!event.isPrimary) return;
      swiped = false;
      start = null;
      if (event.pointerType !== "touch" || event.target.closest(".fg-contact-rail")) return;
      start = {id: event.pointerId, x: event.clientX, y: event.clientY};
    });
    surface.addEventListener("pointercancel", () => { start = null; });
    surface.addEventListener("pointerup", event => {
      if (!start || event.pointerId !== start.id) return;
      const dx = event.clientX - start.x, dy = event.clientY - start.y;
      start = null;
      if (Math.abs(dx) > 40 && Math.abs(dx) > 1.4 * Math.abs(dy)) {
        swiped = true;
        step(dx < 0 ? 1 : -1);
      }
    });
    // A swipe ending over a photo or an edge button should advance just once.
    surface.addEventListener("click", event => {
      if (swiped && event.detail > 0) {
        swiped = false;
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    }, true);
  }

  function photoImage(record, alt = "") {
    const img = make("img");
    img.alt = alt;
    img.loading = "lazy";
    img.decoding = "async";
    img.draggable = false;
    img.src = record.previewSrc || record.src;
    return img;
  }

  function viewer() {
    const dialog = make("dialog", "fg-viewer");
    dialog.setAttribute("aria-label", "查看完整照片");
    const figure = make("figure");
    const image = make("img");
    const caption = make("figcaption");
    const count = make("span", "fg-view-count");
    count.setAttribute("aria-live", "polite");
    count.setAttribute("aria-atomic", "true");
    const footer = make("div", "fg-view-bar");
    let active;
    function update() {
      const record = active.current();
      image.src = record.src;
      image.alt = record.alt || record.caption || "fanfan 的照片";
      caption.textContent = record.caption || "";
      count.textContent = active.position();
      previous.hidden = next.hidden = active.size < 2;
    }
    function step(by) {
      if (active.size > 1) active.step(by);
      update();
    }
    const [previous, next] = edgeButtons(step, true);
    const close = button("fg-key fg-close", "关闭大图", "×", () => dialog.close());
    footer.append(count, close);
    figure.append(image, caption);
    dialog.append(figure, previous, next, footer);
    document.body.append(dialog);
    dialog.addEventListener("click", e => { if (e.target === dialog) dialog.close(); });
    dialog.addEventListener("close", () => {
      active = null;
      image.removeAttribute("src");
      playback.dispatchEvent(new Event("view"));
    });
    enableSwipe(dialog, step);
    dialog.addEventListener("keydown", e => {
      if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        e.preventDefault();
        step(e.key === "ArrowRight" ? 1 : -1);
      }
    });
    return album => {
      active = album;
      update();
      dialog.showModal();
      playback.dispatchEvent(new Event("view"));
      close.focus();
    };
  }

  // At rest the middle print is always current. For a film advance the entire
  // strip travels one frame before its five reusable positions are recentered.
  function film(stage, items, select) {
    const strip = make("div", "fg-film-strip");
    stage.append(strip);
    const slots = [];
    const offsets = items.length === 1 ? [0] : [2, 1, 0, -1, -2];
    for (const offset of offsets) {
      const slot = button("fg-print", "切换照片");
      slot.style.setProperty("--slot", offset * -1);
      slot.tabIndex = -1;
      slot.append(make("img"));
      slot.firstChild.draggable = false;
      slot.firstChild.loading = "lazy";
      slot.firstChild.alt = "";
      slot.addEventListener("click", () => select(Number(slot.dataset.index), true));
      strip.append(slot);
      slots.push(slot);
    }
    let animation;
    function paint(index) {
      slots.forEach((slot, i) => {
        const at = wrap(index + offsets[i], items.length);
        slot.dataset.index = at;
        slot.firstChild.src = items[at].previewSrc || items[at].src;
        slot.classList.toggle("fg-active", offsets[i] === 0);
        slot.setAttribute("aria-label", "查看第 " + (at + 1) + " 张照片");
      });
    }
    return (index, old, delta) => {
      if (animation) animation.cancel();
      if (old === undefined || Math.abs(delta) !== 1 || motion.matches || items.length < 2) {
        paint(index); return;
      }
      paint(old);
      const pitch = slots[0].offsetWidth + (parseFloat(getComputedStyle(strip).getPropertyValue("--pitch-gap")) || 14);
      animation = strip.animate([
        {transform:"translateX(0)"}, {transform:"translateX(" + (Math.sign(delta) * pitch) + "px)"}
      ], {duration:420, easing:"cubic-bezier(.22,.72,.22,1)"});
      animation.onfinish = () => { paint(index); animation = null; };
    };
  }

  // Each print is a physical layer. Its distance from the selected print
  // controls its position, rotation and stacking order in the composition.
  function layers(stage, items, mode, select) {
    const cards = items.map((record, i) => {
      const card = button("fg-print", "查看第 " + (i+1) + " 张照片", "", () => select(i, true));
      card.tabIndex = -1;
      const img = photoImage(record);
      if (mode === "fan") {
        img.addEventListener("load", () => {
          img.classList.toggle("fg-landscape", img.naturalWidth > img.naturalHeight);
        }, {once: true});
      }
      card.append(img);
      stage.append(card);
      return card;
    });
    return index => {
      cards.forEach((card, i) => {
        let offset = wrap(i-index, items.length);
        if (offset > items.length/2) offset -= items.length;
        const visible = Math.abs(offset) <= (mode === "dusk" ? 1 : 2);
        card.style.setProperty("--offset", Math.max(-2, Math.min(2, offset)));
        card.style.setProperty("--depth", Math.abs(offset));
        card.style.zIndex = String(5 - Math.min(4, Math.abs(offset)));
        card.classList.toggle("fg-active", offset === 0);
        card.classList.toggle("fg-outside", !visible);
        card.setAttribute("aria-hidden", String(!visible));
      });
    };
  }

  function selection(stage, items, mode, select) {
    const panel = button("fg-main-print", "轻点翻到下一张");
    panel.tabIndex = -1;
    stage.append(panel);
    let index = 0;
    panel.addEventListener("click", () => select(index, true));
    const thumbs = [];
    let facing;
    if (mode === "contact") {
      if (items.length > 1) {
        facing = button("fg-companion", "翻到下一张照片", "", () => select(wrap(index+1, items.length)));
        facing.tabIndex = -1;
        stage.append(facing);
      }
      const rail = make("div", "fg-contact-rail");
      rail.setAttribute("aria-label", "选取照片");
      items.forEach((record, i) => {
        const thumb = button("fg-contact-thumb", "选择第 " + (i+1) + " 张照片", "", () => select(i));
        thumb.append(photoImage(record));
        thumbs.push(thumb);
        rail.append(thumb);
      });
      stage.append(rail);
    } else {
      facing = button("fg-facing", "翻到右页照片");
      facing.tabIndex = -1;
      facing.addEventListener("click", () => select(wrap(index+1, items.length), false));
      if (items.length>1) stage.append(facing);
    }
    return (at, old, delta) => {
      index = at;
      panel.replaceChildren(photoImage(items[at]));
      if (facing) facing.replaceChildren(photoImage(items[wrap(at+1, items.length)]));
      if (old !== undefined && !motion.matches) {
        if (mode === "book") {
          const leaf = delta < 0 ? facing : panel;
          leaf.animate([{ transform:"perspective(600px) rotateY("+(delta<0?-58:58)+"deg)", opacity:.48 }, {transform:"none",opacity:1}],
            {duration:490, easing:"cubic-bezier(.2,.8,.2,1)"});
        } else {
          panel.firstChild.animate([{opacity:.35, transform:"translateX(-4%) scale(1.04)"},{opacity:1,transform:"none"}],
            {duration:450,easing:"cubic-bezier(.25,.7,.25,1)"});
          facing?.firstChild.animate([{opacity:.35,transform:"translateY(7%)"},{opacity:1,transform:"none"}],
            {duration:460,easing:"ease-out"});
        }
      }
      thumbs.forEach((t,i) => t.setAttribute("aria-pressed", String(i===at)));
      const activeThumb = thumbs[at];
      if (activeThumb && old !== undefined) {
        const rail = activeThumb.parentElement;
        rail.scrollLeft += activeThumb.getBoundingClientRect().left - rail.getBoundingClientRect().left
          - (rail.clientWidth - activeThumb.offsetWidth)/2;
      }
    };
  }

  function buildAlbum(items, mode, number, openViewer) {
    const root = make("section", "fg-album fg-" + mode);
    root.setAttribute("aria-label", "第 " + number + " 组照片");
    const stage = make("div", "fg-stage");
    const surface = make("div", "fg-stage-shell");
    const controls = make("div", "fg-controls");
    const count = make("span","fg-count");
    count.setAttribute("aria-atomic", "true");
    const info = make("div","fg-info");
    const caption = make("p","fg-caption");
    let at=0;
    let onScreen=false, timer=0, pressing=false, entering=true;
    const delay=intervals[mode];
    root.style.setProperty("--fg-duration", delay+"ms");
    const play = playbackButton(true);
    function schedule() {
      clearTimeout(timer);
      const focus = document.activeElement;
      const reading = root.contains(focus) && focus !== play && focus.matches(":focus-visible");
      const running = automatic && items.length>1 && onScreen && !document.hidden
        && !pressing && !reading && !document.querySelector(".fg-viewer[open]");
      count.setAttribute("aria-live", running ? "off" : "polite");
      root.classList.toggle("fg-running", running);
      if (running) timer=setTimeout(() => step(1), entering ? Math.min(1900, delay - 650) : delay);
    }
    function step(delta) {
      if (items.length<2) return;
      const old = at;
      entering=false;
      at=wrap(at+delta,items.length);
      redraw(at,old,delta); sync();
    }
    function select(index, advanceCurrent=false) {
      if (index===at && advanceCurrent) step(1);
      else if (index!==at) {
        const delta= index===wrap(at+1,items.length)?1:index===wrap(at-1,items.length)?-1:index-at;
        step(delta);
      }
    }
    const position=()=>String(at+1).padStart(2,"0")+" / "+String(items.length).padStart(2,"0");
    function sync() {
      count.textContent=position();
      count.setAttribute("aria-label","第 "+(at+1)+" 张，共 "+items.length+" 张");
      caption.textContent=[items[at].date,items[at].caption].filter(Boolean).join(" · ");
      schedule();
    }
    const zoom=button("fg-zoom","查看完整原图","看大图",() => {
      openViewer({step,current:()=>items[at],position,size:items.length}); schedule();
    });
    const redraw = mode==="reel" ? film(stage,items,select)
      : ["contact","book"].includes(mode) ? selection(stage,items,mode,select)
      : layers(stage,items,mode,select);
    surface.append(stage);
    if (items.length > 1) surface.append(...edgeButtons(step));
    controls.append(count);
    if (items.length>1) controls.append(play);
    controls.append(zoom);
    info.append(controls,caption);
    root.append(surface,info);
    root.addEventListener("keydown", e => {
      if (e.key!=="ArrowLeft" && e.key!=="ArrowRight") return;
      e.preventDefault(); step(e.key==="ArrowRight"?1:-1);
    });
    enableSwipe(surface, step);
    if (items.length>1) {
      const observer=new IntersectionObserver(records=>{
        onScreen=records[0].isIntersecting;
        if (!onScreen) entering=true;
        schedule();
      });
      observer.observe(stage);
      surface.addEventListener("pointerdown",()=>{pressing=true; schedule();});
      const release=()=>{if(pressing) {pressing=false; schedule();}};
      document.addEventListener("pointerup",release);
      document.addEventListener("pointercancel",release);
      root.addEventListener("focusin",schedule);
      root.addEventListener("focusout",()=>requestAnimationFrame(schedule));
      document.addEventListener("visibilitychange",schedule);
      playback.addEventListener("view",schedule);
      playback.addEventListener("change",schedule);
    }
    redraw(at); sync();
    return root;
  }

  function playbackButton(compact = false) {
    const control = button("fg-play " + (compact ? "fg-key" : "fg-master"), "", "", () => setAutomatic(!automatic, true));
    control.setAttribute("aria-controls",gallery.id);
    function label() {
      const text = automatic ? "暂停放映" : "开始放映";
      control.textContent=text;
      control.setAttribute("aria-label",text+"全部相册");
      control.title=text+"全部相册";
      control.classList.toggle("is-playing",automatic);
    }
    playback.addEventListener("change",label);
    label();
    return control;
  }

  async function init() {
    const records=await window.lettersData.load("portraits");
    const groups=new Map();
    for(const record of records) {
      if(!record.src || !record.file) continue;
      const folder=record.file.includes("/") ? record.file.split("/")[0] : "";
      if(!groups.has(folder)) groups.set(folder,[]);
      groups.get(folder).push(record);
    }
    if (!groups.size) {
      gallery.replaceChildren(make("p","empty","第一张照片的位置，留给你。")); return;
    }
    const title=document.getElementById("portraits-title");
    if (title && [...groups.values()].some(group=>group.length>1)) {
      const bar=make("div","fg-title-row");
      title.before(bar);
      bar.append(title,playbackButton());
    }
    const openViewer=viewer();
    const albums=document.createDocumentFragment();
    let number=0;
    for(const key of new Set([...styles.keys(),...groups.keys()])) {
      if(groups.has(key)) albums.append(buildAlbum(groups.get(key),styles.get(key)||"prints",++number,openViewer));
    }
    gallery.replaceChildren(albums);
  }
  init().catch(()=>gallery.replaceChildren(make("p","empty","相册暂时未能打开，请刷新重试。")));
})();
