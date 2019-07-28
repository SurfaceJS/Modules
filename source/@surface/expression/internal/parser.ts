import { Nullable } from "@surface/core";
import { tuple }    from "@surface/core/common/generic";
import { format }   from "@surface/core/common/string";
import IExpression  from "../interfaces/expression";
import INode        from "../interfaces/node";
import IPattern     from "../interfaces/pattern";
import NodeType     from "../node-type";
import SyntaxError  from "../syntax-error";
import
{
    AssignmentOperator,
    BinaryOperator,
    CoalesceOperator,
    LiteralValue,
    LogicalOperator,
    UnaryOperator,
    UpdateOperator,
} from "../types";
import { hasDuplicated }       from "./common";
import AssignmentProperty      from "./elements/assignment-property";
import Property                from "./elements/property";
import SpreadElement           from "./elements/spread-element";
import TemplateElement         from "./elements/template-element";
import ArrayExpression         from "./expressions/array-expression";
import ArrowFunctionExpression from "./expressions/arrow-function-expression";
import AssignmentExpression    from "./expressions/assignment-expression";
import BinaryExpression        from "./expressions/binary-expression";
import CallExpression          from "./expressions/call-expression";
import CoalesceExpression      from "./expressions/coalesce-expression";
import ConditionalExpression   from "./expressions/conditional-expression";
import Identifier              from "./expressions/identifier";
import Literal                 from "./expressions/literal";
import LogicalExpression       from "./expressions/logical-expression";
import MemberExpression        from "./expressions/member-expression";
import NewExpression           from "./expressions/new-expression";
import ObjectExpression        from "./expressions/object-expression";
import SequenceExpression      from "./expressions/sequence-expression";
import TemplateLiteral         from "./expressions/template-literal";
import ThisExpression          from "./expressions/this-expression";
import UnaryExpression         from "./expressions/unary-expression";
import UpdateExpression        from "./expressions/update-expression";
import Messages                from "./messages";
import ArrayPattern            from "./patterns/array-pattern";
import AssignmentPattern       from "./patterns/assignment-pattern";
import ObjectPattern           from "./patterns/object-pattern";
import RestElement             from "./patterns/rest-element";
import Scanner, { Token }      from "./scanner";
import TokenType               from "./token-type";
import TypeGuard               from "./type-guard";

export default class Parser
{
    private readonly scanner: Scanner;

    private invalidInitialization: Nullable<Token>;
    private lookahead:             Token;

    private constructor(source: string)
    {
        this.scanner               = new Scanner(source);
        this.lookahead             = this.scanner.nextToken();
        this.invalidInitialization = null;
    }

    public static parse(source: string): IExpression
    {
        return new Parser(source).parseExpression();
    }

    private argumentsExpression(): Array<IExpression|SpreadElement>
    {
        this.expect("(");

        const args: Array<IExpression|SpreadElement> = [];

        if (!this.match(")"))
        {
            while (true)
            {
                const expression = this.inheritGrammar(this.match("...") ? this.spreadExpression : this.assignmentExpression);

                args.push(expression);

                if (this.match(")"))
                {
                    break;
                }

                this.expect(",");

                if (this.match(")"))
                {
                    break;
                }
            }
        }

        this.expect(")");

        return args;
    }

    private arrayPattern(): ArrayPattern
    {
        const elements: Array<IPattern|null> = [];

        this.expect("[");

        while (!this.match("]"))
        {
            if (this.match(","))
            {
                elements.push(null);
                this.nextToken();
            }

            if (this.match("..."))
            {
                this.expect("...");

                elements.push(new RestElement(this.inheritGrammar(this.pattern, false)));

                if (!this.match("]"))
                {
                    throw this.syntaxError(Messages.restParameterMustBeLastFormalParameter);
                }
            }
            else if (this.match("["))
            {
                elements.push(this.inheritGrammar(this.arrayPattern));
            }
            else if (this.match("{"))
            {
                elements.push(this.inheritGrammar(this.objectPattern));
            }
            else
            {
                elements.push(this.reinterpretPattern(this.inheritGrammar(this.assignmentExpression)));
            }

            if (!this.match("]"))
            {
                this.expect(",");
            }
        }

        this.expect("]");

        return new ArrayPattern(elements);
    }

