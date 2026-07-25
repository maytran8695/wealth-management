const PREFIX = "wealth-compass:";

window.storage = {
  async get(key) {
    const raw = localStorage.getItem(PREFIX + key);
    if (raw === null) return null;
    return { value: raw };
  },
  async set(key, value) {
    localStorage.setItem(PREFIX + key, value);
    return true;
  },
};
