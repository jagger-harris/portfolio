(function () {
  class HomeJS {
    constructor() {
      this.execute = true;
    }

    run() {
      const self = this;

      const messages = [
        "I enjoy making open source software.",
        "I enjoy making things from scratch.",
        "I enjoy being a software developer."
      ];
      let currentMessageIndex = 0;
      let charIndex = messages[currentMessageIndex].length;
      const typingTextElement = document.getElementById("typing-text");
      const cursorElement = document.getElementById("cursor");
      const typingSpeed = 100;
      const deletingSpeed = 50;
      const delayBetweenmessages = 6000;

      function type() {
        if (!self.execute) {
          typingTextElement.textContent = messages[0];
          return;
        }

        if (!typingTextElement || !cursorElement) {
          return;
        }

        cursorElement.classList.add("typing");

        if (charIndex < messages[currentMessageIndex].length) {
          typingTextElement.textContent +=
            messages[currentMessageIndex].charAt(charIndex);
          charIndex++;
          setTimeout(type, typingSpeed);
        } else {
          cursorElement.classList.remove("typing");
          setTimeout(deleteText, delayBetweenmessages);
        }
      }

      function deleteText() {
        if (!self.execute) {
          typingTextElement.textContent = messages[0];
          return;
        }

        cursorElement.classList.add("typing");
        if (charIndex > 0) {
          typingTextElement.textContent = messages[
            currentMessageIndex
          ].substring(0, charIndex - 1);
          charIndex--;
          setTimeout(deleteText, deletingSpeed);
        } else {
          cursorElement.classList.remove("typing");
          currentMessageIndex = (currentMessageIndex + 1) % messages.length;
          setTimeout(type, typingSpeed);
        }
      }

      this.typeTimeout = setTimeout(type, typingSpeed);
    }

    stop() {
      this.execute = false;
      clearTimeout(this.typeTimeout);
    }
  }

  window.homeJS = new HomeJS();
})();
