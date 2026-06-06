// Determine the correct base path for assets
const basePath = (() => {
  const pathname = window.location.pathname;
  // Check if we're on GitHub Pages by looking for /genshindle-helper/ in the path
  if (pathname.includes("/genshindle-helper/")) {
    return "/genshindle-helper/";
  } else if (pathname.includes("/genshindle-helper")) {
    return "/genshindle-helper/";
  }
  // Local development
  return "./";
})();

console.log("Detected pathname:", window.location.pathname);
console.log("Using basePath:", basePath);
console.log("Example asset path:", basePath + "assets/elements/pyro.png");

const genshinAssets = {
  elements: {
    pyro: {
      color: "#EC4923",
      icon: basePath + "assets/elements/pyro.png",
    },
    hydro: {
      color: "#00BFFF",
      icon: basePath + "assets/elements/hydro.png",
    },
    anemo: {
      color: "#359697",
      icon: basePath + "assets/elements/anemo.png",
    },
    electro: {
      color: "#945DC4",
      icon: basePath + "assets/elements/electro.png",
    },
    dendro: {
      color: "#608A00",
      icon: basePath + "assets/elements/dendro.png",
    },
    cryo: {
      color: "#46A8BA",
      icon: basePath + "assets/elements/cryo.png",
    },
    geo: {
      color: "#DEBD6C",
      icon: basePath + "assets/elements/geo.png",
    },
  },
  weapons: {
    sword: basePath + "assets/weapons/sword.png",
    claymore: basePath + "assets/weapons/claymore.png",
    polearm: basePath + "assets/weapons/polearm.png",
    bow: basePath + "assets/weapons/bow.png",
    catalyst: basePath + "assets/weapons/catalyst.png",
  },
  regions: {
    mondstadt: basePath + "assets/regions/mondstadt.png",
    liyue: basePath + "assets/regions/liyue.png",
    inazuma: basePath + "assets/regions/inazuma.png",
    sumeru: basePath + "assets/regions/sumeru.png",
    fontaine: basePath + "assets/regions/fontaine.png",
    natlan: basePath + "assets/regions/natlan.png",
    snezhnaya: basePath + "assets/regions/snezhnaya.png",
  },
};
