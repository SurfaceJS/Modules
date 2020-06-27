import TokenType       from "./enums/token-type";
import INode           from "./interfaces/node";
import IToken          from "./interfaces/token";
import AssignmentNode  from "./nodes/assignment-node";
import IdentifierNode  from "./nodes/identifier-node";
import LiteralNode     from "./nodes/literal-node";
import RestNode        from "./nodes/rest-node";
import SegmentNode     from "./nodes/segment-node";
import TransformerNode from "./nodes/transformer-node";
import WildcardNode    from "./nodes/wildcard-node";
import Scanner         from "./scanner";
import TypeGuard       from "./type-guard";

export default class Parser
{
    private readonly scanner: Scanner;
    private lookahead: IToken;

    public constructor(source: string)
    {
        this.scanner = new Scanner(source);

        this.lookahead = this.scanner.nextToken();
    }

    public static parse(source: string): Array<SegmentNode>
    {
        return new Parser(source).parse();
    }

    private expect(value: string): void
    {
        const token = this.nextToken();

        if (token.value != value)
        {
            this.throwUnexpectedToken(token);
        }
    }

    private hasOptional(nodes: Array<INode>): boolean
    {
        const singleNode = nodes.length == 1 ? nodes[0] : null;

        return !!singleNode &&
        (
            TypeGuard.isAssignment(singleNode)
            || TypeGuard.isRest(singleNode)
            || (TypeGuard.isIdentifier(singleNode) && singleNode.optional)
            || (TypeGuard.isTransformer(singleNode) && singleNode.optional)
        );
    }

    private nextToken(): IToken
    {
        const token = this.lookahead;

        this.lookahead = this.scanner.nextToken();

        return token;
    }

    private match(value: string): boolean
    {
        return this.lookahead.type === TokenType.Punctuator && this.lookahead.value === value;
    }

    private parse(): Array<SegmentNode>
    {
        const type = this.lookahead.type;

        if (type == TokenType.Eof)
        {
            throw new Error("Unexpected end of path");
        }

        const segments: Array<SegmentNode> = [];

        while (this.lookahead.type != TokenType.Eof)
        {
            segments.push(this.parseSegment());
        }

        return segments;
    }

    private parseIdentifierNode(): AssignmentNode | IdentifierNode | TransformerNode;
    private parseIdentifierNode(ignoreTranformer: true): AssignmentNode | IdentifierNode;
    private parseIdentifierNode(ignoreTranformer: boolean = false): INode
    {
        const token = this.nextToken();

        if (token.type == TokenType.Literal)
        {
            if (this.match("="))
            {
                this.expect("=");

                return new AssignmentNode(token.value, this.nextToken().value);
            }
            else if (!ignoreTranformer && this.match(":"))
            {
                this.expect(":");

                return new TransformerNode(token.value, this.parseIdentifierNode(true));
            }
            else if (this.match("?"))
            {
                this.expect("?");

                return new IdentifierNode(token.value, true);
            }
            else
            {
                return new IdentifierNode(token.value);
            }
        }
        else
        {
            this.throwUnexpectedToken(token);
        }
    }

    private parseSegment(): SegmentNode
    {
        this.expect("/");

        const nodes: Array<INode> = [];

        while (!this.match("/") && this.lookahead.type != TokenType.Eof)
        {
            switch (this.lookahead.type)
            {
                case TokenType.Literal:
                    nodes.push(new LiteralNode(this.lookahead.value));

                    this.nextToken();

                    break;
                case TokenType.Punctuator:
                    if (this.match("*"))
                    {
                        this.expect("*");

                        nodes.push(new WildcardNode());
                    }
                    else if (this.match("{"))
                    {
                        this.expect("{");

                        if (this.match("*"))
                        {
                            this.expect("*");

                            const token = this.nextToken();

                            if (token.type != TokenType.Literal)
                            {
                                this.throwUnexpectedToken(token);
                            }

                            nodes.push(new RestNode(token.value));
                        }
                        else
                        {
                            nodes.push(this.parseIdentifierNode());
                        }

                        this.expect("}");

                        if (this.match("{"))
                        {
                            this.throwUnexpectedToken(this.lookahead);
                        }
                    }
                    else
                    {
                        this.throwUnexpectedToken(this.lookahead);
                    }
                    break;
                case TokenType.Space:
                default:
                    throw new Error(`Unexpected space at ${this.lookahead.index}`);
            }
        }

        return new SegmentNode(nodes, this.hasOptional(nodes));
    }

    private throwUnexpectedToken(token: IToken): never
    {
        throw new Error(`Unexpected token ${token.value} at ${token.index}`);
    }
}