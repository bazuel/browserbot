export async function injectScript(page, script) {
  await page.evaluate((script) => {
    const s = document.createElement('script');
    s.textContent = script;
    document.head.appendChild(s);
  }, script);
}
