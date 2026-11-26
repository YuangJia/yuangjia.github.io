(() => {
  "use strict";
  const names = {dingdang: "叮当", chongchong: "虫虫", lele: "乐乐"};
  const angles = [
    {suffix: "-left", label: "向左看"},
    {suffix: "", label: "正面"},
    {suffix: "-right", label: "向右看"}
  ];

  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  }
  function button(label, className, action) {
    const node = element("button", className, label);
    node.type = "button";
    node.addEventListener("click", action);
    return node;
  }
  async function portrait(id, angle) {
    const image = new Image();
    image.className = "pup-orbit-portrait";
    image.alt = "";
    image.draggable = false;
    image.src = "pups/" + id + angle.suffix + ".webp";
    await image.decode();
    return image;
  }

  let dialog, stage, layers, heart, heading, caption, previous, next, status;
  let session = null, opener = null, serial = 0, pointer = null, skipTapUntil = 0;
  let petTimer = 0;

  function paint(view, index) {
    const frame = view.images[index];
    if (!frame.isConnected) {
      layers.append(frame);
      // Commit the starting opacity before the newly decoded portrait is revealed.
      frame.getBoundingClientRect();
    }
    for (const layer of layers.children) layer.classList.toggle("in-view", layer === frame);
    view.current = index;
    caption.textContent = angles[index].label;
    stage.setAttribute("aria-label", "摸摸" + view.name + "，当前角度：" + angles[index].label);
  }
  function syncButtons(view) {
    previous.disabled = view.target === 0 || view.failed.has(view.target - 1);
    next.disabled = view.target === angles.length - 1 || view.failed.has(view.target + 1);
  }
  function load(view, index) {
    if (!view.loads[index]) {
      view.loads[index] = portrait(view.id, angles[index]).then(image => {
        view.images[index] = image;
        return true;
      }, () => {
        view.failed.add(index);
        if (session === view) syncButtons(view);
        return false;
      });
    }
    return view.loads[index];
  }
  async function step(delta) {
    const view = session;
    if (!view) return;
    const index = view.target + delta;
    if (index < 0 || index >= angles.length || view.failed.has(index)) return;
    view.target = index;
    syncButtons(view);
    const loaded = await load(view, index);
    if (session !== view || view.target !== index || !dialog.open) return;
    if (loaded) paint(view, index);
    else {
      view.target = view.current;
      syncButtons(view);
      status.textContent = "这个角度暂时没有加载成功。";
    }
  }
  function pet() {
    if (!session || performance.now() < skipTapUntil) return;
    clearTimeout(petTimer);
    stage.classList.remove("is-petted");
    stage.getBoundingClientRect();
    stage.classList.add("is-petted");
    status.textContent = "摸了摸" + session.name;
    petTimer = setTimeout(() => stage.classList.remove("is-petted"), 600);
  }

  function setup() {
    dialog = element("dialog", "pup-orbit");
    dialog.setAttribute("aria-labelledby", "pup-orbit-title");
    const header = element("header", "pup-orbit-header");
    heading = element("h3");
    heading.id = "pup-orbit-title";
    header.append(heading, button("关闭", "pup-orbit-close", () => dialog.close()));
    stage = button("", "pup-orbit-stage", pet);
    layers = element("span", "pup-orbit-frames");
    heart = element("span", "pup-orbit-heart", "♥");
    heart.setAttribute("aria-hidden", "true");
    stage.append(layers, heart);
    const hint = element("p", "pup-orbit-hint", "左右拖动换角度，轻点摸摸它");
    const controls = element("div", "pup-orbit-actions");
    previous = button("往左看", "", () => step(-1));
    next = button("往右看", "", () => step(1));
    caption = element("span", "pup-orbit-caption");
    caption.setAttribute("aria-live", "polite");
    controls.append(previous, caption, next);
    status = element("span", "pup-visually-hidden");
    status.setAttribute("role", "status");
    dialog.append(header, stage, controls, hint, status);
    document.body.append(dialog);
    dialog.addEventListener("close", () => {
      if (dialog.open) return;
      ++serial;
      session = null;
      pointer = null;
      clearTimeout(petTimer);
      stage.classList.remove("is-petted");
      opener?.focus({preventScroll: true});
    });
    dialog.addEventListener("click", event => {
      if (event.target !== dialog) return;
      const box = dialog.getBoundingClientRect();
      if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.close();
    });
    dialog.addEventListener("keydown", event => {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      event.preventDefault();
      if (!event.repeat) step(event.key === "ArrowLeft" ? -1 : 1);
    });
    stage.addEventListener("pointerdown", event => {
      if (!event.isPrimary || event.button !== 0) return;
      pointer = {id:event.pointerId, x:event.clientX, y:event.clientY};
      stage.setPointerCapture(event.pointerId);
    });
    stage.addEventListener("pointerup", event => {
      if (pointer?.id !== event.pointerId) return;
      const dx = event.clientX-pointer.x, dy = event.clientY-pointer.y;
      pointer = null;
      if (Math.max(Math.abs(dx),Math.abs(dy)) < 12) return;
      skipTapUntil = performance.now() + 400;
      if (Math.abs(dx) >= 32 && Math.abs(dx) > 1.3*Math.abs(dy)) step(dx < 0 ? 1 : -1);
    });
    stage.addEventListener("lostpointercapture", () => { pointer = null; });
  }

  window.letterPupOrbit = {async open(id, name, sourceButton) {
    if (!Object.prototype.hasOwnProperty.call(names,id)) return;
    if (!dialog) setup();
    const ticket = ++serial;
    const view = {id, name:name || names[id], images:[], loads:[], failed:new Set(), current:1, target:1};
    // Keep the page or previous portrait visible until the front portrait is ready.
    const loaded = await load(view, 1);
    if (ticket !== serial) return;
    if (!loaded) {
      const notice = document.getElementById("pup-reaction");
      if (notice) notice.textContent = view.name + "的画像暂时未能打开，请稍后重试。";
      return;
    }
    opener = sourceButton;
    session = view;
    pointer = null;
    skipTapUntil = 0;
    status.textContent = "";
    stage.classList.remove("is-petted");
    heading.textContent = view.name;
    layers.replaceChildren(view.images[1]);
    paint(view, 1);
    syncButtons(view);
    if (!dialog.open) dialog.showModal();
    load(view, 0);
    load(view, 2);
  }};
})();
