async function colorSvgs() {
  const svgObjects = document.querySelectorAll(".svg");
  const textColor = getComputedStyle(document.documentElement)
    .getPropertyValue("--text-color")
    .trim();

  async function colorSvg(svgObject) {
    return new Promise((resolve) => {
      const handleLoad = () => {
        const svgDoc = svgObject.contentDocument;
        if (svgDoc && svgDoc.readyState === "complete") {
          const svgElement = svgDoc.querySelector("svg");

          if (svgElement) {
            svgElement.setAttribute("fill", textColor);
            resolve();
          }
        }
      };

      svgObject.addEventListener("load", handleLoad);
      handleLoad();
    });
  }

  const colorPromises = [];

  for (const svgObject of svgObjects) {
    colorPromises.push(colorSvg(svgObject));
  }

  await Promise.all(colorPromises);
}

async function loadComponent(componentElement, componentId, componentPath) {
  const componentFilesPath = `${componentPath}/${componentPath
    .split("/")
    .pop()}`;

  try {
    /* Fetch HTML */
    const response = await fetch(`${componentFilesPath}.html`);
    if (!response.ok) {
      throw new Error(`Failed to load HTML for ${componentId}`);
    }
    const html = await response.text();

    /* Create component */
    const component = document.createElement(componentElement);
    component.id = componentId;

    /* Parse and insert HTML into the component */
    const fragment = document.createDocumentFragment();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const nodes = doc.body.childNodes;

    for (let i = 0; i < nodes.length; i++) {
      fragment.appendChild(nodes[i]);
    }

    component.appendChild(fragment);

    /* Unload previous page's CSS */
    const links = document.head.querySelectorAll("link[rel='stylesheet']");

    for (let i = 0; i < links.length; i++) {
      const link = links[i];

      if (link.href && link.href.includes(`${componentPath}/`)) {
        link.remove();
      }
    }

    /* Unload previous page's scripts */
    const scripts = document.body.querySelectorAll("script");

    for (let i = 0; i < scripts.length; i++) {
      const script = scripts[i];

      if (script.src && script.src.includes(`${componentPath}/`)) {
        script.remove();
      }
    }

    /* Load component CSS if it doesn't exist */
    if (!document.querySelector(`link[href="${componentFilesPath}.css"]`)) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = `${componentFilesPath}.css`;

      document.head.appendChild(link);
    }

    /* Load component JS if it doesn't exist */
    if (!document.querySelector(`script[src="${componentFilesPath}.js"]`)) {
      const script = document.createElement("script");
      script.type = "text/javascript";
      script.src = `${componentFilesPath}.js`;

      document.body.appendChild(script);
    }

    return component;
  } catch (error) {
    console.error(`Failed to load component ${componentId}:`, error);
    return null;
  }
}

const routes = {
  "/": async () => await loadComponent("div", "container", "routes/home"),
  "/projects": async () =>
    await loadComponent("div", "container", "routes/projects")
};

function router() {
  const app = document.getElementById("app");
  const path = window.location.hash.substring(1) || "/";

  /* Allows scrolling to tags within the same page */
  const targetElement = document.getElementById(path);
  if (targetElement) {
    targetElement.scrollIntoView();
    return;
  }

  const pagePromise = routes[path]
    ? routes[path]()
    : loadComponent("div", "container", "routes/notfound");
  const navbarPromise = loadComponent("nav", "navbar", "components/navbar");

  Promise.all([pagePromise, navbarPromise])
    .then(([page, navbar]) => {
      while (app.firstChild) {
        app.removeChild(app.firstChild);
      }

      const fragment = document.createDocumentFragment();

      if (navbar) {
        fragment.appendChild(navbar);
      }

      if (page) {
        fragment.appendChild(page);
      }

      app.appendChild(fragment);
      colorSvgs();
    })
    .catch((error) => {
      console.error("Error loading components:", error);
    });
}

function start() {
  window.addEventListener("hashchange", router);
  router();
}

document.addEventListener("DOMContentLoaded", start);
