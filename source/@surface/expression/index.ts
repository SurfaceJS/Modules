import { Indexer }                                            from "@surface/core";
import IArrayExpression                                       from "./interfaces/array-expression";
import IAssignmentExpression                                  from "./interfaces/assignment-expression";
import IBinaryExpression                                      from "./interfaces/binary-expression";
import ICallExpression                                        from "./interfaces/call-expression";
import IConditionalExpression                                 from "./interfaces/conditional-expression";
import IConstantExpression                                    from "./interfaces/constant-expression";
import IExpression                                            from "./interfaces/expression";
import IIdentifierExpression                                  from "./interfaces/identifier-expression";
import IMemberExpression                                      from "./interfaces/member-expression";
import INewExpression                                         from "./interfaces/new-expression";
import IObjectExpression                                      from "./interfaces/object-expression";
import IPropertyExpression                                    from "./interfaces/property-expression";
import IRegexExpression                                       from "./interfaces/regex-expression";
import ISpreadExpression                                      from "./interfaces/spread-expression";
import ITemplateExpression                                    from "./interfaces/template-expression";
import IUnaryExpression                                       from "./interfaces/unary-expression";
import ArrayExpression                                        from "./internal/expressions/array-expression";
import AssignmentExpression                                   from "./internal/expressions/assignment-expression";
import BinaryExpression                                       from "./internal/expressions/binary-expression";
import CallExpression                                         from "./internal/expressions/call-expression";
import ConditionalExpression                                  from "./internal/expressions/conditional-expression";
import ConstantExpression                                     from "./internal/expressions/constant-expression";
import IdentifierExpression                                   from "./internal/expressions/identifier-expression";
import MemberExpression                                       from "./internal/expressions/member-expression";
import NewExpression                                          from "./internal/expressions/new-expression";
import ObjectExpression                                       from "./internal/expressions/object-expression";
import PropertyExpression                                     from "./internal/expressions/property-expression";
import RegexExpression                                        from "./internal/expressions/regex-expression";
import SpreadExpression                                       from "./internal/expressions/spread-expression";
import TemplateExpression                                     from "./internal/expressions/template-expression";
import UnaryExpression                                        from "./internal/expressions/unary-expression";
import Parser                                                 from "./internal/parser";
import { AssignmentOpertaror, BinaryOperator, UnaryOperator } from "./types";

export default abstract class Expression
{
    public static array(elements: Array<IExpression>): IArrayExpression
    {
        return new ArrayExpression(elements);
    }

    public static assignment(left: IExpression, right: IExpression, operator: AssignmentOpertaror): IAssignmentExpression
    {
        return new AssignmentExpression(left, right, operator);
    }

    public static binary(left: IExpression, right: IExpression, operator: BinaryOperator): IBinaryExpression
    {
        return new BinaryExpression(left, right, operator);
    }

    public static call(context: IExpression, callee: IExpression, args: Array<IExpression>): ICallExpression
    {
        return new CallExpression(context, callee, args);
    }

    public static conditional(condition: IExpression, thuthy: IExpression, falsy: IExpression): IConditionalExpression
    {
        return new ConditionalExpression(condition, thuthy, falsy);
    }

    public static constant(value: unknown): IConstantExpression
    {
        return new ConstantExpression(value);
    }

    public static from(source: string, context?: object): IExpression
    {
        return Parser.parse(source, context || { });
    }

    public static identifier(context: object, name: string): IIdentifierExpression
    {
        return new IdentifierExpression(context as Indexer, name);
    }

    public static member(target: IExpression, key: IExpression): IMemberExpression
    {
        return new MemberExpression(target, key);
    }

    public static new(callee: IExpression, args: Array<IExpression>): INewExpression
    {
        return new NewExpression(callee, args);
    }

    public static object(properties: Array<IPropertyExpression>): IObjectExpression
    {
        return new ObjectExpression(properties);
    }

    public static property(key: IExpression, value: IExpression): IPropertyExpression
    {
        return new PropertyExpression(key, value);
    }

    public static regex(pattern: string, flags: string): IRegexExpression
    {
        return new RegexExpression(pattern, flags);
    }

    public static spread(argument: IExpression): ISpreadExpression
    {
        return new SpreadExpression(argument);
    }

    public static template(quasis: Array<string>, expressions: Array<IExpression>): ITemplateExpression
    {
        return new TemplateExpression(quasis, expressions);
    }

    public static unary(expression: IExpression, operator: UnaryOperator): IUnaryExpression
    {
        return new UnaryExpression(expression, operator);
    }
}