    private arrayExpression(): IExpression
    {
        const elements: Array<IExpression|SpreadElement|null> = [];

        this.expect("[");

        while (!this.match("]"))
        {
            if (this.match(","))
            {
                elements.push(null);
                this.nextToken();
            }

            if (this.match("..."))
            {
                elements.push(this.inheritGrammar(this.spreadExpression));
            }
            else if (!this.match("]"))
            {
                elements.push(this.inheritGrammar(this.assignmentExpression));
            }

            if (!this.match("]"))
            {
                this.expect(",");
            }
        }

        this.expect("]");

        return new ArrayExpression(elements);
    }

    private assignmentExpression(): IExpression
    {
        const left = this.inheritGrammar(this.conditionalExpression);

        const isAssignment = this.match("=")
            || this.match("*=")
            || this.match("**=")
            || this.match("/=")
            || this.match("%=")
            || this.match("+=")
            || this.match("-=")
            || this.match("<<=")
            || this.match(">>=")
            || this.match(">>>=")
            || this.match("&=")
            || this.match("^=")
            || this.match("|=");

        if (isAssignment)
        {
            const token = this.nextToken();

            const right = this.isolateGrammar(this.assignmentExpression);

            return new AssignmentExpression(left, right, token.raw as AssignmentOperator);
        }
        else
        {
            return left;
        }
    }

    private binaryExpression(): IExpression
    {
        let expression = this.inheritGrammar(this.exponentiationExpression);

        let precedence = this.binaryPrecedence(this.lookahead);

        if (precedence > 0)
        {
            const token = this.nextToken();

            let left  = expression;
            let right = this.isolateGrammar(this.exponentiationExpression);

            const stack = tuple(left, token.raw as BinaryOperator|LogicalOperator, right);
            const precedences = [precedence];

            while (true)
            {
                precedence = this.binaryPrecedence(this.lookahead);

                if (precedence <= 0)
                {
                    break;
                }

                while (stack.length > 2 && precedence <= precedences[precedences.length - 1])
                {
                    right = stack.pop() as IExpression;

                    const operator = stack.pop() as BinaryOperator|CoalesceOperator|LogicalOperator;

                    left = stack.pop() as IExpression;

                    precedences.pop();

                    stack.push(operator == "??" ? new CoalesceExpression(left, right) : operator == "&&" || operator == "||" ? new LogicalExpression(left, right, operator) : new BinaryExpression(left, right, operator));
                }

                stack.push(this.nextToken().raw as BinaryOperator|LogicalOperator);

                precedences.push(precedence);

                stack.push(this.isolateGrammar(this.exponentiationExpression));
            }

            let i = stack.length - 1;

            expression = stack[i] as IExpression;

            while (i > 1)
            {
                const operator = stack[i - 1] as BinaryOperator|CoalesceOperator|LogicalOperator;

                left  = stack[i - 2] as IExpression;
                right = expression;

                expression = operator == "??" ?
                    new CoalesceExpression(left, right)
                    : operator == "&&" || operator == "||" ?
                        new LogicalExpression(left, right, operator)
                        : new BinaryExpression(left, right, operator);

                i -= 2;
            }
        }

        return expression;
    }

    private binaryPrecedence(token: Token): number
    {
        const operator = token.raw;

        if (token.type == TokenType.Punctuator)
        {
            switch (operator)
            {
                case ")":
                case ";":
                case ",":
                case "=":
                case "]":
                default:
                    return 0;

                case "??":
                    return 1;

                case "||":
                    return 2;

                case "&&":
                    return 3;

                case "|":
                    return 4;

                case "^":
                    return 5;

                case "&":
                    return 6;

                case "==":
                case "!=":
                case "===":
                case "!==":
                    return 7;

                case "<":
                case ">":
                case "<=":
                case ">=":
                    return  8;

                case "<<":
                case ">>":
                case ">>>":
                    return 9;

                case "+":
                case "-":
                    return 10;

                case "*":
                case "/":
                case "%":
                    return 11;
            }
        }
        else if (token.type == TokenType.Keyword)
        {
            return (operator == "instanceof" || operator == "in") ? 7 : 0;
        }

        return 0;
    }

