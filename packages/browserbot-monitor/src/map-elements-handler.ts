export class MapElementsHandler {

  private _mapElements: { [tag: string]: string[] } = {}
  private observer: IntersectionObserver;
  private listElements: { x, y, selector, tag }[] = []

  constructor(findUniqueSelector, selector: string) {
    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => this.listElements.push({
        x: entry.boundingClientRect.x,
        y: entry.boundingClientRect.y,
        selector: findUniqueSelector(entry.target),
        tag: entry.target.tagName
      }))
      this.groupElements(this.listElements)
    });

    this.observeElements(selector)
  }

  private observeElements(selector: string){
    const elements = document.querySelectorAll(selector);

    for (const element of elements) {
      this.observer.observe(element);
    }
  }

  private groupElements(entries: { x, y, selector, tag }[]) {

    let sortedElements = entries.sort((elem1, elem2) => {
      return elem1.x != elem2.x ? elem1.x - elem2.x : elem1.y - elem2.y
    })
    sortedElements.forEach(elem => this._mapElements[elem.tag].push(elem.selector))
  }

  get mapElements(): { [p: string]: string[] } {
    return this._mapElements;
  }
}