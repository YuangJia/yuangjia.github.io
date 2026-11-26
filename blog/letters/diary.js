(() => {
  const entries = window.fanfanLetters || {};
  const supportedImage = /\.(?:avif|gif|jpe?g|png|webp)$/i;

  function imagePath(section, file) {
    if (typeof file !== "string" || !supportedImage.test(file)) return "";
    const parts = file.split("/");
    if (parts.some(part => !part || part === "." || part === ".." || part.includes("\\"))) return "";
    return "photos/" + section + "/" + parts.map(encodeURIComponent).join("/");
  }

  function entryDate(record) {
    const dateInName = typeof record.file === "string"
      && record.file.split("/").pop().match(/^(\d{4}-\d{2}-\d{2})(?!\d)/);
    const date = record.date || (dateInName && dateInName[1]);
    if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return "";
    const timestamp = Date.parse(date);
    return Number.isFinite(timestamp) && new Date(timestamp).toISOString().startsWith(date) ? date : "";
  }

  function openAlbum(section, selector) {
    const list = document.querySelector(selector);
    if (!list) return () => {};
    const placeholder = Array.from(list.childNodes);
    const seen = new Set();
    const portrait = section === "portraits";

    return function append(records) {
      if (!Array.isArray(records)) return;
      const cards = document.createDocumentFragment();
      for (const item of records) {
        if (!item || typeof item !== "object") continue;
        const src = imagePath(section, item.file);
        const caption = typeof item.caption === "string" ? item.caption.trim() : "";
        if ((!src && (portrait || !caption)) || (src && seen.has(src))) continue;

        const card = document.createElement(portrait ? "figure" : "article");
        card.className = "memory";
        if (src) {
          seen.add(src);
          const img = document.createElement("img");
          img.alt = item.alt || caption || (portrait ? "fanfan 的照片" : "我们一起拍的照片");
          img.loading = "lazy";
          img.decoding = "async";
          img.addEventListener("error", () => {
            if (!portrait && caption) {
              img.remove();
              return;
            }
            card.remove();
            if (!list.childElementCount) list.replaceChildren(...placeholder);
          }, { once: true });
          img.src = src;
          card.append(img);
        }

        const date = entryDate(item);
        if (caption || date) {
          const note = document.createElement(portrait ? "figcaption" : "div");
          note.className = "memory-caption";
          if (date) {
            const time = document.createElement("time");
            time.dateTime = date;
            time.textContent = date.split("-").join(".");
            note.append(time);
          }
          if (caption) {
            const paragraph = document.createElement("p");
            paragraph.textContent = caption;
            note.append(paragraph);
          }
          card.append(note);
        }
        cards.append(card);
      }

      if (cards.childElementCount) {
        for (const node of placeholder) node.remove();
        list.append(cards);
      }
    };
  }

  const albums = {
    portraits: openAlbum("portraits", "#portrait-list"),
    days: openAlbum("days", "#days-list"),
  };
  for (const [section, append] of Object.entries(albums)) append(entries[section]);

  async function loadPublishedPhotos() {
    if (!/^https?:$/.test(location.protocol)) return;
    try {
      const response = await fetch("./published-photos.json", { cache: "no-cache" });
      if (!response.ok) return;
      const manifest = await response.json();
      for (const [section, append] of Object.entries(albums)) {
        if (!Array.isArray(manifest?.[section])) continue;
        const files = manifest[section].filter(name => typeof name === "string").sort().reverse();
        append(files.map(file => ({ file })));
      }
    } catch {
      // 直接预览静态源文件时，清单可能尚未由 GitHub Pages 生成。
    }
  }

  loadPublishedPhotos();
})();
