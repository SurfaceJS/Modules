import { Indexer }  from "@surface/core";
import { hasValue } from "@surface/core/common/generic";
import IExpression  from "../../interfaces/expression";
import NodeType     from "../../node-type";

export default class ConditionalExpression implements IExpression
{
    private cache: unknown;

    private _alternate: IExpression;
    public get alternate(): IExpression
    {
        return this._alternate;
    }

    /* istanbul ignore next */
    public set alternate(value: IExpression)
    {
        this._alternate = value;
    }

    private _consequent: IExpression;
    public get consequent(): IExpression
    {
        return this._consequent;
    }

    /* istanbul ignore next */
    public set consequent(value: IExpression)
    {
        this._consequent = value;
    }

    private _test: IExpression;
    public get test(): IExpression
    {
        return this._test;
    }

    /* istanbul ignore next */
    public set test(value: IExpression)
    {
        this._test = value;
    }

    public get type(): NodeType
    {
        return NodeType.ConditionalExpression;
    }

    public constructor(test: IExpression, alternate: IExpression, consequent: IExpression)
    {
        this._test       = test;
        this._consequent = consequent;
        this._alternate  = alternate;
    }

    public evaluate(scope: Indexer, useCache?: boolean): unknown
    {
        if (useCache && hasValue(this.cache))
        {
            return this.cache;
        }

        return this.cache = this.test.evaluate(scope, useCache) ? this.alternate.evaluate(scope, useCache) : this.consequent.evaluate(scope, useCache);
    }

    public toString(): string
    {
        return `${this.test} ? ${this.alternate} : ${this.consequent}`;
    }
}