(() => {
  const base = new URL(".", document.currentScript.src);
  const fallback = window.lettersPhotoIndex || { portraits: [], days: [] };
  const notes = window.fanfanLetters || {};
  const supported = /\.(?:avif|gif|jpe?g|png|webp)$/i;
  let listing;

  function validFile(file) {
    return typeof file === "string" && supported.test(file)
      && file.split("/").every(p => p && p !== "." && p !== ".." && !p.includes("\\"));
  }

  async function getListing() {
    if (location.protocol === "file:") return fallback;
    try {
      const response = await fetch(new URL("published-photos.json", base), { cache: "no-cache" });
      if (response.ok) {
        const manifest = await response.json();
        if (Array.isArray(manifest.portraits) && Array.isArray(manifest.days)) return manifest;
      }
    } catch {
      // A plain static server can serve the unbuilt Jekyll template.
    }
    return fallback;
  }

  function validDate(value) {
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return "";
    const time = Date.parse(value);
    return Number.isFinite(time) && new Date(time).toISOString().startsWith(value) ? value : "";
  }

  function record(section, note, file) {
    const caption = typeof note.caption === "string" ? note.caption.trim() : "";
    if (!file && (section !== "days" || !caption)) return null;
    const parts = file.split("/");
    const filename = parts.pop();
    const datePrefix = /^(\d{4}-\d{2}-\d{2})(?!\d)/;
    const nameDate = validDate(filename.match(datePrefix)?.[1]);
    const datedFolder = parts.find(part => validDate(part.match(datePrefix)?.[1]));
    const date = validDate(note.date) || nameDate || validDate(datedFolder?.slice(0, 10));
    const month = date.slice(0, 7) || parts.find(part => /^\d{4}-(?:0[1-9]|1[0-2])$/.test(part)) || "";
    const path = file.split("/").map(encodeURIComponent).join("/");
    const item = {
      file, caption, date, month, year: month.slice(0, 4) || parts.find(part => /^\d{4}$/.test(part)) || "",
      alt: typeof note.alt === "string" ? note.alt : "",
      src: file ? new URL("photos/" + section + "/" + path, base).href : ""
    };
    const previews = section === "days" ? window.lettersDayPreviews : window.lettersPortraitPreviews;
    item.previewSrc = previews?.has(file)
      ? new URL("previews/" + section + "/" + path + ".webp", base).href : item.src;
    if (section !== "days") return item;
    item.kind = parts.includes("美食") ? "food" : parts.includes("约会") ? "date" : "note";
    if (item.kind === "date") {
      // A calendar date identifies an outing even when several photos have different titles.
      const albumFolder = parts.slice(parts.indexOf("约会") + 1)
        .filter(part => !/^\d{4}(?:-\d{2})?$/.test(part)).pop() || "";
      item.eventKey = date || (albumFolder ? parts.join("/") : file);
      const outing = notes.outings?.[item.eventKey] || {};
      const photoLabel = filename.replace(/\.[^.]+$/, "").replace(datePrefix, "").replace(/^[-_\s]+/, "");
      item.photoTitle = /^(?:微信图片|IMG[_-]?\d|DSC[_-]?\d|\d+$)/i.test(photoLabel) ? "" : photoLabel;
      const folderLabel = albumFolder.replace(datePrefix, "").replace(/^[-_\s]+/, "");
      item.event = outing.title || folderLabel || item.photoTitle || "约会";
      item.eventCaption = outing.caption || "";
    }
    return item;
  }

  async function load(section) {
    if (section !== "portraits" && section !== "days") return [];
    listing ||= getListing();
    const files = new Set((await listing)[section].filter(validFile));
    const records = [];
    const consumed = new Set();
    for (const note of notes[section] || []) {
      if (!note || typeof note !== "object") continue;
      let file = validFile(note.file) ? note.file : "";
      if (file && !files.has(file)) {
        // Keep a caption attached when its photo has moved into a category folder.
        const basename = file.split("/").pop();
        const matches = [...files].filter(path => path.split("/").pop() === basename);
        if (matches.length === 1) file = matches[0];
      }
      if (file && consumed.has(file)) continue;
      if (file) consumed.add(file);
      const item = record(section, note, file);
      if (item) records.push(item);
    }
    for (const file of [...files].sort().reverse()) {
      if (!consumed.has(file)) records.push(record(section, {}, file));
    }
    return records;
  }

  window.lettersData = { load };
})();