    private conditionalExpression(): IExpression
    {
        let expression =  this.inheritGrammar(this.binaryExpression);

        if (this.match("?"))
        {
            this.expect("?");

            const truthyExpression = this.isolateGrammar(this.assignmentExpression);

            this.expect(":");

            const falsyExpression = this.isolateGrammar(this.assignmentExpression);

            expression = new ConditionalExpression(expression, truthyExpression, falsyExpression);
        }

        return expression;
    }

    private pattern(root: boolean): IPattern
    {
        if (this.match("["))
        {
            return this.isolateGrammar(this.arrayPattern);
        }
        else if (this.match("{"))
        {
            return this.isolateGrammar(this.objectPattern);
        }
        else
        {
            const expression = this.isolateGrammar(this.assignmentExpression);

            if (!root && expression.type == NodeType.AssignmentExpression)
            {
                throw this.syntaxError(Messages.invalidDestructuringAssignmentTarget);
            }

            return this.reinterpretPattern(expression);
        }
    }

    private expect(value: string): void
    {
        const token = this.nextToken();

        /* istanbul ignore if */
        if (token.type !== TokenType.Punctuator || token.raw !== value)
        {
            throw this.unexpectedTokenError(token);
        }
    }

    private exponentiationExpression(): IExpression
    {
        const expression = this.inheritGrammar(this.unaryExpression);

        if (this.match("**"))
        {
            const operator = this.nextToken().raw;
            return new BinaryExpression(expression, this.isolateGrammar(this.assignmentExpression), operator as BinaryOperator);
        }

        return expression;
    }

    private expression(): IExpression
    {
        const expression = this.isolateGrammar(this.assignmentExpression);

        if (this.match(","))
        {
            const expressions = [expression];

            while (this.match(","))
            {
                this.expect(",");

                expressions.push(this.isolateGrammar(this.assignmentExpression));
            }

            if (this.lookahead.type != TokenType.EOF)
            {
                throw this.unexpectedTokenError(this.lookahead);
            }

            return new SequenceExpression(expressions);
        }

        if (this.lookahead.type != TokenType.EOF)
        {
            throw this.unexpectedTokenError(this.lookahead);
        }

        return expression;
    }

    // tslint:disable-next-line:no-any
    private inheritGrammar<TParser extends (...args: Array<any>) => any>(parser: TParser, ...args: Parameters<TParser>): ReturnType<TParser>
    {
        const invalidInitialization = this.invalidInitialization;

        this.invalidInitialization = null;

        const expression = parser.call(this, ...args);

        this.invalidInitialization = invalidInitialization || this.invalidInitialization;

        return expression;
    }

    // tslint:disable-next-line:no-any
    private isolateGrammar<TParser extends (...args: Array<any>) => any>(parser: TParser, ...args: Parameters<TParser>): ReturnType<TParser>
    {
        const invalidInitialization = this.invalidInitialization;

        this.invalidInitialization = null;

        const expression = parser.call(this, ...args);

        if (this.invalidInitialization)
        {
            throw this.unexpectedTokenError(this.invalidInitialization);
        }

        this.invalidInitialization = invalidInitialization || this.invalidInitialization;

        return expression;
    }

