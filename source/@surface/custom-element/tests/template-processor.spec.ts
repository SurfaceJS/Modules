import "./fixtures/dom";

import { shouldPass, suite, test } from "@surface/test-suite";
import chai                        from "chai";
import TemplateProcessor           from "../internal/template-processor";

@suite
export default class TemplateProcessorSpec
{
    @test @shouldPass
    public elementWithoutAttributes(): void
    {
        const document = window.document;
        const host     = document.createElement("div");
        const element  = document.createElement("span");

        TemplateProcessor.process(host, element);
    }

    @test @shouldPass
    public elementWithAttributes(): void
    {
        const document = window.document;
        const host     = document.createElement("div");
        const element  = document.createElement("div");

        element.innerHTML = "<span value='1'>Text</span>";

        TemplateProcessor.process(host, element);

        if (element.firstElementChild)
        {
            chai.expect(element.firstElementChild.getAttribute("value")).to.equal("1");
        }
    }

    @test @shouldPass
    public elementWithAttributeExpression(): void
    {
        const document = window.document;
        const host     = document.createElement("div");
        const element  = document.createElement("div");

        host.lang = "pt-br";
        element.innerHTML = "<input type='text' lang='{host.lang}' parent='{host.tagName}'>Text</input>";

        TemplateProcessor.process(host, element);

        if (element.firstElementChild)
        {
            const input = element.firstElementChild as HTMLSpanElement;
            chai.expect(input.lang).to.equal("pt-br");
            chai.expect(input.getAttribute("lang")).to.equal("pt-br");
            chai.expect(input.getAttribute("parent")).to.equal("DIV");

            host.lang = "en-us";
            chai.expect(input.lang).to.equal("en-us");
            chai.expect(input.getAttribute("lang")).to.equal("en-us");
        }
    }

    // @test @shouldPass
    // public elementWithAttributeInterpolation(): void
    // {
    //     const document = window.document;
    //     const host     = document.createElement("div");
    //     const element  = document.createElement("div");

    //     host.lang = "pt-br";
    //     element.innerHTML = "<span data-text='Tag name: {host.tagName}'>Text</span>";

    //     TemplateProcessor.process(host, element);
    //     chai.expect(element.firstElementChild!.getAttribute("data-text")).to.equal("Tag name: DIV");
    // }

    // @test @shouldPass
    // public elementWithAttributesBindToNonBindableField(): void
    // {
    //     const document = window.document;
    //     const host     = document.createElement("div");
    //     const element  = document.createElement("div");

    //     element.innerHTML = "<span foo='{host.tagName}'</span>";

    //     const span = element.firstElementChild as HTMLSpanElement & { foo?: string };

    //     span.foo = "";

    //     TemplateProcessor.process(host, element);

    //     chai.expect(span.foo).to.equal("DIV");
    // }

    // @test @shouldPass
    // public elementWithAttributesBindToWindowFallback(): void
    // {
    //     const document = window.document;
    //     const host     = document.createElement("div");
    //     const element  = document.createElement("div");

    //     element.innerHTML = "<span lang='{Node.name}'</span>";

    //     TemplateProcessor.process(host, element);

    //     if (element.firstElementChild)
    //     {
    //         const span = element.firstElementChild as HTMLSpanElement;
    //         chai.expect(span.lang).to.equal("Node");
    //     }
    // }

    // @test @shouldPass
    // public elementWithAttributesBindExpression(): void
    // {
    //     const document = window.document;
    //     const host     = document.createElement("div");
    //     const element  = document.createElement("div");

    //     element.innerHTML = "<span has-childs='[[ this.childNodes.length > 0 ]]'></span>";

    //     TemplateProcessor.process(host, element);

    //     if (element.firstElementChild)
    //     {
    //         chai.expect(element.firstElementChild.getAttribute("has-childs")).to.equal("false");
    //     }
    // }

    // @test @shouldPass
    // public elementWithPropertyAttributeBindExpression(): void
    // {
    //     const document = window.document;
    //     const host     = document.createElement("div");
    //     const element  = document.createElement("div");

    //     element.innerHTML = "<span id='{this.childNodes.length > 0}'></span>";

