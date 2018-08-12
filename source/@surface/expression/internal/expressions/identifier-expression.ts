import { ObjectLiteral } from "@surface/core";
import ExpressionType    from "../../expression-type";
import IExpression       from "../../interfaces/expression";

export default class IdentifierExpression implements IExpression
{
    private readonly _context: ObjectLiteral;
    public get context(): ObjectLiteral
    {
        return this._context;
    }

    private _name: string;
    public get name(): string
    {
        return this._name;
    }

    public get type(): ExpressionType
    {
        return ExpressionType.Identifier;
    }

    public constructor(context: object, name: string)
    {
        if (!(name in context))
        {
            throw new Error(`The identifier ${name} does not exist in this context`);
        }

        this._context = context;
        this._name    = name;
    }

    public evaluate(): unknown
    {
        return this.context[this.name];
    }
}