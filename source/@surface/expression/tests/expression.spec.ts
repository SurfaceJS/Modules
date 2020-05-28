import { batchTest, shouldFail, shouldPass, suite, test } from "@surface/test-suite";
import { assert }                                         from "chai";
import Expression                                         from "..";
import Messages                                           from "../internal/messages";
import NodeType                                           from "../internal/node-type";
import
{
    evaluationsExpected,
    expressionFactoriesExpected,
    EvaluationErrorExpected,
    ExpressionFactoryExpected
}
from "./expectations/expression-expected";

@suite
export default class ExpressionSpec
{
    @shouldPass
    @batchTest(expressionFactoriesExpected, x => `method Expression.${x.method} should return ${NodeType[x.type]} Expression`)
    public expressionFactory(expressionFactoryExpected: ExpressionFactoryExpected)
    {
        const expression = expressionFactoryExpected.factory();

        assert.equal(expression.type, expressionFactoryExpected.type);
        assert.equal(expression.toString(), expressionFactoryExpected.toString);

        const clone = expression.clone();

        if (expression.hasOwnProperty("toString"))
        {
            clone.clone    = expression.clone;
            clone.toString = expression.toString;
        }

        assert.deepEqual(expression, clone);
    }

    @test @shouldPass
    public parse()
    {
        const expression = Expression.parse("this");

        assert.equal(expression.type, NodeType.ThisExpression);
    }

    @test @shouldPass
    public regExpLiteral()
    {
        const expression = Expression.regex("foo", "gi");

        assert.equal(expression.pattern, "foo", "pattern");
        assert.equal(expression.flags, "gi", "flags");
        assert.equal(expression.value, null, "value");
        assert.deepEqual(expression.evaluate(), /foo/gi, "evaluate");
        assert.deepEqual(expression.evaluate(void 0, true), /foo/gi, "evaluate with cache");
        assert.deepEqual(expression.toString(), "/foo/gi", "toString");
    }

    @shouldFail
    @batchTest(evaluationsExpected, x => `evaluate: ${x.raw}; should throw ${x.error.message}`)
    public evaluationsShouldThrow(evaluationErrorExpected: EvaluationErrorExpected): void
    {
        try
        {
            Expression.parse(evaluationErrorExpected.raw).evaluate(evaluationErrorExpected.scope);

            throw new Error(`Evaluate: ${evaluationErrorExpected.raw}; not throw`);
        }
        catch (error)
        {
            assert.equal(error.message, evaluationErrorExpected.error.message);
        }
    }

    @test @shouldFail
    public arrowFunctionWithDuplicatedParameters()
    {
        const parameters = [Expression.identifier("a"), Expression.identifier("a") ];
        const body       = Expression.identifier("x");

        assert.throws(() => Expression.arrowFunction(parameters, body), Messages.duplicateParameterNameNotAllowedInThisContext);
    }

    @test @shouldFail
    public arrowFunctionWithInvalidAssignmentPattern(): void
    {
        const parameters    = [Expression.assignmentPattern(Expression.arrayPattern([]), Expression.literal(1))];
        const body          = Expression.identifier("x");
        const arrowFunction = Expression.arrowFunction(parameters, body);

        assert.throws(arrowFunction.evaluate({ }) as () => void, Messages.illegalPropertyInDeclarationContext);
    }
}