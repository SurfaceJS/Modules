import { Func2 }          from "@surface/core";
import IExpression        from "../../interfaces/expression";
import NodeType           from "../../node-type";
import { BinaryOperator } from "../../types";
import BaseExpression     from "./abstracts/base-expression";

const binaryFunctions: Record<BinaryOperator, Func2<IExpression, IExpression, unknown>> =
{
    "+":          (left: IExpression, right: IExpression) => (left.evaluate() as number) +          (right.evaluate() as number),
    "-":          (left: IExpression, right: IExpression) => (left.evaluate() as number) -          (right.evaluate() as number),
    "*":          (left: IExpression, right: IExpression) => (left.evaluate() as number) *          (right.evaluate() as number),
    "/":          (left: IExpression, right: IExpression) => (left.evaluate() as number) /          (right.evaluate() as number),
    "%":          (left: IExpression, right: IExpression) => (left.evaluate() as number) %          (right.evaluate() as number),
    "**":         (left: IExpression, right: IExpression) => (left.evaluate() as number) **         (right.evaluate() as number),
    "&":          (left: IExpression, right: IExpression) => (left.evaluate() as number) &          (right.evaluate() as number),
    "|":          (left: IExpression, right: IExpression) => (left.evaluate() as number) |          (right.evaluate() as number),
    "^":          (left: IExpression, right: IExpression) => (left.evaluate() as number) ^          (right.evaluate() as number),
    "<<":         (left: IExpression, right: IExpression) => (left.evaluate() as number) <<         (right.evaluate() as number),
    ">>":         (left: IExpression, right: IExpression) => (left.evaluate() as number) >>         (right.evaluate() as number),
    ">>>":        (left: IExpression, right: IExpression) => (left.evaluate() as number) >>>        (right.evaluate() as number),
    "==":         (left: IExpression, right: IExpression) => (left.evaluate() as Object) ==         (right.evaluate() as Object),
    "===":        (left: IExpression, right: IExpression) => (left.evaluate() as Object) ===        (right.evaluate() as Object),
    "!=":         (left: IExpression, right: IExpression) => (left.evaluate() as Object) !=         (right.evaluate() as Object),
    "!==":        (left: IExpression, right: IExpression) => (left.evaluate() as Object) !==        (right.evaluate() as Object),
    "<=":         (left: IExpression, right: IExpression) => (left.evaluate() as Object) <=         (right.evaluate() as Object),
    ">=":         (left: IExpression, right: IExpression) => (left.evaluate() as Object) >=         (right.evaluate() as Object),
    "<":          (left: IExpression, right: IExpression) => (left.evaluate() as Object) <          (right.evaluate() as Object),
    ">":          (left: IExpression, right: IExpression) => (left.evaluate() as Object) >          (right.evaluate() as Object),
    "in":         (left: IExpression, right: IExpression) => (left.evaluate() as string) in         (right.evaluate() as Function),
    "instanceof": (left: IExpression, right: IExpression) => (left.evaluate() as Object) instanceof (right.evaluate() as Function),
};

export default class BinaryExpression extends BaseExpression
{
    private readonly operation: Func2<IExpression, IExpression, unknown>;

    private _left: IExpression;
    public get left(): IExpression
    {
        return this._left;
    }

    public set left(value: IExpression)
    {
        this._left = value;
    }

    private _operator: BinaryOperator;
    public get operator(): BinaryOperator
    {
        return this._operator;
    }

    private _right: IExpression;
    public get right(): IExpression
    {
        return this._right;
    }

    public set right(value: IExpression)
    {
        this._right = value;
    }

    public get type(): NodeType
    {
        return NodeType.Binary;
    }

    public constructor(left: IExpression, right: IExpression, operator: BinaryOperator)
    {
        super();

        this._left     = left;
        this._operator = operator;
        this._right    = right;
        this.operation = binaryFunctions[this.operator];
    }

    public evaluate(): unknown
    {
        return this._cache = this.operation(this.left, this.right);
    }

    public toString(): string
    {
        return `${this.left.type == NodeType.Object && this.operator == "instanceof" ? `(${this.left})` : this.left} ${this.operator} ${this.right}`;
    }
}