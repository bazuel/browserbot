import {Component, OnInit} from '@angular/core';
import {unzip, strFromU8} from 'fflate';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'browserbot-frontend';


  constructor() {
  }

  async ngOnInit() {
    const zip = await fetch(`http://localhost:3005/api/session/download?path=sessions/staging.agentesmith.com/dashboard_@bb@_home/2022/08/24/1661346969648-716.zip`).then(r => r.arrayBuffer())
    unzip(new Uint8Array(zip), (err, data) => {
      for(let f in data){
        const raw = strFromU8(data[f])
        const jsonEvents = JSON.parse(raw)
        console.log("jsonEvents: ",jsonEvents)
      }
    })
  }

}
