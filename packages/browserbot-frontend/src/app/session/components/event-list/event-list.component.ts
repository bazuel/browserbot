import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'bb-event-list',
  templateUrl: './event-list.component.html',
  styleUrls: ['./event-list.component.scss']
})
export class EventListComponent implements OnInit {
  @Input()
  sessionPath!: string;
  events: any;

  constructor() {}

  ngOnInit(): void {}
}
