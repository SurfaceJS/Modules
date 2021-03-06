// eslint-disable-next-line import/no-unassigned-import
import "./fixtures/dom.js";

import { shouldPass, suite, test } from "@surface/test-suite";
import chai                        from "chai";
import MockElement                 from "./fixtures/mock-element.js";

@suite
export default class CustomElementSpec
{
    @test @shouldPass
    public construct(): void
    {
        const instance = new MockElement();

        chai.assert.isOk(instance);
    }
}