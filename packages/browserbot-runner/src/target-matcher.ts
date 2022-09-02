import { BBSerializedTarget } from '@browserbot/model';
import { Locator, Page } from 'playwright';

async function targetMatcher(target: BBSerializedTarget, page: Page): Promise<Locator> {
  // check tagname
  let actualSelector = target.tag;
  let locator: Locator = await page.locator(actualSelector);
  console.log('tag', await locator.count());
  if ((await locator.count()) == 1) return locator;
  else if ((await locator.count()) > 1) {
    //check attributes
    for (const attributesKey in target.attributes) {
      let attributesValue = target.attributes[attributesKey];
      if (attributesKey == 'class') {
        const classes = attributesValue.split(' ');
        for (const className of classes) {
          locator = await page.locator(addClass(actualSelector, className));
          if ((await locator.count()) == 0) continue;
          if ((await locator.count()) == 1) return locator;
          actualSelector = addClass(actualSelector, className);
        }
      } else {
        let testLocator = await page.locator(
          addAttribute(actualSelector, attributesKey, attributesValue)
        );
        if ((await testLocator.count()) == 0) continue;
        if ((await testLocator.count()) == 1) return testLocator;
        locator = testLocator;
        actualSelector = addAttribute(actualSelector, attributesKey, attributesValue);
      }
    }

    //check innerText
    let newLocator = page.locator(actualSelector, { hasText: target.innerText });
    console.log(await newLocator.count());
    locator = (await newLocator.count()) != 0 ? newLocator : locator;
    console.log(await locator.count());
    if ((await locator.count()) == 1) return locator;
    if ((await locator.count()) > 1)
      //check clientRect
      return await filterForRect(actualSelector, target.rect, page, locator);
  }
  // check rectElement
}

export async function locatorFromTarget(target: BBSerializedTarget, page): Promise<Locator> {
  const locator = await targetMatcher(target, page);
  return locator;
}

function addAttribute(oldSelector: string, key: string, value: string) {
  return `${oldSelector}[${key.toLowerCase()}${value ? `="${value}"` : ''}]`;
}

function addClass(oldSelector: string, className: string) {
  return `${oldSelector}.${className}`;
}

async function filterForRect(
  selector,
  rect: { x: number; y: number; width: number; height: number },
  page: Page,
  locator: Locator
): Promise<Locator> {
  console.log(await locator.count());
  let finalLocator = locator.filter({
    has: page.locator(
      `position=${Math.round(rect.x + rect.width / 2)},${Math.round(rect.y + rect.height / 2)}`
    )
  });
  console.log(await finalLocator.count());
  return finalLocator;
}
