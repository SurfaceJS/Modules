import { element } from "@surface/custom-element/decorators";
import Component   from "../..";
import template    from "./index.html";
import style       from "./index.scss";

@element("surface-list-item", template, style)
export default class ListItem extends Component
{
    public constructor(node?: Node)
    {
        super();

        if (node)
        {
            super.appendChild(node);
        }
    }

    protected fireRemove(): void
    {
        super.dispatchEvent(new CustomEvent("remove", { detail: this }));
    }
}