    //     TemplateProcessor.process(host, element);

    //     if (element.firstElementChild)
    //     {
    //         const span = element.firstElementChild;

    //         chai.expect(span.getAttribute("id")).to.equal("false");
    //         chai.expect(span.id).to.equal("false");
    //     }
    // }

    // @test @shouldPass
    // public elementWithAttributesWithEventBind(): void
    // {
    //     const document = window.document;
    //     const host     = document.createElement("div");
    //     const element  = document.createElement("div");

    //     host.click = () => chai.expect(true).to.equal(true);

    //     element.innerHTML = "<span on-click='{host.click}'>Text</span>";

    //     TemplateProcessor.process(host, element);

    //     if (element.firstElementChild)
    //     {
    //         element.firstElementChild.dispatchEvent(new Event("click"));
    //     }
    // }

    // @test @shouldPass
    // public elementWithAttributesWithExpressionEventBind(): void
    // {
    //     const document = window.document;
    //     const host     = document.createElement("div") as HTMLDivElement & { method?: Function };
    //     const element  = document.createElement("div");

    //     host.method = (value: boolean) => chai.expect(value).to.equal(true);

    //     element.innerHTML = "<span on-click='{host.method(true)}'>Text</span>";

    //     TemplateProcessor.process(host, element);

    //     if (element.firstElementChild)
    //     {
    //         element.firstElementChild.dispatchEvent(new Event("click"));
    //     }
    // }

    // @test @shouldPass
    // public elementWithTextNodeBind(): void
    // {
    //     const document = window.document;
    //     const host     = document.createElement("div");
    //     const element  = document.createElement("div");

    //     host.id = "01";
    //     element.innerHTML = "<span>Host id: {host.id}</span>";

    //     TemplateProcessor.process(host, element);

    //     if (element.firstElementChild)
    //     {
    //         chai.expect(element.firstElementChild.innerHTML).to.equal("Host id: 01");
    //         host.id = "02";
    //         host.dispatchEvent(new Event("change"));
    //         chai.expect(element.firstElementChild.innerHTML).to.equal("Host id: 02");
    //     }
    // }

    // @test @shouldPass
    // public elementWithTextNodeBindExpression(): void
    // {
    //     const document = window.document;
    //     const host     = document.createElement("div");
    //     const element  = document.createElement("div");

    //     host.id = "01";
    //     element.innerHTML = "<span>{host.id == '01'}</span>";

    //     TemplateProcessor.process(host, element);

    //     if (element.firstElementChild)
    //     {
    //         chai.expect(element.firstElementChild.innerHTML).to.equal("true");
    //         host.id = "02";
    //         host.dispatchEvent(new Event("change"));
    //         chai.expect(element.firstElementChild.innerHTML).to.equal("false");
    //     }
    // }

    // @test @shouldPass
    // public templateInjectDirective(): void
    // {
    //     const root = document.createElement("div");
    //     const host = document.createElement("div");

    //     host.innerHTML = "<template #inject:items>World</template>";

    //     const element = document.createElement("div");

    //     root.appendChild(host);
    //     host.appendChild(element);

    //     element.innerHTML = "<span>Hello </span><template #injector:items></template><span>!!!</span>";

    //     TemplateProcessor.process(host, element);
    //     TemplateProcessor.process(root, host);

    //     chai.expect(root.querySelector("div")?.textContent).to.equal("Hello World!!!");
    // }

    // @test @shouldPass
    // public templateInjectorDirectiveWithDefault(): void
    // {
    //     const root = document.createElement("div");
    //     const host = document.createElement("div");

    //     const element = document.createElement("div");

    //     root.appendChild(host);
    //     host.appendChild(element);

    //     element.innerHTML = "<span>Hello </span><template #injector:items>Default</template><span>!!!</span>";

    //     TemplateProcessor.process(host, element);
    //     TemplateProcessor.process(root, host);

    //     chai.expect(root.querySelector("div")?.textContent).to.equal("Hello Default!!!");
    // }

    // @test @shouldPass
    // public templateConditionalDirective(): void
    // {
    //     const host = document.createElement("div") as HTMLDivElement & { order?: number };

