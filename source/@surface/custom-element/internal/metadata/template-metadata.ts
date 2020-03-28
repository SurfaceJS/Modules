import { Action }            from "@surface/core";
import IInjectStatement      from "../interfaces/inject-statement";
import { TEMPLATE_METADATA } from "../symbols";
import { Scope }             from "../types";

type Factory   = (scope: Scope, host: Node, template: HTMLTemplateElement, injectStatement?: IInjectStatement) => void;
type Injection = { scope: Scope, template: HTMLTemplateElement, statement: IInjectStatement };

type Target = object & { [TEMPLATE_METADATA]?: TemplateMetadata };

export default class TemplateMetadata
{
    public processed: boolean = false;

    public injections: Map<string, Injection> = new Map();
    public injectors:  Map<string, Factory>  = new Map();

    public dispose?:   (node: Node, offset: number) => void;
    public onRemoved?: Action;

    public static from(target: Target): TemplateMetadata
    {
        return target[TEMPLATE_METADATA] = target[TEMPLATE_METADATA] ?? new TemplateMetadata();
    }

    public static hasMetadata(target: Target): boolean
    {
        return !!target[TEMPLATE_METADATA];
    }

    public static set(target: Target, metadata: TemplateMetadata): void
    {
        target[TEMPLATE_METADATA] = metadata;
    }

    public merge(templateMetadata: TemplateMetadata): void
    {
        for (const [key, value] of templateMetadata.injections)
        {
            this.injections.set(key, value);
        }

        for (const [key, value] of templateMetadata.injectors)
        {
            this.injectors.set(key, value);
        }
    }
}