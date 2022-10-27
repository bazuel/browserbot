import { selectors } from 'playwright';

export async function addPositionSelector() {
  // Must be a function that evaluates to a selector engine instance.
  const createPositionEngine = () => ({
    queryAll(root: Element, selector: string) {
      const rect = root.getBoundingClientRect();
      const x = +selector.split(',')[0];
      const y = +selector.split(',')[1];
      const width = +selector.split(',')[2];
      const height = +selector.split(',')[3];
      const topLeft1 = [x, y];
      const bottomRight1 = [x + width, y + height];
      const topLeft2 = [rect.left, rect.top];
      const bottomRight2 = [rect.right, rect.bottom];
      if (root.nodeName == '#document') return [root];
      else {
        if (topLeft1[0] > bottomRight2[0] || topLeft2[0] > bottomRight1[0]) {
          return [];
        }
        if (topLeft1[1] > bottomRight2[1] || topLeft2[1] > bottomRight1[1]) {
          return [];
        }
        if (
          Math.round(rect.height) == Math.round(height) &&
          Math.round(rect.width) == Math.round(width)
        )
          return [root];
        else return [];
      }
    }
  });
  await selectors.register('position', createPositionEngine);
}
