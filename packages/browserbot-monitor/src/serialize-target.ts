/*
{x,y,height,width,innerText,tag,attributi} */

export function getElementAttributes(element: Element): { [p: string]: string | null } {
  let attributes: { [member: string]: string | null } = {};
  for (const { name, value } of Array.from(element.attributes ?? [])) {
    attributes[name] = value;
  }
  return attributes;
}

export async function getElementRect(element: Element) {
  return new Promise<{ x: number; y: number; width: number; height: number }>((resolve) => {
    const obs = new IntersectionObserver((entries) => {
      const rects = entries.map((entry) => {
        const { x, y, width, height } = entry.boundingClientRect;
        return { x, y, width, height };
      });
      obs.disconnect();
      resolve(rects[0]);
    });
    obs.observe(element);
  });
}
