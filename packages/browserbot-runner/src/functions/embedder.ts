export async function injectScript(script) {
  await this.page.evaluate((serializerScript) => {
    const s = document.createElement('script');
    s.textContent = serializerScript;
    document.head.appendChild(s);
  }, script);
}
