import { notify }  from "@surface/observer/common";
import Component   from "..";
import { element } from "../decorators";
import template    from "./index.html";
import style       from "./index.scss";

@element("surface-pager", template, style)
export default class Pager extends Component
{
    private _page: number = 1;

    protected get endRange(): number
    {
        // FIXME
        const pageCount = this.pageCount;

        const startRange = this.startRange;

        return startRange + 4 > pageCount ? pageCount : startRange + 4;
    }

    public get page(): number
    {
        return this._page;
    }

    public get pageCount(): number
    {
        return Number.parseInt(super.getAttribute("page-count") || "0");
    }

    public set pageCount(value: number)
    {
        if (value != this.pageCount)
        {
            if (value < this.page)
            {
                this._page = value;
            }

            super.setAttribute("page-count", value.toString());
            this.pageChanged();
        }
    }

    protected get startRange(): number
    {
        // FIXME
        const pageCount = this.pageCount;

        return this.page > 2 ?
            pageCount - this.page < 2 && pageCount - 4 > 0 ?
                pageCount - 4
                : this.page - 2
            : 1;
    }

    private pageChanged(): void
    {
        notify(this, "page");
        notify(this, "startRange" as keyof this);
        notify(this, "endRange" as keyof this);

        super.dispatchEvent(new Event("change"));
    }

    public firstPage(): void
    {
        if (this.page != 1)
        {
            this._page = 1;
            this.pageChanged();
        }
    }

    public lastPage(): void
    {
        if (this.page != this.pageCount)
        {
            this._page = this.pageCount;
            this.pageChanged();
        }
    }

    public nextPage(): void
    {
        if (this.page + 1 <= this.pageCount)
        {
            this._page++;
            this.pageChanged();
        }
    }

    public previousPage(): void
    {
        if (this.page - 1 > 0)
        {
            this._page--;
            this.pageChanged();
        }
    }

    public setPage(page: number): void
    {
        if (page != this.page)
        {
            if (page < 1)
            {
                throw new Error("Page cannot be lesser than 1");
            }
            else if (page > this.pageCount)
            {
                throw new Error("Page exceed total of pages");
            }

            this._page = page;

            this.pageChanged();
        }
    }
}