class Component {
  constructor(id, isRoute, isStatic) {
    this.id = id;
    this.isRoute = isRoute;
    this.isStatic = isStatic;
    this.path = null;
    this.htmlNodes = null;
    this.cssNode = null;
    this.jsNode = null;
    this.jsScript = null;
  }

  async fetchText(path) {
    const response = await fetch(path);

    if (!response.ok) {
      throw new Error(`Failed to load file for ${path}`);
    }

    return response.text();
  }

  async loadHTML() {
    if (!this.htmlNodes) {
      const htmlText = await this.fetchText(`${this.path}.html`);
      const parser = new DOMParser();
      const htmlDocument = parser.parseFromString(htmlText, "text/html");
      this.htmlNodes = Array.from(htmlDocument.body.children);
    }
  }

  async loadCSS() {
    if (!this.cssNode) {
      const cssText = await this.fetchText(`${this.path}.css`);
      this.cssNode = document.createElement("style");
      this.cssNode.textContent = cssText;
    }
  }

  async loadJS() {
    if (!this.jsNode) {
      const jsText = await this.fetchText(`${this.path}.js`);
      this.jsNode = document.createElement("script");
      this.jsNode.type = "text/javascript";
      this.jsNode.textContent = jsText;
    }
  }

  async load() {
    this.path = `components/${this.id}/${this.id}`;

    if (this.isRoute) {
      this.path = `routes/${this.id}/${this.id}`;
    }

    try {
      const htmlPromise = this.loadHTML();
      const cssPromise = this.loadCSS();
      const jsPromise = this.loadJS();

      await Promise.all([htmlPromise, cssPromise, jsPromise]);
    } catch (error) {
      console.log(error);
    }
  }
}

class App {
  constructor(routes, staticComponents) {
    this.routes = routes;
    this.staticComponents = staticComponents;
    this.drawnComponents = new Map();
    this.cachedComponents = new Map();
    this.htmlFragment = document.createDocumentFragment();
    this.cssFragment = document.createDocumentFragment();
    this.jsFragment = document.createDocumentFragment();
    this.navigating = false;
  }

  erase() {
    for (const drawnComponent of this.drawnComponents.values()) {
      if (!drawnComponent.isStatic) {
        if (drawnComponent.jsScript) {
          drawnComponent.jsScript.cleanup();
        }

        drawnComponent.htmlNodes.forEach((node) => node.remove());
        drawnComponent.jsNode.remove();
        drawnComponent.cssNode.remove();
        this.drawnComponents.delete(drawnComponent.id);
      }
    }
  }

  async drawComponent(componentId, isRoute, isStatic, parentToReplace) {
    if (this.drawnComponents.has(componentId)) {
      return;
    }

    let componentToDraw = this.cachedComponents.get(componentId);

    if (!componentToDraw) {
      componentToDraw = new Component(
        componentId,
        isRoute,
        isStatic,
        parentToReplace
      );
      this.cachedComponents.set(componentId, componentToDraw);
    }

    if (!componentToDraw.htmlNodes) {
      await componentToDraw.load();
    }

    if (
      componentToDraw.isStatic &&
      this.drawnComponents.get(componentToDraw.id)
    ) {
      return;
    }

    /* Used to replace child nodes for child components */
    if (parentToReplace) {
      parentToReplace.replaceWith(...componentToDraw.htmlNodes);
    } else {
      this.htmlFragment.append(...componentToDraw.htmlNodes);
    }

    this.cssFragment.appendChild(componentToDraw.cssNode);
    this.jsFragment.appendChild(componentToDraw.jsNode);
    this.drawnComponents.set(componentToDraw.id, componentToDraw);

    for (const node of componentToDraw.htmlNodes) {
      let childNodes = Array.from(node.querySelectorAll("[class^='$']"));

      for (const childNode of childNodes) {
        this.drawComponent(
          childNode.className.split("$").pop(),
          false,
          false,
          childNode
        );
      }
    }
  }

  async draw(path) {
    this.erase();

    const staticDrawPromises = this.staticComponents.map((component) =>
      this.drawComponent(component, false, true, false)
    );

    await Promise.all(staticDrawPromises);
    await this.drawComponent(path, true, false, false);

    document.head.appendChild(this.cssFragment);
    document.body.appendChild(this.htmlFragment);
    document.body.appendChild(this.jsFragment);
  }

  navigate(path) {
    if (this.navigating) {
      return;
    }

    this.navigating = true;

    /* Used for scrolling to a specific element on a page */
    const targetElement = document.getElementById(path);

    if (targetElement) {
      targetElement.scrollIntoView();
      window.scrollTo({ top: targetElement.offsetTop });
      this.navigating = false;
      return;
    }

    if (this.routes[path]) {
      this.draw(this.routes[path]);
    } else {
      this.draw("notfound");
    }

    this.navigating = false;
  }

  run() {
    window.addEventListener("hashchange", () =>
      this.navigate(window.location.hash.substring(1) || "/")
    );

    this.navigate(window.location.hash.substring(1) || "/");
  }
}

const routes = {
  "/": "home"
};
const staticComponents = ["navbar"];
const app = new App(routes, staticComponents);
document.addEventListener("DOMContentLoaded", () => app.run());