    private groupExpression(): IExpression
    {
        this.expect("(");

        if (this.match(")"))
        {
            this.expect(")");

            if (this.match("=>"))
            {
                this.expect("=>");

                const body = this.isolateGrammar(this.assignmentExpression);

                return new ArrowFunctionExpression([], body);
            }

            throw this.unexpectedTokenError(this.lookahead);
        }
        else
        {
            const expressions: Array<INode> = [];

            if (this.match("..."))
            {
                expressions.push((this.inheritGrammar(this.restElement)));

                if (!this.match(")"))
                {
                    throw this.syntaxError(Messages.restParameterMustBeLastFormalParameter);
                }

                this.expect(")");
            }
            else
            {
                expressions.push(this.inheritGrammar(this.assignmentExpression));

                if (this.match(","))
                {
                    while (true)
                    {
                        if (this.match(","))
                        {
                            this.expect(",");

                            if (this.match("..."))
                            {
                                expressions.push((this.inheritGrammar(this.restElement)));

                                if (!this.match(")"))
                                {
                                    throw this.syntaxError(Messages.restParameterMustBeLastFormalParameter);
                                }

                                break;
                            }
                            else
                            {
                                expressions.push(this.isolateGrammar(this.assignmentExpression));
                            }
                        }
                        else
                        {
                            break;
                        }
                    }
                }

                this.expect(")");
            }

            if (this.match("=>"))
            {
                this.invalidInitialization = null;

                const parameters = expressions.map(x => this.reinterpretPattern(x));

                this.expect("=>");

                const body = this.inheritGrammar(this.assignmentExpression);

                if (hasDuplicated(parameters))
                {
                    throw this.syntaxError(Messages.duplicateParameterNameNotAllowedInThisContext);
                }

                return new ArrowFunctionExpression(parameters, body);

            }
            else if (expressions.length > 1)
            {
                return new SequenceExpression(expressions as Array<IExpression>);
            }

            return expressions[0] as IExpression;
        }
    }

    private leftHandSideExpression(allowCall: boolean): IExpression
    {
        let expression = this.inheritGrammar(this.matchKeyword("new") ? this.newPrimaryExpression : this.primaryExpression);
        let parentExpression = expression;

        while (true)
        {
            if (this.match("."))
            {
                parentExpression = expression;
                this.expect(".");

                if (this.lookahead.type == TokenType.Identifier || this.lookahead.type == TokenType.Keyword)
                {
                    expression = new MemberExpression(parentExpression, new Identifier(this.nextToken().raw), false);
                }
                else
                {
                    throw this.unexpectedTokenError(this.lookahead);
                }
            }
            else
            {
                let optional = this.match("?.");

                if (optional)
                {
                    this.nextToken();
                }

                if (this.match("["))
                {
                    this.expect("[");

                    const propertyExpression = this.isolateGrammar(this.assignmentExpression);

                    this.expect("]");

                    expression = new MemberExpression(expression, propertyExpression, true, optional);
                }
                else if (this.match("("))
                {
                    if (!allowCall)
                    {
                        return expression;
                    }

                    const thisArg = parentExpression == expression ? new Literal(null) : parentExpression;

                    expression = new CallExpression(thisArg, expression, this.isolateGrammar(this.argumentsExpression), optional);
                }
                else if (optional)
                {
                    parentExpression = expression;

                    if (this.lookahead.type == TokenType.Identifier || this.lookahead.type == TokenType.Keyword)
                    {
                        expression = new MemberExpression(parentExpression, new Identifier(this.nextToken().raw), false, true);
                    }
                    else
                    {
                        throw this.unexpectedTokenError(this.lookahead);
                    }
                }
                else
                {
                    break;
                }
            }
        }

        return expression;
    }

    private objectPattern(): ObjectPattern
    {
        const entries: Array<AssignmentProperty|RestElement> = [];

        this.expect("{");

        while (!this.match("}"))
        {
            if (this.match("..."))
            {
                this.expect("...");

                const expression = this.inheritGrammar(this.leftHandSideExpression, false);

                if (!TypeGuard.isIdentifier(expression))
                {
                    throw this.syntaxError(Messages.restOperatorMustBeFollowedByAnIdentifierInDeclarationContexts);
                }

                entries.push(new RestElement(expression));

                if (!this.match("}"))
                {
                    throw this.syntaxError(Messages.restParameterMustBeLastFormalParameter);
                }
            }
            else
            {
                entries.push(this.reinterpretPattern(this.inheritGrammar(this.objectPropertyExpression)));
            }

            if (!this.match("}"))
            {
                this.expect(",");
            }
        }

        this.expect("}");

        return new ObjectPattern(entries);
    }

