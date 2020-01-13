import { Indexer }  from "@surface/core";
import { clone }    from "@surface/core/common/object";
import { element }  from "@surface/custom-element/decorators";
import Type         from "@surface/reflection";
import MethodInfo   from "@surface/reflection/method-info";
import PropertyInfo from "@surface/reflection/property-info";
import Component    from "../..";
import template     from "./index.html";
import style        from "./index.scss";

@element("surface-data-row", template, style)
export default class DataRow<T extends object = object> extends Component
{

    private _data:     T;
    private _editMode: boolean = false;
    private _new:      boolean;

    private _reference: T;

    public get data(): T
    {
        return this._data;
    }

    public set data(value: T)
    {
        this._data = value;
    }

    public get editMode(): boolean
    {
        return this._editMode;
    }

    public get new(): boolean
    {
        return this._new;
    }

    public get reference(): T
    {
        return this._reference;
    }

    public constructor(isNew?: boolean, data?: T)
    {
        super();
        this._new  = isNew ?? true;
        this._data = clone(data || { }) as T;

        this._reference = data || { } as T;

        if (this.new)
        {
            super.setAttribute("new", "true");
        }
    }

    private copy<TTarget extends object, TSource extends object>(target: TTarget, source: TSource): void;
    private copy(target: Indexer, source: Indexer): void
    {
        for (const member of Type.from(target).getMembers())
        {
            if (!(member instanceof MethodInfo) && member.key in source)
            {
                const key = member.key as string;

                const value = source[key];

                if (value instanceof Object)
                {
                    this.copy(target[key] as Indexer, value as Indexer);
                }
                else if (!(member instanceof PropertyInfo && member.readonly))
                {
                    (target)[key] = source[key];
                }
            }
        }
    }

    public enterEdit(): void
    {
        this._editMode = true;
        super.dispatchEvent(new CustomEvent("enter-edit", { detail: this }));
    }

    public leaveEdit(): void
    {
        this._editMode = false;
        super.dispatchEvent(new CustomEvent("leave-edit", { detail: this }));
    }

    public save(): void
    {
        this.copy(this._reference, this._data);

        if (this.new)
        {
            super.removeAttribute("new");
            this._new = false;
        }
    }

    public undo(): void
    {
        this.copy(this._data, this._reference);
    }
}