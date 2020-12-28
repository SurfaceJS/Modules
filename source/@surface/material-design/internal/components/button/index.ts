import { mixer }                                    from "@surface/core";
import CustomElement, { attribute, element, query } from "@surface/custom-element";
import { computed }                                 from "@surface/reactive";
import colorable                                    from "../../mixins/colorable/index.js";
import disableable                                  from "../../mixins/disableable/index.js";
import elevatable                                   from "../../mixins/elevatable/index.js";
import rippleable                                   from "../../mixins/rippleable/index.js";
import themeable                                    from "../../mixins/themeable/index.js";
import template                                     from "./index.html";
import style                                        from "./index.scss";

declare global
{
    // eslint-disable-next-line @typescript-eslint/naming-convention
    interface HTMLElementTagNameMap
    {
        "smd-buttom": Button;
    }
}

export type Size = ""
| "x-small"
| "small"
| "medium"
| "large"
| "x-large";

@element("smd-button", template, style)
export default class Button extends mixer(CustomElement, [colorable, disableable, elevatable, rippleable, themeable])
{
    @query("#root")
    protected colorable!: HTMLElement;

    @query("#root")
    protected rippleable!: HTMLElement;

    @attribute
    public block: boolean = false;

    @attribute
    public fab: boolean = false;

    @attribute
    public icon: boolean = false;

    @attribute
    public rounded: boolean = false;

    @attribute
    public size: Size = "";

    @attribute
    public outlined: boolean = false;

    @attribute
    public text: boolean = false;

    @attribute
    public tile: boolean = false;

    @computed("block", "fab", "icon", "outlined", "rounded", "text", "tile", "elevationClasses", "themeClasses")
    public get classes(): Record<string, boolean>
    {
        return {
            ...super.elevationClasses,
            ...super.themeClasses,
            block:      this.block,
            container:  true,
            fab:        this.fab,
            icon:       this.icon,
            outlined:   this.outlined,
            rounded:    this.rounded,
            text:       this.text,
            tile:       this.tile,
        };
    }
}