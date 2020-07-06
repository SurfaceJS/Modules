import { Indexer, hasValue, format } from "@surface/core";
import IExpression                   from "../interfaces/expression";
import IIdentifier                   from "../interfaces/identifier";
import IPattern                      from "../interfaces/pattern";
import Messages                      from "../messages";
import NodeType                      from "../node-type";
import { PATTERN }                   from "../symbols";

export default class Identifier implements IExpression, IPattern
{
    private cache: unknown;
    private _name: string;

    public [PATTERN]: void;

    public get name(): string
    {
        return this._name;
    }

    /* istanbul ignore next */
    public set name(value: string)
    {
        this._name = value;
    }

    public get type(): NodeType
    {
        return NodeType.Identifier;
    }

    public constructor(name: string)
    {
        this._name = name;
    }

    public clone(): IIdentifier
    {
        return new Identifier(this.name);
    }

    public evaluate(scope: object, useCache?: boolean): unknown
    {
        if (useCache && hasValue(this.cache))
        {
            return this.cache;
        }

        if (this.name == "undefined")
        {
            return undefined;
        }

        if (!(this.name in scope))
        {
            throw new ReferenceError(format(Messages.identifierIsNotDefined, { identifier: this.name }));
        }

        return this.cache = (scope as Indexer)[this.name];
    }

    public toString(): string
    {
        return this.name;
    }
}