import type { IDisposable }     from "@surface/core";
import type ITemplateDescriptor from "../interfaces/template-descriptor";
import TemplateParser           from "../parsers/template-parser.js";
import TemplateProcessor        from "./template-processor.js";

const cache = new Map<string, [template: HTMLTemplateElement, descriptor: ITemplateDescriptor]>();

export default function processTemplate(template: string, scope: object): [content: DocumentFragment, disposable: IDisposable]
{
    if (!cache.has(template))
    {
        const templateElement = document.createElement("template");

        templateElement.innerHTML = template;

        cache.set(template, TemplateParser.parse("annonymous", template));
    }

    const [parsed, descriptor] = cache.get(template)!;
    const content              = parsed.content;

    const disposable = TemplateProcessor.process({ descriptor, host: content, root: content, scope });

    return [content, disposable];
}