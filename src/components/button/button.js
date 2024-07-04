var ButtonScript = class {
  constructor(id, text, svgPath, urlPath) {
    this.id = id;
    this.text = text;
    this.svgPath = svgPath;
  }

  run() {
    const targetElements = document.body.getElementsByClassName(this.id, this.svgPath);
    const svgElement = Component.fetchHTML(this.svgPath);
    svgElement.classList.add("button-svg");

    for (let targetElement of targetElements) {
      targetElement.prepend(svgElement);
    }
  }
};

var buttonScript = new ButtonScript();
