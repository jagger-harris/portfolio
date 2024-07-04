class Component {
  constructor(path, id, tag, persistent) {
    this.path = path;
    this.fullPath = `${path}/${path.split("/").pop()}`;
    this.id = id;
    this.tag = tag;
    this.persistent = persistent;
    this.component = null;
    this.css = null;
    this.script = null;
  }

  async fetchHTML(fullPath) {
    const response = await fetch(`${fullPath}.html`);

    if (!response.ok) {
      throw new Error(`Failed to load HTML for ${fullPath}`);
    }

    return await response.text();
  }

  async loadCSS() {
    return new Promise((resolve, reject) => {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = `${this.fullPath}.css`;

      link.onload = () => {
        this.css = link;
        resolve();
      };

      link.onerror = () => {
        reject(new Error(`Failed to load CSS for ${this.fullPath}`));
      };

      document.head.appendChild(link);
    });
  }

  loadScript() {
    const script = document.createElement("script");
    script.type = "text/javascript";
    script.src = `${this.fullPath}.js`;
    script.onload = () => {
      this.script = window[`${this.fullPath.split("/").pop()}Script`];

      if (this.script && typeof this.script.run === "function") {
        this.script.run();
      }
    };

    this.scriptElement = script;
    document.body.appendChild(script);
  }

  async load(cached) {
    if (cached) {
      if (this.css) {
        document.head.appendChild(this.css);
      }

      this.loadScript();

      return;
    }

    try {
      const html = await this.fetchHTML(this.fullPath);
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");
      const nodes = doc.body.childNodes;
      const fragment = document.createDocumentFragment();
      const component = document.createElement(this.tag);
      component.id = this.id;

      nodes.forEach((node) => fragment.appendChild(node));
      component.appendChild(fragment);
      this.component = component;

      await this.loadCSS();
      this.loadScript();
    } catch (error) {
      console.error(`Failed to load component ${this.id}:`, error);
    }
  }

  async unload() {
    if (this.script) {
      let scriptName = this.fullPath.split("/").pop();
      this.script.execute = false;

      if (this.script.cleanup) {
        this.script.cleanup();
      }

      this.script = null;
      window[
        `${scriptName.charAt(0).toUpperCase() + scriptName.substring(1)}Script`
      ] = null;
      window[`${scriptName}Script`] = null;
    }

    if (this.component) {
      this.component.remove();
    }

    if (this.css) {
      this.css.remove();
    }

    if (this.scriptElement) {
      this.scriptElement.remove();
    }
  }
}

class App {
  constructor() {
    this.routes = {
      "/": "routes/home",
      "/projects": "routes/projects"
    };
    this.loadedComponents = new Map();
    this.cachedComponents = new Map();
    this.navigating = false;
  }

  async colorSvgs() {
    const svgObjects = document.querySelectorAll(".svg");
    const textColor = getComputedStyle(document.documentElement)
      .getPropertyValue("--text-color")
      .trim();

    const handleLoad = (svgObject, resolve) => () => {
      const svgDoc = svgObject.contentDocument;
      if (svgDoc && svgDoc.readyState === "complete") {
        const svgElement = svgDoc.querySelector("svg");

        if (svgElement) {
          svgElement.setAttribute("fill", textColor);
          svgObject.removeEventListener("load", handleLoad(svgObject, resolve));
          resolve();
        }
      }
    };

    const colorSvg = async (svgObject) => {
      return new Promise((resolve) => {
        const onLoad = handleLoad(svgObject, resolve);
        svgObject.addEventListener("load", onLoad);
      });
    };

    const colorPromises = [];

    svgObjects.forEach((svgObject) => colorPromises.push(colorSvg(svgObject)));

    await Promise.all(colorPromises);
  }

  async loadPage(path) {
    /* Check if id exists for scrollTo */
    const targetElement = document.getElementById(path);

    if (targetElement) {
      targetElement.scrollIntoView();
      window.scrollTo({ top: targetElement.offsetTop });
      this.navigating = false;
      return;
    }

    await this.unloadPage();

    const fragment = document.createDocumentFragment();
    const mainElement = document.querySelector("main");

    try {
      if (this.cachedComponents.has("components/navbar")) {
        const cachedComponent = this.cachedComponents.get("components/navbar");
        this.loadedComponents.set(cachedComponent.path, cachedComponent);
      } else {
        const navbar = new Component(
          "components/navbar",
          "navbar",
          "nav",
          true
        );
        await navbar.load();

        if (navbar) {
          fragment.appendChild(navbar.component);
        }

        this.loadedComponents.set(navbar.path, navbar);
        this.cachedComponents.set(navbar.path, navbar);
      }

      if (this.cachedComponents.has(this.routes[path])) {
        const cachedComponent = this.cachedComponents.get(this.routes[path]);
        await cachedComponent.load(true);
        fragment.appendChild(cachedComponent.component);
        this.loadedComponents.set(cachedComponent.path, cachedComponent);
      } else {
        const page = this.routes[path]
          ? new Component(this.routes[path], "container", "div")
          : new Component("routes/notfound", "container", "div");

        await page.load();

        if (page) {
          fragment.appendChild(page.component);
        }

        this.loadedComponents.set(page.path, page);
        this.cachedComponents.set(page.path, page);
      }

      mainElement.appendChild(fragment);
      await this.colorSvgs();
    } catch (error) {
      console.error("Error loading components:", error);
    }
  }

  async unloadPage() {
    for (let component of this.loadedComponents.values()) {
      if (!component.persistent) {
        this.loadedComponents.delete(component.path);
        component.unload();
      }
    }
  }

  async navigateTo(path) {
    if (this.navigating) {
      return;
    }

    this.navigating = true;

    if (path.charAt(0) !== "/") {
      await this.loadPage("/");
    }

    await this.loadPage(path);

    this.navigating = false;
  }

  async run() {
    window.addEventListener(
      "hashchange",
      async () =>
        await this.navigateTo(window.location.hash.substring(1) || "/")
    );
    await this.navigateTo(window.location.hash.substring(1) || "/");
  }
}

const app = new App();
document.addEventListener("DOMContentLoaded", async () => await app.run());
