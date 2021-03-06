import type { Constructor }                            from "@surface/core";
import { DisposableMetadata, HookableMetadata }        from "@surface/core";
import type ICustomElement                             from "./interfaces/custom-element";
import StaticMetadata                                  from "./metadata/static-metadata.js";
import { globalCustomDirectives }                      from "./singletons.js";
import type { DirectiveConstructor, DirectiveFactory } from "./types";

const CUSTOM_ELEMENT = Symbol("custom-element:instance");

export default class CustomElement extends HTMLElement implements ICustomElement
{
    public static readonly [CUSTOM_ELEMENT]: boolean = true;

    public shadowRoot!: ShadowRoot;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public constructor()
    {
        super();

        CustomElement.applyMetadata(this);
    }

    private static applyMetadata(instance: HTMLElement & { shadowRoot: ShadowRoot }): void
    {
        const staticMetadata = StaticMetadata.from(instance.constructor);

        instance.attachShadow(staticMetadata.shadowRootInit);

        (instance.shadowRoot as { adoptedStyleSheets?: CSSStyleSheet[] }).adoptedStyleSheets = staticMetadata.styles;

        const content = staticMetadata.template.content.cloneNode(true);

        instance.shadowRoot.appendChild(content);

        HookableMetadata.from(instance.constructor as Constructor<HTMLElement>).initialize(instance);
    }

    public static [Symbol.hasInstance](instance: object): boolean
    {
        return Reflect.get(instance.constructor, CUSTOM_ELEMENT);
    }

    public static as<T extends Constructor<HTMLElement>>(base: T): T & Constructor<ICustomElement>
    {
        return class CustomElementExtends extends base implements ICustomElement
        {
            public static readonly [CUSTOM_ELEMENT]: boolean = true;

            public shadowRoot!: ShadowRoot;

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            public constructor(...args: any[])
            {
                super(...args);

                CustomElement.applyMetadata(this);
            }

            public dispose(): void
            {
                DisposableMetadata.from(this).dispose();
            }
        };
    }

    public static registerDirective(name: string, handler: DirectiveConstructor | DirectiveFactory): void
    {
        globalCustomDirectives.set(name, handler);
    }

    public dispose(): void
    {
        DisposableMetadata.from(this).dispose();
    }
}