    private objectExpression(): ObjectExpression
    {
        this.expect("{");

        const properties: Array<Property|SpreadElement> = [];

        while (!this.match("}"))
        {
            if (this.match("..."))
            {
                properties.push(this.inheritGrammar(this.spreadExpression));
            }
            else
            {
                properties.push(this.inheritGrammar(this.objectPropertyExpression));
            }

            if (!this.match("}"))
            {
                this.expect(",");
            }
        }

        this.expect("}");

        return new ObjectExpression(properties);
    }

    private objectPropertyExpression(): Property
    {
        const token = this.lookahead;

        let key:   IExpression;
        let value: IExpression;

        let computed = false;

        if (token.type == TokenType.Identifier)
        {
            key = new Identifier(token.raw);

            this.nextToken();

            if (this.match("="))
            {
                const invalidInitialization = this.lookahead;

                this.expect("=");

                const value = this.isolateGrammar(this.assignmentExpression);

                this.invalidInitialization = invalidInitialization;

                return new Property(key, new AssignmentExpression(new Identifier(token.raw), value, "="), computed, true);
            }

            if (!this.match(":"))
            {
                return new Property(key, new Identifier(token.raw, true), false, true);
            }
        }
        else
        {
            const token = this.lookahead;

            switch (token.type)
            {
                case TokenType.BooleanLiteral:
                case TokenType.Keyword:
                case TokenType.NullLiteral:
                    key = new Identifier(this.nextToken().raw);
                    break;
                case TokenType.NumericLiteral:
                case TokenType.StringLiteral:
                    key = new Literal(this.nextToken().value as LiteralValue);
                    break;
                case TokenType.Punctuator:
                    if (token.raw == "[")
                    {
                        this.expect("[");

                        key = this.inheritGrammar(this.assignmentExpression);

                        this.expect("]");

                        computed = true;
                    }
                    else
                    {
                        throw this.unexpectedTokenError(token);
                    }
                    break;
                default:
                    throw this.unexpectedTokenError(token);
            }
        }

        this.expect(":");

        value = this.isolateGrammar(this.assignmentExpression);
        return new Property(key, value, computed, false);
    }

    private match(value: string): boolean
    {
        return this.lookahead.type === TokenType.Punctuator && this.lookahead.raw === value;
    }

    private matchKeyword(value: string): boolean
    {
        return this.lookahead.type === TokenType.Keyword && this.lookahead.raw === value;
    }

    private nextToken(): Token
    {
        const token = this.lookahead;
        this.lookahead = this.scanner.nextToken();
        return token;
    }

    private nextRegexToken(): Token
    {
        const token = this.scanner.scanRegex();

        this.nextToken();

        return token;
    }

    private newPrimaryExpression(): IExpression
    {
        this.nextToken();

        const callee = this.inheritGrammar(this.leftHandSideExpression, false);

        const args = this.match("(") ? this.isolateGrammar(this.argumentsExpression) : [];

        return new NewExpression(callee, args);
    }

    private parseExpression(): IExpression
    {
        switch (this.lookahead.type)
        {
            case TokenType.StringLiteral:
            case TokenType.NumericLiteral:
            case TokenType.BooleanLiteral:
            case TokenType.NullLiteral:
            case TokenType.RegularExpression:
            case TokenType.Template:
            case TokenType.Identifier:
                return this.expression();
            case TokenType.Punctuator:
                if
                (
                    this.lookahead.raw == "("
                    || this.lookahead.raw == "{"
                    || this.lookahead.raw == "["
                    || this.lookahead.raw == "/"
                    || this.lookahead.raw == "!"
                    || this.lookahead.raw == "+"
                    || this.lookahead.raw == "-"
                    || this.lookahead.raw == "^"
                    || this.lookahead.raw == "~"
                    || this.lookahead.raw == "++"
                    || this.lookahead.raw == "--"
                )
                {
                    return this.expression();
                }
                break;
            case TokenType.Keyword:
                if (this.lookahead.raw == "new" || this.lookahead.raw == "this" || this.lookahead.raw == "typeof")
                {
                    return this.expression();
                }
                break;
            default:
                break;
        }

        throw this.unexpectedTokenError(this.lookahead);
    }