    //     host.order = 1;

    //     const element = document.createElement("div");

    //     host.appendChild(element);

    //     element.innerHTML = `<template #if="host.order == 1">First</template><template #else-if="host.order == 2">Second</template><template #else>Last</template>`;

    //     TemplateProcessor.process(host, element);

    //     chai.expect(element.childNodes[1].textContent).to.equal("First");

    //     host.order = 2;

    //     chai.expect(element.childNodes[1].textContent).to.equal("Second");

    //     host.order = 3;

    //     chai.expect(element.childNodes[1].textContent).to.equal("Last");
    // }

    // @test @shouldPass
    // public templateLoopDirective(): void
    // {
    //     const host = document.createElement("div") as HTMLDivElement & { elements?: Array<number> };

    //     host.elements = [1];

    //     const element = document.createElement("div");

    //     host.appendChild(element);

    //     element.innerHTML = `<template #for="const index of host.elements"><span>Element: {index}</span></template>`;

    //     TemplateProcessor.process(host, element);

    //     chai.expect(element.childElementCount).to.equal(1);
    //     chai.expect(element.childNodes[1].textContent).to.equal("Element: 1");

    //     host.elements = [1, 2];

    //     chai.expect(element.childElementCount).to.equal(2);
    //     chai.expect(element.childNodes[1].textContent).to.equal("Element: 1");
    //     chai.expect(element.childNodes[2].textContent).to.equal("Element: 2");

    //     host.elements = [1, 2, 3];

    //     chai.expect(element.childElementCount).to.equal(3);
    //     chai.expect(element.childNodes[1].textContent).to.equal("Element: 1");
    //     chai.expect(element.childNodes[2].textContent).to.equal("Element: 2");
    //     chai.expect(element.childNodes[3].textContent).to.equal("Element: 3");

    //     host.elements = [2];

    //     chai.expect(element.childElementCount).to.equal(1);
    //     chai.expect(element.childNodes[1].textContent).to.equal("Element: 2");
    // }

    // @test @shouldPass
    // public templateLoopDirectiveWithArrayDestructuring(): void
    // {
    //     const host = document.createElement("div") as HTMLDivElement & { elements?: Array<[number, number]> };

    //     host.elements = [[1, 2]];

    //     const element = document.createElement("div");

    //     host.appendChild(element);

    //     element.innerHTML = `<template #for="const [index0, index1] of host.elements"><span>Element[0]: {index0}, Element[1]: {index1}</span></template>`;

    //     TemplateProcessor.process(host, element);

    //     chai.expect(element.childElementCount).to.equal(1);
    //     chai.expect(element.childNodes[1].textContent).to.equal("Element[0]: 1, Element[1]: 2");

    //     host.elements = [[1, 2], [2, 4]];

    //     chai.expect(element.childElementCount).to.equal(2);
    //     chai.expect(element.childNodes[1].textContent).to.equal("Element[0]: 1, Element[1]: 2");
    //     chai.expect(element.childNodes[2].textContent).to.equal("Element[0]: 2, Element[1]: 4");

    //     host.elements = [[1, 2], [2, 4], [3, 6]];

    //     chai.expect(element.childElementCount).to.equal(3);
    //     chai.expect(element.childNodes[1].textContent).to.equal("Element[0]: 1, Element[1]: 2");
    //     chai.expect(element.childNodes[2].textContent).to.equal("Element[0]: 2, Element[1]: 4");
    //     chai.expect(element.childNodes[3].textContent).to.equal("Element[0]: 3, Element[1]: 6");

    //     host.elements = [[2, 4]];

    //     chai.expect(element.childElementCount).to.equal(1);
    //     chai.expect(element.childNodes[1].textContent).to.equal("Element[0]: 2, Element[1]: 4");
    // }

    // @test @shouldPass
    // public templateLoopDirectiveWithArrayDestructuringDeepNested(): void
    // {
    //     const host = document.createElement("div") as HTMLDivElement & { elements?: Array<[number, { item: { name: string } }]> };

    //     host.elements = [[1, { item: { name: "one" } }]];

