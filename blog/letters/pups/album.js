(() => {
  const pups = [
    {id: "dingdang", name: "叮当", age: 9, sexLabel: "哥哥"},
    {id: "chongchong", name: "虫虫", age: 1, sexLabel: "小妹妹"},
    {id: "lele", name: "乐乐", age: 9, sexLabel: "哥哥"}
  ];
  // Current photos that also have a lightweight preview, in album order.
  const known = [
    "微信图片_20261126185459_4331_372叮当.jpg",
    "微信图片_20261126185459_4333_372叮当.jpg",
    "微信图片_20261126191123_4336_372虫虫.jpg",
    "微信图片_20261126185459_4334_372虫虫.jpg",
    "微信图片_20261126185459_4329_372虫虫.jpg",
    "微信图片_20261126185459_4332_372虫虫.jpg",
    "微信图片_20261126190125_303_1乐乐.jpg",
    "微信图片_20261126190110_302_1乐乐.jpg",
    "微信图片_20261126185459_4330_372叮当与虫虫.jpg"
  ];
  const previews = new Set(known);

  function albums(files) {
    return pups.map(pup => ({
      ...pup,
      photos: files.filter(file => file.includes(pup.name)).map(file => {
        const path = file.split("/").map(encodeURIComponent).join("/");
        const src = "photos/our_dogs/" + path;
        return {src, previewSrc: previews.has(file) ? "previews/our_dogs/" + path + ".webp" : src};
      })
    }));
  }

  window.letterPups = albums(known);
  window.loadLetterPups = async () => {
    const listed = await window.lettersData?.listDogFiles?.();
    if (Array.isArray(listed)) {
      const files = new Set(listed);
      const ordered = known.filter(file => files.has(file));
      ordered.push(...[...files].filter(file => !previews.has(file)).sort());
      window.letterPups = albums(ordered);
    }
    return window.letterPups;
  };
})();
