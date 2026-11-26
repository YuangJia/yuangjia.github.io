(() => {
  const indexView = document.body.dataset.view === "index";
  const list = document.getElementById(indexView ? "year-list" : "day-list");
  const thisYear = new Intl.DateTimeFormat("en", {
    timeZone: "Asia/Shanghai", year: "numeric"
  }).format(new Date());

  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  }

  function yearKey(record) {
    return record.year || record.date?.slice(0, 4) || "undated";
  }

  function groupBy(records, keyOf) {
    const groups = new Map();
    for (const record of records) {
      const key = keyOf(record);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(record);
    }
    return groups;
  }

  function collections(records) {
    const sorted = [...records].sort((a, b) => (b.date || b.month || "").localeCompare(a.date || a.month || ""));
    const food = groupBy(sorted.filter(r => r.kind === "food"), r => r.month || "");
    const dates = groupBy(sorted.filter(r => r.kind === "date"), r => r.eventKey || r.date || r.file);
    const notes = sorted.filter(r => r.kind !== "food" && r.kind !== "date");
    return {food, dates, notes};
  }

  function countSummary({food, dates, notes}) {
    const counts = [];
    if (dates.size) counts.push(dates.size + " 次约会");
    if (food.size) counts.push(food.size + " 辑美食");
    if (notes.length) counts.push(notes.length + " 则手记");
    return counts.join(" · ") || "0 则手记";
  }

  function setSource(image, record, onError) {
    image.addEventListener("error", () => {
      if (record.previewSrc && image.src !== record.src) {
        image.addEventListener("error", onError, {once:true});
        image.src = record.src;
      } else {
        onError();
      }
    }, {once:true});
    image.src = record.previewSrc || record.src;
  }

  function showShelf(records) {
    const volumes = groupBy(records, yearKey);
    if (!volumes.has(thisYear)) volumes.set(thisYear, []);
    const years = [...volumes.keys()].filter(year => year !== "undated").sort().reverse();
    if (volumes.has("undated")) years.push("undated");
    for (const year of years) {
      const item = element("li");
      const link = element("a", "book");
      link.href = "year.html?year=" + encodeURIComponent(year);
      const name = year === "undated" ? "日期待记" : year;
      const entries = volumes.get(year);
      const count = countSummary(collections(entries));
      link.setAttribute("aria-label", "翻开" + name + "的生活手记，" + count);
      const photos = entries.filter(record => record.src).sort((a, b) => (b.date || b.month || "").localeCompare(a.date || a.month || ""));
      const cover = photos.find(photo => photo.kind !== "food") || photos[0];
      const jacket = element("div", "book-jacket");
      const inscription = element("span", "book-inscription");
      const tag = element("span", "book-label", name);
      if (year === "undated") tag.classList.add("book-undated");
      const pup = element("img", "book-sticker");
      pup.src = "letter-pup.webp";
      pup.alt = "";
      inscription.append(tag, pup);
      const open = element("span", "book-action", "翻开这册");
      open.append(element("i"));
      jacket.append(element("span", "book-count", count), inscription, open);
      const plate = element("div", "book-plate");
      const mount = element("div", "book-mount");
      if (cover) {
        const photo = element("img");
        photo.alt = "";
        if (list.childElementCount) photo.loading = "lazy";
        else photo.fetchPriority = "high";
        mount.classList.add("has-photo");
        setSource(photo, cover, () => {
          mount.classList.remove("has-photo");
          photo.remove();
        });
        mount.append(photo);
      }
      plate.append(mount);
      link.append(jacket, plate);
      item.append(link);
      list.append(item);
    }
  }

  function photoPrint(record, title, includeCaption = true) {
    const figure = element("figure", "memory-print");
    if (record.src) {
      const frame = element("a", "photo-link");
      const image = element("img");
      image.alt = record.alt || title || "手记照片";
      image.loading = "lazy";
      image.decoding = "async";
      frame.href = record.src;
      frame.setAttribute("aria-label", "查看原图，" + image.alt);
      setSource(image, record, () => frame.replaceChildren(element("span", "unavailable", "查看原图")));
      frame.append(image);
      figure.append(frame);
    }
    if (includeCaption && record.caption) figure.append(element("figcaption", "handnote", record.caption));
    return figure;
  }

  function addSection(id, title, count) {
    const section = element("section", "collection");
    section.id = id;
    const heading = element("h2", "collection-title", title);
    heading.append(element("span", "collection-count", count));
    section.append(heading);
    list.append(section);
    const link = element("a", "", title);
    link.href = "#" + id;
    document.getElementById("collection-nav").append(link);
    return section;
  }

  function showFood(months) {
    const total = [...months.values()].reduce((n, photos) => n + photos.length, 0);
    const section = addSection("food", "美食", total + " 张");
    for (const [month, photos] of months) {
      const collection = element("article", "month-collection");
      const number = Number(month.slice(-2));
      const label = number >= 1 && number <= 12 ? number + " 月" : "月份待记";
      const title = element("h3", "month-heading", label);
      const grid = element("div", "food-grid");
      photos.forEach((record, i) => grid.append(photoPrint(record, label + "的美食照片 " + (i + 1))));
      collection.append(title, grid);
      section.append(collection);
    }
  }

  function dateStamp(date) {
    if (!date) return element("span", "entry-date", "日期待记");
    const time = element("time", "entry-date", Number(date.slice(5, 7)) + " 月 " + Number(date.slice(-2)) + " 日");
    time.dateTime = date;
    return time;
  }

  function showDates(dates) {
    const section = addSection("dates", "约会", dates.size + " 次");
    for (const photos of dates.values()) {
      const event = photos[0];
      const title = event.event || (photos.length === 1 && event.photoTitle) || "约会记录";
      const article = element("article", "outing");
      const header = element("header", "outing-head");
      header.append(dateStamp(event.date), element("h3", "", title));
      if (event.eventCaption) header.append(element("p", "outing-note handnote", event.eventCaption));
      article.append(header);
      const grid = element("div", photos.length === 1 ? "outing-photos single" : "outing-photos");
      for (const photo of photos) {
        const figure = photoPrint(photo, photo.photoTitle || title, false);
        if ((photo.photoTitle && photo.photoTitle !== title) || photo.caption) {
          const caption = element("figcaption");
          if (photo.photoTitle && photo.photoTitle !== title) caption.append(element("span", "photo-title", photo.photoTitle));
          if (photo.caption) caption.append(element("p", "handnote", photo.caption));
          figure.append(caption);
        }
        grid.append(figure);
      }
      article.append(grid);
      section.append(article);
    }
  }

  function showNotes(notes) {
    const section = addSection("notes", "手记", notes.length + " 则");
    for (const record of notes) {
      const article = element("article", "outing");
      article.append(dateStamp(record.date), photoPrint(record, ""));
      section.append(article);
    }
  }

  function showYear(records) {
    const query = new URLSearchParams(location.search).get("year");
    const year = query === "undated" || /^\d{4}$/.test(query) ? query : thisYear;
    const title = year === "undated" ? "日期待记" : year + " 年";
    document.getElementById("year-title").textContent = title;
    document.title = title + " · 宇昂与凡凡的生活手记";
    const matched = records.filter(record => yearKey(record) === year);
    if (!matched.length) {
      list.append(element("p", "empty", "这一册还没有记录。"));
      return;
    }
    const {food, dates, notes} = collections(matched);
    if (food.size) showFood(food);
    if (dates.size) showDates(dates);
    if (notes.length) showNotes(notes);
    const nav = document.getElementById("collection-nav");
    nav.hidden = nav.childElementCount < 2;
    if (location.hash) document.getElementById(location.hash.slice(1))?.scrollIntoView();
  }

  async function init() {
    try {
      const records = await window.lettersData.load("days");
      if (indexView) showShelf(records);
      else showYear(records);
    } catch {
      list.append(element(indexView ? "li" : "p", "empty", "手记暂时无法读取，请刷新页面重试。"));
    }
  }
  init();
})();