    //     const element = document.createElement("div");

    //     host.appendChild(element);

    //     element.innerHTML = `<template #for="const [index, { item: { name } }] of host.elements"><span>Element: {index}, Name: {name}</span></template>`;

    //     TemplateProcessor.process(host, element);

    //     chai.expect(element.childElementCount).to.equal(1);
    //     chai.expect(element.childNodes[1].textContent).to.equal("Element: 1, Name: one");

    //     host.elements =
    //     [
    //         [1, { item: { name: "one" } }],
    //         [2, { item: { name: "two" } }]
    //     ];

    //     chai.expect(element.childElementCount).to.equal(2);
    //     chai.expect(element.childNodes[1].textContent).to.equal("Element: 1, Name: one");
    //     chai.expect(element.childNodes[2].textContent).to.equal("Element: 2, Name: two");

    //     host.elements =
    //     [
    //         [1, { item: { name: "one" } }],
    //         [2, { item: { name: "two" } }],
    //         [3, { item: { name: "three" } }]
    //     ];

    //     chai.expect(element.childElementCount).to.equal(3);
    //     chai.expect(element.childNodes[1].textContent).to.equal("Element: 1, Name: one");
    //     chai.expect(element.childNodes[2].textContent).to.equal("Element: 2, Name: two");
    //     chai.expect(element.childNodes[3].textContent).to.equal("Element: 3, Name: three");

    //     host.elements = [[2, { item: { name: "two" } }]];

    //     chai.expect(element.childElementCount).to.equal(1);
    //     chai.expect(element.childNodes[1].textContent).to.equal("Element: 2, Name: two");
    // }

    // @test @shouldPass
    // public templateLoopDirectiveWithObjectDestructuring(): void
    // {
    //     const host = document.createElement("div") as HTMLDivElement & { elements?: Array<{ values: [number, number]}> };

    //     host.elements = [{ values: [1, 2] }];

    //     const element = document.createElement("div");

    //     host.appendChild(element);

    //     element.innerHTML = `<template #for="const { values: [value1, value2] } of host.elements"><span>Element[0]: {value1}, Element[1]: {value2}</span></template>`;

    //     TemplateProcessor.process(host, element);

    //     chai.expect(element.childElementCount).to.equal(1);
    //     chai.expect(element.childNodes[1].textContent).to.equal("Element[0]: 1, Element[1]: 2");

    //     host.elements =
    //     [
    //         { values: [1, 2] },
    //         { values: [2, 4] },
    //     ];

    //     chai.expect(element.childElementCount).to.equal(2);
    //     chai.expect(element.childNodes[1].textContent).to.equal("Element[0]: 1, Element[1]: 2");
    //     chai.expect(element.childNodes[2].textContent).to.equal("Element[0]: 2, Element[1]: 4");

    //     host.elements =
    //     [
    //         { values: [1, 2] },
    //         { values: [2, 4] },
    //         { values: [3, 6] },
    //     ];

    //     chai.expect(element.childElementCount).to.equal(3);
    //     chai.expect(element.childNodes[1].textContent).to.equal("Element[0]: 1, Element[1]: 2");
    //     chai.expect(element.childNodes[2].textContent).to.equal("Element[0]: 2, Element[1]: 4");
    //     chai.expect(element.childNodes[3].textContent).to.equal("Element[0]: 3, Element[1]: 6");

    //     host.elements = [{ values: [2, 4] }];

    //     chai.expect(element.childElementCount).to.equal(1);
    //     chai.expect(element.childNodes[1].textContent).to.equal("Element[0]: 2, Element[1]: 4");
    // }

    // @test @shouldPass
    // public templateLoopDirectiveWithObjectDestructuringDeepNested(): void
    // {
    //     const host = document.createElement("div") as HTMLDivElement & { elements?: Array<{ values: [number, [[number]]]}> };

    //     host.elements = [{ values: [1, [[2]]] }];

    //     const element = document.createElement("div");

    //     host.appendChild(element);

    //     element.innerHTML = `<template #for="const { values: [value1, [[value2]]] } of host.elements"><span>Element[0]: {value1}, Element[1]: {value2}</span></template>`;

