import {DomSerializer} from "./dom.serializer";
import {ElementSerializer} from "./element.serializer";
import {DOMJson} from "../../dom.event";

export class SvgDomSerializer implements DomSerializer {

    constructor(private elementDomSerializer: ElementSerializer) {
    }

    serialize(n: Node): DOMJson {
        return this.elementDomSerializer.serialize(n);
    }

}
