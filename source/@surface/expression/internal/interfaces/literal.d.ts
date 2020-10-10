import { LiteralValue } from "../types/operators";
import IExpression      from "./expression";

export default interface ILiteral extends IExpression
{
    value: LiteralValue;
}