    //     TemplateProcessor.process(host, element);

    //     chai.expect(element.childElementCount).to.equal(1);
    //     chai.expect(element.childNodes[1].textContent).to.equal("Element[0]: 1, Element[1]: 2");

    //     host.elements =
    //     [
    //         { values: [1, [[2]]] },
    //         { values: [2, [[4]]] }
    //     ];

    //     chai.expect(element.childElementCount).to.equal(2);
    //     chai.expect(element.childNodes[1].textContent).to.equal("Element[0]: 1, Element[1]: 2");
    //     chai.expect(element.childNodes[2].textContent).to.equal("Element[0]: 2, Element[1]: 4");

    //     host.elements =
    //     [
    //         { values: [1, [[2]]] },
    //         { values: [2, [[4]]] },
    //         { values: [3, [[6]]] },
    //     ];

    //     chai.expect(element.childElementCount).to.equal(3);
    //     chai.expect(element.childNodes[1].textContent).to.equal("Element[0]: 1, Element[1]: 2");
    //     chai.expect(element.childNodes[2].textContent).to.equal("Element[0]: 2, Element[1]: 4");
    //     chai.expect(element.childNodes[3].textContent).to.equal("Element[0]: 3, Element[1]: 6");

    //     host.elements = [{ values: [2, [[4]]] },];

    //     chai.expect(element.childElementCount).to.equal(1);
    //     chai.expect(element.childNodes[1].textContent).to.equal("Element[0]: 2, Element[1]: 4");
    // }

    // @test @shouldPass
    // public templateCompositeConditionalAndLoopDirectives(): void
    // {
    //     const host = document.createElement("div") as HTMLDivElement & { condition?: boolean, items?: Array<[string, number]> };

    //     host.condition = false;
    //     host.items     =
    //     [
    //         ["One",   1],
    //         ["Two",   2],
    //         ["Three", 3],
    //     ];

    //     const element = document.createElement("div");
    //     host.appendChild(element);

    //     element.innerHTML =
    //     `
    //         <template #if="host.condition" #for="const [key, value] of host.items">
    //             <span>{{key}}: {{value}}</span>
    //         </template>
    //         <template #else>
    //             <span>Empty</span>
    //         </template>
    //     `;

    //     TemplateProcessor.process(host, element);

    //     chai.expect(host.querySelector("span")?.textContent).to.equal("Empty");

    //     host.condition = true;

    //     chai.expect(host.querySelector("span:nth-child(1)")?.textContent).to.equal("One: 1");
    //     chai.expect(host.querySelector("span:nth-child(2)")?.textContent).to.equal("Two: 2");
    //     chai.expect(host.querySelector("span:nth-child(3)")?.textContent).to.equal("Three: 3");
    // }

    // @test @shouldPass
    // public templateCompositeLoopAndConditionalDirectives(): void
    // {
    //     const host = document.createElement("div") as HTMLDivElement & { condition?: boolean, items?: Array<[string, number]> };

    //     host.condition = false;
    //     host.items     =
    //     [
    //         ["One",   1],
    //         ["Two",   2],
    //         ["Three", 3],
    //     ];

    //     const element = document.createElement("div");
    //     host.appendChild(element);

    //     element.innerHTML =
    //     `
    //         <template #for="const [key, value] of host.items" #if="host.condition">
    //             <span>{{key}}: {{value}}</span>
    //         </template>
    //         <template #else>
    //             <span>Empty</span>
    //         </template>
    //     `;

    //     TemplateProcessor.process(host, element);

    //     chai.expect(host.querySelector("span")?.textContent).to.equal("Empty");

    //     host.condition = true;

    //     chai.expect(host.querySelector("span:nth-child(1)")?.textContent).to.equal("One: 1");
    //     chai.expect(host.querySelector("span:nth-child(2)")?.textContent).to.equal("Two: 2");
    //     chai.expect(host.querySelector("span:nth-child(3)")?.textContent).to.equal("Three: 3");
    // }

