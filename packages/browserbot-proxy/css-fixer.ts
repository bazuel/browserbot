import {CssAbsoluteUrlTransformer} from "browserbot-common";
import {HttpClient} from "./http-requests";


export class CssFixer {

    hasQuote = /^\s*('|")/

    async fixCss(url: string, prefix: string) {
        let cssString: string = await new HttpClient().getAsString(url)
        let transformed = new CssAbsoluteUrlTransformer().transform(cssString, prefix + url)
        return transformed
    }

}
