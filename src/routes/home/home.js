var HomeScript = class {
  constructor() {
    this.timeouts = [];
  }

  addTimeout(timeout) {
    this.timeouts.push(timeout);
  }

  run() {
    const messages = [
      "I enjoy making open source software.",
      "I enjoy making things from scratch.",
      "I enjoy being a software developer."
    ];

    let delay = 6000;
    let typingSpeed = 100;
    let deletingSpeed = 50;
    let currentMessageIndex = 0;
    let charIndex = messages[currentMessageIndex].length;

    const typingMessageElement = document.getElementById("typing-message");
    const cursorElement = document.getElementById("cursor");

    if (!typingMessageElement || !cursorElement) {
      return;
    }

    const resetMessage = () => {
      typingMessageElement.innerText = messages[0];
    };

    const typeMessage = async () => {
      cursorElement.classList.add("typing");
      await deleteChars();
      await typeChars();
      cursorElement.classList.remove("typing");
      this.addTimeout(setTimeout(typeMessage, delay));
    };

    const typeChars = () => {
      return new Promise((resolve) => {
        const typeNextChar = () => {
          typingMessageElement.innerText +=
            messages[currentMessageIndex].charAt(charIndex);
          charIndex++;

          if (charIndex <= messages[currentMessageIndex].length) {
            this.addTimeout(setTimeout(typeNextChar, typingSpeed));
          } else {
            resolve();
          }
        };

        typeNextChar();
      });
    };

    const deleteChars = () => {
      return new Promise((resolve) => {
        const deleteNextChar = () => {
          typingMessageElement.innerText = typingMessageElement.innerText.slice(
            0,
            -1
          );
          charIndex--;

          if (charIndex >= 0) {
            this.addTimeout(setTimeout(deleteNextChar, deletingSpeed));
          } else {
            currentMessageIndex = (currentMessageIndex + 1) % messages.length;
            charIndex = 0;
            resolve();
          }
        };

        deleteNextChar();
      });
    };

    resetMessage();
    this.addTimeout(setTimeout(typeMessage, delay));
  }

  cleanup() {
    this.timeouts.forEach((timeout) => clearTimeout(timeout));
    this.timeouts = null;

    let typingMessageElement = document.getElementById("typing-message");
    typingMessageElement.innerText = "I enjoy making open source software.";

    let cursorElement = document.getElementById("cursor");
    cursorElement.classList.remove("typing");
  }
};

var homeScript = new HomeScript();
