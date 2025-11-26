// 1) Character pool that passwords can use
//    Includes uppercase, lowercase, digits, and common symbols
const UPPER = [
  "A","B","C","D","E","F","G","H","I","J","K","L","M","N","O","P","Q","R","S","T","U","V","W","X","Y","Z"
];
const LOWER = [
  "a","b","c","d","e","f","g","h","i","j","k","l","m","n","o","p","q","r","s","t","u","v","w","x","y","z"
];
const DIGITS = ["0","1","2","3","4","5","6","7","8","9"];
const SYMBOLS = [
  "~","`","!","@","#","$","%","^","&","*","(",")","_","-","+","=","{","[","}","]",",","|",":",";","<",">",".","?","/"
];
const BASE_LETTERS = [...UPPER, ...LOWER];

// 2) Safe random index helper using the Web Crypto API when available
function randomIndices(count, modulo) {
  // Use cryptographically strong randomness if the browser supports it
  if (window.crypto && window.crypto.getRandomValues) {
    const buf = new Uint32Array(count);
    window.crypto.getRandomValues(buf);
    // Map each random 32-bit number into the desired range [0, modulo)
    return Array.from(buf, n => n % modulo);
  }
  // Fallback to Math.random (less secure) to maintain functionality
  return Array.from({ length: count }, () => Math.floor(Math.random() * modulo));
}

// 3) Build a password string of a given length from the pool
function generatePassword(length = 15, pool) {
  if (!Array.isArray(pool) || pool.length === 0) {
    throw new Error("Character pool is empty");
  }
  if (Number.isNaN(length) || length < 1) {
    throw new Error("Password length must be a positive integer");
  }
  // Create an array of random indices and map to characters
  const idx = randomIndices(length, pool.length);
  return idx.map(i => pool[i]).join("");
}

// 4) Wire up UI elements and events once the DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  // Cache references to interactive elements
  const btn = document.getElementById("generate-btn");
  const out1 = document.getElementById("pwd1");
  const out2 = document.getElementById("pwd2");
  const lengthRadios = document.querySelectorAll('input[name="pwd-length"]');
  const includeNumbersEl = document.getElementById("include-numbers");
  const includeSymbolsEl = document.getElementById("include-symbols");

  // Defensive checks to avoid runtime errors if IDs change
  if (!btn || !out1 || !out2) return;

  // Helper: read selected length, default to 12 if none selected
  function getSelectedLength() {
    const selected = Array.from(lengthRadios).find(r => r.checked);
    const value = selected ? parseInt(selected.value, 10) : 12;
    if (![8,12,16].includes(value)) return 12;
    return value;
  }

  function currentPool() {
    const withNumbers = includeNumbersEl ? includeNumbersEl.checked : true;
    const withSymbols = includeSymbolsEl ? includeSymbolsEl.checked : true;
    const parts = [BASE_LETTERS];
    if (withNumbers) parts.push(DIGITS);
    if (withSymbols) parts.push(SYMBOLS);
    return parts.flat();
  }

  // On button click, generate two independent passwords of chosen length
  btn.addEventListener("click", () => {
    try {
      const len = getSelectedLength();
      const pool = currentPool();
      const p1 = generatePassword(len, pool);
      const p2 = generatePassword(len, pool);
      // Update the output elements; aria-live will announce changes
      out1.textContent = p1;
      out2.textContent = p2;
    } catch (err) {
      // If something goes wrong, show a friendly message in the UI
      const msg = "Could not generate passwords. Please try again.";
      out1.textContent = msg;
      out2.textContent = msg;
      // In development, also log the error to help debugging
      console.error(err);
    }
  });

  // Copy-on-click for outputs (also supports Enter/Space)
  function attachCopy(el) {
    const copyNow = () => {
      const text = (el.textContent || "").trim();
      if (!text || text === "—") return;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text)
          .then(() => {
            el.classList.add("copied");
            setTimeout(() => el.classList.remove("copied"), 1200);
          })
          .catch((e) => {
            console.error(e);
          });
      }
    };
    el.addEventListener("click", copyNow);
    el.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        copyNow();
      }
    });
  }

  attachCopy(out1);
  attachCopy(out2);
});