    private primaryExpression(): IExpression
    {
        switch (this.lookahead.type)
        {
            case TokenType.Keyword:
                if (this.matchKeyword("this"))
                {
                    this.nextToken();
                    return new ThisExpression();
                }
                break;
            case TokenType.Identifier:
                if (this.lookahead.raw == "undefined")
                {
                    return new Identifier(this.nextToken().raw, true);
                }

                const indentifier = new Identifier(this.nextToken().raw, true);

                if (this.match("=>"))
                {
                    this.expect("=>");

                    return new ArrowFunctionExpression([indentifier], this.inheritGrammar(this.assignmentExpression));
                }
                else
                {
                    return indentifier;
                }

            case TokenType.BooleanLiteral:
                return new Literal(this.nextToken().value as LiteralValue);
            case TokenType.NumericLiteral:
            case TokenType.NullLiteral:
            case TokenType.StringLiteral:
                return new Literal(this.nextToken().value as LiteralValue);
            case TokenType.Punctuator:
                switch (this.lookahead.raw)
                {
                    case "(":
                        return this.inheritGrammar(this.groupExpression);
                    case "[":
                        return this.inheritGrammar(this.arrayExpression);
                    case "{":
                        return this.inheritGrammar(this.objectExpression);
                    case "/":
                        this.scanner.backtrack(1);
                        return this.inheritGrammar(this.regexExpression);
                    default:
                        throw this.unexpectedTokenError(this.lookahead);
                }

            case TokenType.Template:
                return this.inheritGrammar(this.templateLiteralExpression);
            /* istanbul ignore next */
            default:
                break;
        }

        throw this.unexpectedTokenError(this.lookahead);
    }

    private reinterpretPattern(expression: ArrayExpression):        ArrayPattern;
    private reinterpretPattern(expression: AssignmentExpression):   AssignmentPattern;
    private reinterpretPattern(expression: ObjectExpression):       ObjectPattern;
    private reinterpretPattern(expression: Property):               AssignmentProperty;
    private reinterpretPattern(expression: SpreadElement):          RestElement;
    private reinterpretPattern(expression: Property|SpreadElement): AssignmentProperty|RestElement;
    private reinterpretPattern(expression: INode):                  IPattern;
    // tslint:disable-next-line:cyclomatic-complexity
    private reinterpretPattern(node: INode):                        INode
    {
        switch (node.type)
        {
            // case NodeType.ArrayPattern: Never reached
            // case NodeType.AssignmentPattern: Never reached
            // case NodeType.AssignmentProperty: Never reached
            case NodeType.Identifier:
            case NodeType.Literal:
            case NodeType.ObjectPattern:
            case NodeType.RestElement:
                return node;
            case NodeType.AssignmentExpression:
            {
                const expression = node as AssignmentExpression;

                if (expression.operator != "=")
                {
                    throw this.syntaxError(Messages.invalidDestructuringAssignmentTarget);
                }

                if (TypeGuard.isIdentifier(expression.left))
                {
                    return new AssignmentPattern(expression.left, expression.right);
                }

                throw this.syntaxError(Messages.illegalPropertyInDeclarationContext);
            }
            case NodeType.Property:
            {
                const { key, value, computed, shorthand } = node as Property;

                if (shorthand && TypeGuard.isIdentifier(value))
                {
                    return new AssignmentProperty(new Identifier(value.name), new Identifier(value.name), computed, true);
                }
                else if (!shorthand && !TypeGuard.isIdentifier(value) && !TypeGuard.isArrayExpression(value) && !TypeGuard.isObjectExpression(value))
                {
                    break;
                }

                return new AssignmentProperty(key, TypeGuard.isObjectExpression(value) ? this.reinterpretPattern(value) : value as Identifier, computed, shorthand);
            }
            case NodeType.ArrayExpression:
            {
                const expression = node as ArrayExpression;

                let elements: Array<IPattern|null> = [];

                let index = 0;
                for (const element of expression.elements)
                {
                    if (element)
                    {
                        if (element.type == NodeType.SpreadElement && index < expression.elements.length - 1)
                        {
                            throw this.syntaxError(Messages.restParameterMustBeLastFormalParameter);
                        }

                        elements.push(this.reinterpretPattern(element));
                    }
                    else
                    {
                        elements.push(null);
                    }

                    index++;
                }

                return new ArrayPattern(elements);
            }
            case NodeType.ObjectExpression:
            {
                const expression = node as ObjectExpression;

                let entries: Array<AssignmentProperty|RestElement> = [];

                let index = 0;
                for (const property of expression.properties)
                {
                    if (property.type == NodeType.SpreadElement && index < expression.properties.length - 1)
                    {
                        throw this.syntaxError(Messages.restParameterMustBeLastFormalParameter);
                    }

                    entries.push(this.reinterpretPattern(property));

                    index++;
                }

                return new ObjectPattern(entries);
            }
            case NodeType.SpreadElement:
            {
                const expression = node as SpreadElement;

                if (expression.argument.type == NodeType.AssignmentExpression)
                {
                    throw this.syntaxError(Messages.invalidDestructuringAssignmentTarget);
                }

                return new RestElement(this.reinterpretPattern(expression.argument));
            }
            default:
                break;
        }

        throw this.unexpectedTokenError(this.lookahead);
    }

