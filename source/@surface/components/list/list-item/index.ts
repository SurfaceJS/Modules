import Component   from "../..";
import { element } from "../../decorators";
import template    from "./index.html";
import style       from "./index.scss";

@element("surface-list-item", template, style)
export default class ListItem extends Component
{
    public constructor(content?: DocumentFragment)
    {
        super();

        if (content)
        {
            super.appendChild(content);
        }
    }

    protected fireRemove(): void
    {
        super.dispatchEvent(new CustomEvent("remove", { detail: this }));
    }
}