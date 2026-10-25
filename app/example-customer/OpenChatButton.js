"use client";

// The host page's own "Get a price" button. It opens the floating widget through its public
// open() method, the same way a contractor's real site could.

export default function OpenChatButton({ className, children }) {
  function openChat() {
    const widget = document.querySelector("quotebot-widget");
    if (widget && typeof widget.open === "function") widget.open();
  }
  return (
    <button type="button" className={className} onClick={openChat}>
      {children}
    </button>
  );
}
