import "./fixtures/dom";

import Expression           from "@surface/expression";
import { batchTest, suite } from "@surface/test-suite";
import * as chai            from "chai";
import ObserverVisitor      from "../internal/observer-visitor";
import
{
    observableExpressions,
    unobservableExpressions,
    ObservableExpression,
    UnobservableExpression
} from "./expectations/observer-visitor-expected";

@suite
export class ObserverVisitorSpec
{
    @batchTest(observableExpressions, x => `observable expression ${x.expression}; should have ${x.observers} observers and ${x.observers * 2} notifications`)
    public observableExpressions(observableExpression: ObservableExpression): void
    {
        const expression = Expression.parse(observableExpression.expression);

        let observers = 0;

        const subscription = ObserverVisitor.observe(observableExpression.scope, expression, { notify: () => observers++ }, false);

        chai.expect(observers, "observers").to.equal(observableExpression.observers);

        observableExpression.change(observableExpression.scope);

        chai.expect(observers, "notifications").to.equal(observableExpression.observers * 2);

        observers = 0;

        subscription.unsubscribe();

        observableExpression.change(observableExpression.scope);

        chai.expect(observers == 0, "unsubscribe").to.equal(true);
    }

    @batchTest(unobservableExpressions, x => `unobservable expression ${x.expression}; shouldn't have observers`)
    public unobservableExpressions(unobservableExpression: UnobservableExpression): void
    {
        const expression = Expression.parse(unobservableExpression.expression);

        let observers = 0;

        ObserverVisitor.observe(unobservableExpression.scope, expression, { notify: () => observers++ }, false);

        chai.expect(observers == 0).to.equal(true);
    }
}