    private regexExpression(): IExpression
    {
        const token = this.nextRegexToken();
        return new Literal(token.value as RegExp);
    }

    private restElement(): RestElement
    {
        this.expect("...");

        const expression = this.isolateGrammar(this.pattern, true);

        if (expression.type == NodeType.AssignmentPattern)
        {
            throw this.syntaxError(Messages.restParameterMayNotHaveAdefaultInitializer);
        }

        return new RestElement(expression);
    }

    private spreadExpression(): SpreadElement
    {
        this.expect("...");

        return new SpreadElement(this.inheritGrammar(this.assignmentExpression));
    }

    private syntaxError(message: string): Error
    {
        return new SyntaxError(message, this.lookahead.lineNumber, this.lookahead.start, this.lookahead.start - this.lookahead.lineStart + 1);
    }

    private unaryExpression(): IExpression
    {
        if (this.match("+") || this.match("-") || this.match("~") || this.match("!") || this.matchKeyword("typeof"))
        {
            const token = this.nextToken();
            return new UnaryExpression(this.inheritGrammar(this.updateExpression), token.raw as UnaryOperator);
        }
        else
        {
            return this.inheritGrammar(this.updateExpression);
        }
    }

    private templateLiteralExpression(): IExpression
    {
        const quasis:      Array<TemplateElement> = [];
        const expressions: Array<IExpression>     = [];

        let token = this.nextToken();
        quasis.push(new TemplateElement(token.value as string, token.raw, !!token.tail));

        while (!!!token.tail)
        {
            expressions.push(this.inheritGrammar(this.assignmentExpression));

            token = this.nextToken();

            quasis.push(new TemplateElement(token.value as string, token.raw, !!token.tail));
        }

        return new TemplateLiteral(quasis, expressions);
    }

    private updateExpression(): IExpression
    {
        if (this.match("++") || this.match("--"))
        {
            const operator = this.nextToken().raw as UpdateOperator;
            return new UpdateExpression(this.inheritGrammar(this.leftHandSideExpression, true), operator, true);
        }
        else
        {
            const expression = this.inheritGrammar(this.leftHandSideExpression, true);

            if (this.match("++") || this.match("--"))
            {
                const operator = this.nextToken().raw as UpdateOperator;
                return new UpdateExpression(expression, operator, false);
            }

            return expression;
        }
    }

    private unexpectedTokenError(token: Token): Error
    {
        let message: string;

        switch (token.type)
        {
            case TokenType.StringLiteral:
                message = Messages.unexpectedString;
                break;
            case TokenType.NumericLiteral:
                message = Messages.unexpectedNumber;
                break;
            case TokenType.EOF:
                message = Messages.unexpectedEndOfExpression;
                break;
            case TokenType.Template:
                message = format(Messages.unexpectedToken, { token: "" });
                break;
            default:
                message = format(Messages.unexpectedToken, { token: token.raw });
                break;
        }

        return new SyntaxError(message, token.lineNumber, token.start, token.start - token.lineStart + 1);
    }
}