import { BBSerializedTarget } from '@browserbot/model';
import { Locator, Page } from 'playwright';

async function targetMatcher(target: BBSerializedTarget, page: Page): Promise<Locator> {
  // check tagname
  let actualSelector = target.tag;
  let locator: Locator = await page.locator(actualSelector);
  if ((await locator.count()) == 1) return locator;
  else if ((await locator.count()) > 1) {
    //check innerText
    locator = page.locator(actualSelector, { hasText: target.innerText });
    if ((await locator.count()) == 1) return locator;
    else {
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
          locator = await page.locator(
            addAttribute(actualSelector, attributesKey, attributesValue)
          );
          if ((await locator.count()) == 0) continue;
          if ((await locator.count()) == 1) return locator;
          actualSelector = addAttribute(actualSelector, attributesKey, attributesValue);
        }
      }
      if ((await locator.count()) > 1) {
        locator = page.locator(actualSelector, { hasText: target.innerText });
        if ((await locator.count()) == 1) return locator;
        if ((await locator.count()) > 1)
          return await filterForRect(actualSelector, target.rect, page);
      }
    }
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
  page: Page
): Promise<Locator> {
  let locatorByPoint = page.locator(
    `position=${rect.x + rect.width / 2},${rect.y + rect.height / 2},${rect.width},${
      rect.height
    } >> ${selector}`
  );
  console.log(await locatorByPoint.count());
  return locatorByPoint;
}
