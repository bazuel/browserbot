import {ConfigService, StorageService} from "@browserbot/backend-shared";

import {unzip, strFromU8} from "fflate";

const configService = new ConfigService()
const storageService = new StorageService(configService)

export class Runner {

  async run() {
    const zip = await storageService.read(`sessions/staging.agentesmith.com/dashboard_@bb@_home/2022/08/24/1661346969648-716.zip`)
    unzip(new Uint8Array(zip), (err, data) => {
      for (let f in data) {
        const raw = strFromU8(data[f])
        const jsonEvents = JSON.parse(raw)
        console.log("jsonEvents: ", jsonEvents)
      }
    })
  }
}

