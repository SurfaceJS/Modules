import IPattern    from "../../interfaces/pattern";
import NodeType    from "../../node-type";
import { PATTERN } from "../../symbols";

export default class ArrayPattern implements IPattern
{
    private _elements: Array<IPattern|null>;

    public [PATTERN]: void;

    public get elements(): Array<IPattern|null>
    {
        return this._elements;
    }

    public get type(): NodeType
    {
        return NodeType.ArrayPattern;
    }

    public constructor(elements: Array<IPattern|null>)
    {
        this._elements = elements;
    }

    public toString(): string
    {
        return `[${this.elements.map(x => (x ||  "").toString()).join(", ")}]`;
    }
}