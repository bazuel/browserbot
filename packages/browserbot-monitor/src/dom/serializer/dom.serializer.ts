import {DOMJson} from "../../dom.event";


export interface DomSerializer {
    serialize(n: Node): DOMJson
}