    // @test @shouldPass
    // public templateCompositeConditionalAndInjectDirectives(): void
    // {
    //     const host    = document.createElement("div") as HTMLDivElement & { [PROCESSED]?: boolean, item?: [string, number] };
    //     const content = document.createElement("div");

    //     host.innerHTML =
    //     `
    //         <template #inject:items="{ item }" #if="item[1] % 2 == 1">
    //             <span>{{item[0]}}: {{item[1]}}</span>
    //         </template>
    //     `;

    //     content.innerHTML =
    //     `
    //         <template #injector:items="{ item: host.item }">
    //             <span>Default</span>
    //         </template>
    //     `;

    //     content.normalize();

    //     host.appendChild(content);

    //     host.normalize();

    //     host[PROCESSED] = true;

    //     host.item = ["Value", 1];

    //     TemplateProcessor.process(host, content);

    //     chai.expect(host.querySelector("span:nth-child(1)")?.textContent).to.equal("Value: 1");

    //     host.item[1] = 2;

    //     chai.expect(host.querySelector("span:nth-child(1)")?.textContent).to.equal(undefined);

    //     host.item[1] = 3;

    //     chai.expect(host.querySelector("span:nth-child(1)")?.textContent).to.equal("Value: 3");
    // }

    // @test @shouldPass
    // public templateCompositeConditionalAndInjectorDirectives(): void
    // {
    //     const host    = document.createElement("div") as HTMLDivElement & { [PROCESSED]?: boolean, condition?: boolean, item?: [string, number] };
    //     const content = document.createElement("div");

    //     host.innerHTML    =
    //     `
    //         <template #inject:items="{ item: [key, value] }">
    //             <span>{{key}}: {{value}}</span>
    //         </template>
    //     `;

    //     content.innerHTML =
    //     `
    //         <template #injector:items="{ item: host.item }" #if="host.condition">
    //             <span>Default</span>
    //         </template>
    //     `;

    //     host.appendChild(content);

    //     host.condition = false;
    //     host.item      = ["One", 1];

    //     TemplateProcessor.process(host, content);

    //     chai.expect(host.querySelector("span")).to.equal(null);

    //     host[PROCESSED] = true;

    //     host.condition = true;

    //     chai.expect(host.querySelector("span:nth-child(1)")?.textContent).to.equal("One: 1");
    // }

    // @test @shouldPass
    // public templateCompositeLoopAndInjectorDirectives(): void
    // {
    //     const host    = document.createElement("div") as HTMLDivElement & { [PROCESSED]?: boolean, condition?: boolean, items?: Array<[string, number]> };
    //     const content = document.createElement("div");

    //     host.innerHTML    =
    //     `
    //         <template #inject:items="{ item: [key, value] }">
    //             <span>{{key}}: {{value}}</span>
    //         </template>
    //     `;

    //     content.innerHTML =
    //     `
    //         <template #for="const item of host.items" #injector:items="{ item }">
    //             <span>Default</span>
    //         </template>
    //     `;

    //     host.appendChild(content);

    //     host.condition = false;
    //     host.items     = [];

    //     TemplateProcessor.process(host, content);

    //     chai.expect(host.querySelector("span")).to.equal(null);

    //     host[PROCESSED] = true;

    //     host.items =
    //     [
    //         ["One",   1],
    //         ["Two",   2],
    //         ["Three", 3]
    //     ];

    //     chai.expect(host.querySelector("span:nth-child(1)")?.textContent).to.equal("One: 1");
    //     chai.expect(host.querySelector("span:nth-child(2)")?.textContent).to.equal("Two: 2");
    //     chai.expect(host.querySelector("span:nth-child(3)")?.textContent).to.equal("Three: 3");
    // }

    // @test @shouldFail
    // public elementWithInvalidBindExpression(): void
    // {
    //     const document = window.document;
    //     const host     = document.createElement("div");
    //     const element  = document.createElement("div");

    //     element.innerHTML = "<span>Host tag name: {host.?}</span>";

    //     try
    //     {
    //         TemplateProcessor.process(host, element);
    //     }
    //     catch (error)
    //     {
    //         chai.expect(error).to.includes(new Error("Unexpected token ? - posistion 6"));
    //     }
    // }
}