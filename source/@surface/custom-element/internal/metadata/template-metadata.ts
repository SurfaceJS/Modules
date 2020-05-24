import { Action }            from "@surface/core";
import IInjectDirective      from "../interfaces/directives/inject-directive";
import { TEMPLATE_METADATA } from "../symbols";
import { Scope }             from "../types";

type Factory   = (scope: Scope, context: Node, host: Node, template: HTMLTemplateElement, injectDirective?: IInjectDirective) => void;
type Injection = { scope: Scope, context: Node, host: Node, template: HTMLTemplateElement, directive: IInjectDirective };

type Target = object & { [TEMPLATE_METADATA]?: TemplateMetadata };

export default class TemplateMetadata
{
    public defaults:     Map<string, Action>    = new Map();
    public injections:   Map<string, Injection> = new Map();
    public placeholders: Map<string, Factory>   = new Map();

    public static from(target: Target): TemplateMetadata
    {
        return target[TEMPLATE_METADATA] = target[TEMPLATE_METADATA] ?? new TemplateMetadata();
    }
}