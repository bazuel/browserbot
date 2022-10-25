import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  ViewChild
} from '@angular/core';
import { debounce } from '../../functions/throttle.util';

@Component({
  selector: 'bb-autocomplete',
  templateUrl: './autocomplete.component.html',
  styleUrls: ['./autocomplete.component.scss']
})
export class AutocompleteComponent<T = any> implements OnInit, OnChanges {
  @ViewChild('popup', { static: false }) popup?: ElementRef;
  @ViewChild('queryInput', { static: true }) queryInput!: ElementRef;

  @Input()
  items: T[] = [];

  itemsToShow: T[] = [];

  @Input()
  item?: T;

  @Output()
  itemSelected = new EventEmitter<T>();

  @Output()
  emptySelection = new EventEmitter<void>();

  @Input()
  show = false;

  @Input('input-class')
  inputClasses = '';
  @Input('menu-class')
  menuClasses = '';

  @Input()
  disabled = false;

  @Input()
  required = false;

  @Input()
  query? = '';

  @Output()
  queryChanged = new EventEmitter<string>();
  @Input()
  placeholder = '';

  @Input()
  property = '';

  @Input('second-property')
  secondProperty = '';

  @Input('property-id')
  propertyId? = '';

  @Input('selected-id')
  selectedId: string | number | undefined = '';

  @Input('third-property')
  thirdProperty = '';

  style: { left: string; top: string } = { left: '', top: '' };
  @Input()
  tooltipProperty?: string;

  @Input()
  hideMenuOnSelect = true;

  currentIndex = -1;

  @Input()
  showKeys = false;

  @Input()
  keysMapLabel: { [k in keyof T]: string } | {} = {};

  @Output()
  blur = new EventEmitter();
  @Output()
  onEnter = new EventEmitter<string>();
  @Output()
  queryEmpty = new EventEmitter();

  constructor() {}

  ngOnInit() {
    if (!this.query) this.query = '';
    if (!this.selectedId) this.selectedId = '';
    window.addEventListener(
      'scroll',
      debounce(() => {
        if (this.show) this.setPopupPosition();
      }, 100),
      true
    );
    this.updateItemsToShow();
    this.setSelected();
  }

  private setSelected() {
    if (this.selectedId) {
      const found = this.items.find(
        (i) => (this.propertyId ? i[this.propertyId] : i) == this.selectedId
      );
      if (found) {
        this.query = this.property
          ? `${found[this.property]}${
              this.secondProperty ? ' - ' + found[this.secondProperty] : ''
            }`
          : found + '';
      }
    }
  }

  setPopupPosition() {
    setTimeout(() => {
      if (this.queryInput && this.popup) {
        const pinnedRect = this.queryInput.nativeElement.getBoundingClientRect();
        if (this.popup) {
          const x = pinnedRect.x;
          this.popup.nativeElement.style.left = `${x}px`;
          this.popup.nativeElement.style.top = `${pinnedRect.y + pinnedRect.height + 2}px`;
        }
      }
    }, 16);
  }

  ngOnChanges(): void {
    this.updateItemsToShow();
  }

  onQueryChange(s: string) {
    this.show = true;
    this.queryChanged.emit(s);
    this.updateItemsToShow(s);
    if (s == '') {
      this.queryEmpty.emit();
    }
  }

  onItemClick(i: T) {
    console.log('i: ', i);
    this.query = '';
    if (!i[this.property] && i && typeof i === 'string') this.query = i;
    if (i[this.property]) this.query = i[this.property];
    if (i[this.secondProperty]) this.query = i[this.property] + ' ' + i[this.secondProperty];
    this.item = i;
    this.itemSelected.emit(this.item);
    if (this.hideMenuOnSelect)
      setTimeout(() => {
        this.show = false;
      }, 10);
  }

  checkifEmptyAndEmit() {
    if (this.query !== '') {
      this.updateItemsToShow();
    } else {
      this.emptySelection.emit();
    }
  }

  updateItemsToShow(query = '') {
    if (query == '') {
      if (this.items) this.itemsToShow = [...this.items];
    } else {
      const value = (i) => i[this.property] ?? i.name ?? i;
      const inQuery = (i) => {
        const s = value(i);
        return s.toLowerCase().indexOf(query.toLowerCase()) >= 0;
      };
      this.itemsToShow = this.items
        .filter((i) => inQuery(i))
        .sort((i1, i2) => {
          const s1 = value(i1);
          const s2 = value(i2);
          try {
            if (s1.indexOf(query) == 0) return -1;
            else if (s2.indexOf(query) == 0) return 1;
            else return 0;
          } catch {
            return 0;
          }
        });
    }
  }

  makeQueryEmpty() {
    this.query = '';
    console.log('this: ', this);
  }

  next() {
    this.currentIndex = Math.min(this.currentIndex + 1, this.itemsToShow.length - 1);
  }

  prev() {
    this.currentIndex = Math.max(-1, this.currentIndex - 1);
  }

  enterOnSelected() {
    const found = this.itemsToShow[this.currentIndex];
    if (found) this.onItemClick(found);
    this.onEnter.emit(this.query);
  }
}
