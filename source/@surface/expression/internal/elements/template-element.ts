import INode    from "../../interfaces/node";
import NodeType from "../../node-type";

export default class TemplateElement implements INode
{
    private _cooked: string;
    public get cooked(): string
    {
        return this._cooked;
    }

    /* istanbul ignore next */
    public set cooked(value: string)
    {
        this._cooked = value;
    }

    private _raw: string;
    public get raw(): string
    {
        return this._raw;
    }

    /* istanbul ignore next */
    public set raw(value: string)
    {
        this._raw = value;
    }

    private _tail: boolean;
    /* istanbul ignore next */
    public get tail(): boolean
    {
        return this._tail;
    }

    /* istanbul ignore next */
    public set tail(value: boolean)
    {
        this._tail = value;
    }

    public get type(): NodeType
    {
        return NodeType.TemplateElement;
    }

    public constructor(cooked: string, raw: string, tail: boolean)
    {
        this._cooked = cooked;
        this._raw    = raw;
        this._tail   = tail;
    }
}