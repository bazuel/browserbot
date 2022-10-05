import {DOMJson} from "browserbot-common";

export interface DomDeserializer {
    deserialize(json: DOMJson, document: Document): Node
}
