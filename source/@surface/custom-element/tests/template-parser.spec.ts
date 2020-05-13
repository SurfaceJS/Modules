import "./fixtures/dom";

import { Action }                                                        from "@surface/core";
import IIdentifier                                                       from "@surface/expression/interfaces/identifier";
import { shouldFail, shouldPass, suite, test }                           from "@surface/test-suite";
import { assert }                                                        from "chai";
import ITemplateDescriptor                                               from "../internal/interfaces/template-descriptor";
import { parseDestructuredPattern, parseExpression, parseInterpolation } from "../internal/parsers";
import TemplateParseError                                                from "../internal/template-parse-error";
import TemplateParser                                                    from "../internal/template-parser";

TemplateParser.testEnviroment = true;

type RawError = { message: string }|Pick<TemplateParseError, "message"|"stack">;

function tryAction(action: Action): RawError
{
    try
    {
        action();
    }
    catch (error)
    {
        return toRaw(error);
    }

    return toRaw(new TemplateParseError("", ""));
}

function toRaw(error: Error): RawError
{
    if (error instanceof TemplateParseError)
    {
        return {
            message: error.message,
            stack:   error.stack,
        };
    }
    else
    {
        return { message: error.message };
    }
}

@suite
export default class TemplateParserSpec
{
    @shouldPass @test
    public analyze(): void
    {
        const template = document.createElement("template");

        template.innerHTML =
        [
            "<span value='Hello {host.name}' #on:click='host.handler' ::value-a='host.value' :value-b='host.x + host.y'>",
            "Some {'interpolation'} here",
            "</span>",
            "<span #inject>",
            "Empty",
            "</span>",
            "<span #inject:title='{ title }'>",
            "<h1>{title}</h1>",
            "</span>",
            "<span #inject='{ title }' #inject-key='dynamicInjectKey'>",
            "<h1>{title}</h1>",
            "</span>",
            "<hr>",
            "<span #if='host.status == 1'>",
            "Active",
            "</span>",
            "<span #else-if='host.status == 2'>",
            "Waiting",
            "</span>",
            "<span #else>",
            "Suspended",
            "</span>",
            "<span #injector>",
            "Default Empty",
            "</span>",
            "<span #injector:value='({ name: host.name })'>",
            "Default {name}",
            "</span>",
            "<span #injector='({ name: host.name })' #injector-key='dynamicInjectorKey'>",
            "Default {name}",
            "</span>",
            "<table>",
            "<tr #on='host.handler' #on-key='dynamicOnKey' >",
            "<th>Id</th>",
            "<th>Name</th>",
            "<th>Status</th>",
            "</tr>",
            "<tr onclick='fn({ clicked })' #for='const item of host.items'>",
            "<td>{item.id}</td>",
            "<td>{item.name}</td>",
            "<td>{item.status}</td>",
            "</tr>",
            "</table>",
            "<hr>",
            "<span>{host.footer}</span>",
            "<!---->",
        ].join("");

        const expected: ITemplateDescriptor =
        {
            elements:
            [
                {
                    attributes:
                    [
                        {
                            expression:  parseInterpolation("Hello {host.name}"),
                            key:         "value",
                            name:        "value",
                            observables: [["host", "name"]],
                            type:        "interpolation",
                            stackTrace:
                            [
                                ["<x-component>"],
                                ["#shadow-root"],
                                ["<span value=\"Hello {host.name}\" #on:click=\"host.handler\" ::value-a=\"host.value\" :value-b=\"host.x + host.y\">"]
                            ]
                        },
                        {
                            name:        "value-a",
                            key:         "valueA",
                            expression:  parseExpression("host.value"),
                            observables: [],
                            type:        "twoway",
                            stackTrace:
                            [
                                ["<x-component>"],
                                ["#shadow-root"],
                                ["<span value=\"Hello {host.name}\" #on:click=\"host.handler\" ::value-a=\"host.value\" :value-b=\"host.x + host.y\">"]
                            ]
                        },
                        {
                            name:        "value-b",
                            key:         "valueB",
                            expression:  parseExpression("host.x + host.y"),
                            observables: [["host", "x"], ["host", "y"]],
                            type:        "oneway",
                            stackTrace:
                            [
                                ["<x-component>"],
                                ["#shadow-root"],
                                ["<span value=\"Hello {host.name}\" #on:click=\"host.handler\" ::value-a=\"host.value\" :value-b=\"host.x + host.y\">"]
                            ]
                        },
                    ],
                    directives:
                    [
                        {
                            key:              parseExpression("'click'"),
                            keyObservables:   [],
                            name:             "on",
                            value:            parseExpression("host.handler"),
                            valueObservables: [["host", "handler"]],
                            stackTrace:
                            [
                                ["<x-component>"],
                                ["#shadow-root"],
                                ["<span value=\"Hello {host.name}\" #on:click=\"host.handler\" ::value-a=\"host.value\" :value-b=\"host.x + host.y\">"]
                            ]
                        }
                    ],
                    textNodes:
                    [
                        {
                            path:        "0-0",
                            expression:  parseInterpolation("Some {'interpolation'} here"),
                            observables: [],
                            stackTrace:
                            [
                                ["<x-component>"],
                                ["#shadow-root"],
                                ["<span value=\"Hello {host.name}\" #on:click=\"host.handler\" ::value-a=\"host.value\" :value-b=\"host.x + host.y\">"],
                                ["Some {'interpolation'} here"],
                            ]
                        }
                    ],
                    path: "0",
                },
                {
                    attributes: [],
                    directives:
                    [
                        {
                            key:              parseExpression("dynamicOnKey"),
                            keyObservables:   [],
                            name:             "on",
                            value:            parseExpression("host.handler"),
                            valueObservables: [["host", "handler"]],
                            stackTrace:
                            [
                                ["<x-component>"],
                                ["#shadow-root"],
                                ["...11 other(s) node(s)", "<table>"],
                                ["<tbody>"],
                                ["<tr #on=\"host.handler\" #on-key=\"dynamicOnKey\">"]
                            ]
                        }
                    ],
                    path:       "11-0-0",
                    textNodes:  [],
                },
                {
                    attributes: [],
                    directives: [],
                    path:       "13",
                    textNodes:
                    [
                        {
                            path:        "13-0",
                            expression:  parseInterpolation("{host.footer}"),
                            observables: [["host", "footer"]],
                            stackTrace:
                            [
                                ["<x-component>"],
                                ["#shadow-root"],
                                ["...13 other(s) node(s)", "<span>"],
                                ["{host.footer}"]
                            ]
                        }
                    ],
                }
            ],
            directives:
            {
                logical:
                [
                    {
                        branches:
                        [
                            {
                                descriptor:
                                {
                                    directives:
                                    {
                                        inject:   [],
                                        injector: [],
                                        logical:  [],
                                        loop:     [],
                                    },
                                    elements: [],
                                    lookup:   [],
                                },
                                expression:  parseExpression("host.status == 1"),
                                observables: [["host", "status"]],
                                path:        "5",
                                stackTrace:
                                [
                                    ["<x-component>"],
                                    ["#shadow-root"],
                                    ["...5 other(s) node(s)", "<span #if=\"host.status == 1\">"]
                                ]
                            },
                            {
                                descriptor:
                                {
                                    directives:
                                    {
                                        inject:   [],
                                        injector: [],
                                        logical:  [],
                                        loop:     [],
                                    },
                                    elements: [],
                                    lookup:   [],
                                },
                                expression:  parseExpression("host.status == 2"),
                                observables: [["host", "status"]],
                                path:        "6",
                                stackTrace:
                                [
                                    ["<x-component>"],
                                    ["#shadow-root"],
                                    ["...6 other(s) node(s)", "<span #else-if=\"host.status == 2\">"]
                                ]
                            },
                            {
                                descriptor:
                                {
                                    directives:
                                    {
                                        inject:   [],
                                        injector: [],
                                        logical:  [],
                                        loop:     [],
                                    },
                                    elements: [],
                                    lookup:   [],
                                },
                                expression:  parseExpression("true"),
                                observables: [],
                                path:        "7",
                                stackTrace:
                                [
                                    ["<x-component>"],
                                    ["#shadow-root"],
                                    ["...7 other(s) node(s)", "<span #else>"]
                                ]
                            }
                        ]
                    }
                ],
                inject:
                [
                    {
                        descriptor:
                        {
                            directives:
                            {
                                inject:   [],
                                injector: [],
                                logical:  [],
                                loop:     [],
                            },
                            elements: [],
                            lookup:   [],
                        },
                        key:        parseExpression("'default'"),
                        path:       "1",
                        pattern:    parseDestructuredPattern("__scope__"),
                        stackTrace:
                        [
                            ["<x-component>"],
                            ["#shadow-root"],
                            ["...1 other(s) node(s)", "<span #inject>"]
                        ]
                    },
                    {
                        descriptor:
                        {
                            directives:
                            {
                                inject:   [],
                                injector: [],
                                logical:  [],
                                loop:     [],
                            },
                            elements:
                            [
                                {
                                    attributes: [],
                                    directives: [],
                                    path:       "0-0",
                                    textNodes:
                                    [
                                        {
                                            expression:  parseInterpolation("{title}"),
                                            observables: [],
                                            path:        "0-0-0",
                                            stackTrace:
                                            [
                                                ["<x-component>"],
                                                ["#shadow-root"],
                                                ["...2 other(s) node(s)", "<span #inject:title=\"{ title }\">"],
                                                ["<h1>"],
                                                ["{title}"]
                                            ]
                                        }
                                    ]
                                }
                            ],
                            lookup: [[0, 0], [0, 0, 0]],
                        },
                        key:         parseExpression("'title'"),
                        path:        "2",
                        pattern:     parseDestructuredPattern("{ title }"),
                        stackTrace:
                        [
                            ["<x-component>"],
                            ["#shadow-root"],
                            ["...2 other(s) node(s)", "<span #inject:title=\"{ title }\">"]
                        ]
                    },
                    {
                        descriptor:
                        {
                            directives:
                            {
                                inject:   [],
                                injector: [],
                                logical:  [],
                                loop:     [],
                            },
                            elements:
                            [
                                {
                                    attributes: [],
                                    directives: [],
                                    path:       "0-0",
                                    textNodes:
                                    [
                                        {
                                            expression:  parseInterpolation("{title}"),
                                            observables: [],
                                            path:        "0-0-0",
                                            stackTrace:
                                            [
                                                ["<x-component>"],
                                                ["#shadow-root"],
                                                ["...3 other(s) node(s)", "<span #inject=\"{ title }\" #inject-key=\"dynamicInjectKey\">"],
                                                ["<h1>"],
                                                ["{title}"]
                                            ]
                                        }
                                    ]
                                }
                            ],
                            lookup: [[0, 0], [0, 0, 0]],
                        },
                        key:        parseExpression("dynamicInjectKey"),
                        path:       "3",
                        pattern:    parseDestructuredPattern("{ title }"),
                        stackTrace:
                        [
                            ["<x-component>"],
                            ["#shadow-root"],
                            ["...3 other(s) node(s)", "<span #inject=\"{ title }\" #inject-key=\"dynamicInjectKey\">"]
                        ]
                    },
                ],
                injector:
                [
                    {
                        descriptor:
                        {
                            directives:
                            {
                                inject:   [],
                                injector: [],
                                logical:  [],
                                loop:     [],
                            },
                            elements: [],
                            lookup:   [],
                        },
                        expression:  parseExpression("({ })"),
                        key:         parseExpression("'default'"),
                        observables: [],
                        path:        "8",
                        stackTrace:
                        [
                            ["<x-component>"],
                            ["#shadow-root"],
                            ["...8 other(s) node(s)", "<span #injector>"]
                        ]
                    },
                    {
                        descriptor:
                        {
                            directives:
                            {
                                inject:   [],
                                injector: [],
                                logical:  [],
                                loop:     [],
                            },
                            elements:
                            [
                                {
                                    attributes: [],
                                    directives: [],
                                    path:       "0",
                                    textNodes:
                                    [
                                        {
                                            expression:  parseInterpolation("Default {name}"),
                                            observables: [],
                                            path:        "0-0",
                                            stackTrace:
                                            [
                                                ["<x-component>"],
                                                ["#shadow-root"],
                                                ["...9 other(s) node(s)", "<span #injector:value=\"({ name: host.name })\">"],
                                                ["Default {name}"],
                                            ]
                                        }
                                    ]
                                }
                            ],
                            lookup: [[0], [0, 0]],
                        },
                        expression:  parseExpression("({ name: host.name })"),
                        key:         parseExpression("'value'"),
                        observables: [["host", "name"]],
                        path:        "9",
                        stackTrace:
                        [
                            ["<x-component>"],
                            ["#shadow-root"],
                            ["...9 other(s) node(s)", "<span #injector:value=\"({ name: host.name })\">"]
                        ]
                    },
                    {
                        descriptor:
                        {
                            directives:
                            {
                                inject:   [],
                                injector: [],
                                logical:  [],
                                loop:     [],
                            },
                            elements:
                            [
                                {
                                    attributes: [],
                                    directives: [],
                                    path:       "0",
                                    textNodes:
                                    [
                                        {
                                            expression:  parseInterpolation("Default {name}"),
                                            observables: [],
                                            path:        "0-0",
                                            stackTrace:
                                            [
                                                ["<x-component>"],
                                                ["#shadow-root"],
                                                ["...10 other(s) node(s)", "<span #injector=\"({ name: host.name })\" #injector-key=\"dynamicInjectorKey\">"],
                                                ["Default {name}"],
                                            ]
                                        }
                                    ]
                                }
                            ],
                            lookup: [[0], [0, 0]],
                        },
                        expression:  parseExpression("({ name: host.name })"),
                        key:         parseExpression("dynamicInjectorKey"),
                        observables: [["host", "name"]],
                        path:        "10",
                        stackTrace:
                        [
                            ["<x-component>"],
                            ["#shadow-root"],
                            ["...10 other(s) node(s)", "<span #injector=\"({ name: host.name })\" #injector-key=\"dynamicInjectorKey\">"]
                        ]
                    },
                ],
                loop:
                [
                    {
                        left: parseExpression("item") as IIdentifier,
                        descriptor:
                        {
                            directives:
                            {
                                inject:   [],
                                injector: [],
                                logical:  [],
                                loop:     [],
                            },
                            elements:
                            [
                                {
                                    attributes: [],
                                    directives: [],
                                    textNodes:
                                    [
                                        {
                                            expression:  parseInterpolation("{item.id}"),
                                            observables: [["item", "id"]],
                                            path:        "0-0-0",
                                            stackTrace:
                                            [
                                                ["<x-component>"],
                                                ["#shadow-root"],
                                                ["...11 other(s) node(s)", "<table>"],
                                                ["<tbody>"],
                                                ["...1 other(s) node(s)", "<tr onclick=\"fn({ clicked })\" #for=\"const item of host.items\">"],
                                                ["<td>"],
                                                ["{item.id}"],
                                            ]
                                        },
                                    ],
                                    path: "0-0"
                                },
                                {
                                    attributes: [],
                                    directives: [],
                                    textNodes:
                                    [
                                        {
                                            expression:  parseInterpolation("{item.name}"),
                                            observables: [["item", "name"]],
                                            path:        "0-1-0",
                                            stackTrace:
                                            [
                                                ["<x-component>"],
                                                ["#shadow-root"],
                                                ["...11 other(s) node(s)", "<table>"],
                                                ["<tbody>"],
                                                ["...1 other(s) node(s)", "<tr onclick=\"fn({ clicked })\" #for=\"const item of host.items\">"],
                                                ["...1 other(s) node(s)", "<td>"],
                                                ["{item.name}"],
                                            ]
                                        },
                                    ],
                                    path: "0-1"
                                },
                                {
                                    attributes: [],
                                    directives: [],
                                    textNodes:
                                    [
                                        {
                                            expression:  parseInterpolation("{item.status}"),
                                            observables: [["item", "status"]],
                                            path:        "0-2-0",
                                            stackTrace:
                                            [
                                              ["<x-component>"],
                                              ["#shadow-root"],
                                              ["...11 other(s) node(s)", "<table>"],
                                              ["<tbody>"],
                                              ["...1 other(s) node(s)", "<tr onclick=\"fn({ clicked })\" #for=\"const item of host.items\">"],
                                              ["...2 other(s) node(s)", "<td>"],
                                              ["{item.status}"]
                                            ]
                                        },
                                    ],
                                    path: "0-2"
                                }
                            ],
                            lookup: [[0, 0], [0, 0, 0], [0, 1], [0, 1, 0], [0, 2], [0, 2, 0]],
                        },
                        observables: [["host", "items"]],
                        operator:    "of",
                        path:        "11-0-1",
                        right:       parseExpression("host.items"),
                        stackTrace:
                        [
                            ["<x-component>"],
                            ["#shadow-root"],
                            ["...11 other(s) node(s)", "<table>"],
                            ["<tbody>"],
                            ["...1 other(s) node(s)", "<tr onclick=\"fn({ clicked })\" #for=\"const item of host.items\">"]
                        ]
                    }
                ],
            },
            lookup: [[0], [0, 0], [1], [2], [3], [5], [6], [7], [8], [9], [10], [11, 0, 0], [11, 0, 1], [13], [13, 0]],
        };

        const actual = TemplateParser.parseReference("x-component", template);

        assert.deepEqual(actual, expected);
    }

    @shouldPass @test
    public escapeAttributes(): void
    {
        const template = document.createElement("template");

        template.innerHTML = "<span *style=\"display: {host.display}\"></span>";

        const expected = "<span style=\"\"></span>";

        const actual = TemplateParser.parse("x-component", template)[0].innerHTML;

        assert.equal(actual, expected);
    }

    @shouldPass @test
    public decomposeIfAndFor(): void
    {
        const template = document.createElement("template");

        template.innerHTML = "<span #if=\"true\" #for=\"const item of items\">{item.value}</span>";

        const expected = "<template #if=\"true\"><template #for=\"const item of items\"><span> </span></template></template>";

        const actual = TemplateParser.parse("x-component", template)[0].innerHTML;

        assert.equal(actual, expected);
    }

    @shouldPass @test
    public decomposeIfAndInjector(): void
    {
        const template = document.createElement("template");

        template.innerHTML = "<span #if=\"true\" #injector:value=\"source\">Placeholder</span>";

        const expected = "<template #if=\"true\"><template #injector:value=\"source\"><span>Placeholder</span></template></template>";

        const actual = TemplateParser.parse("x-component", template)[0].innerHTML;

        assert.equal(actual, expected);
    }

    @shouldPass @test
    public decomposeForAndInjector(): void
    {
        const template = document.createElement("template");

        template.innerHTML = "<span #for=\"const [key, value] of items\" #injector:[key]=\"source\">{source.value}</span>";

        const expected = "<template #for=\"const [key, value] of items\"><template #injector:[key]=\"source\"><span> </span></template></template>";

        const actual = TemplateParser.parse("x-component", template)[0].innerHTML;

        assert.equal(actual, expected);
    }

    @shouldPass @test
    public decomposeIfAndInject(): void
    {
        const template = document.createElement("template");

        template.innerHTML = "<span #if=\"true\" #inject:value=\"source\">{source.value}</span>";

        const expected = "<template #if=\"true\"><template #inject:value=\"source\"><span> </span></template></template>";

        const actual = TemplateParser.parse("x-component", template)[0].innerHTML;

        assert.equal(actual, expected);
    }

    @shouldPass @test
    public decomposeForAndInject(): void
    {
        const template = document.createElement("template");

        template.innerHTML = "<span #for=\"const item of items\" #inject:value=\"source\">{source.value}</span>";

        const expected = "<template #for=\"const item of items\"><template #inject:value=\"source\"><span> </span></template></template>";

        const actual = TemplateParser.parse("x-component", template)[0].innerHTML;

        assert.equal(actual, expected);
    }

    @shouldPass @test
    public decompose(): void
    {
        const template = document.createElement("template");

        template.innerHTML = "<span class=\"foo\" #inject:value=\"source\" #if=\"true\" #injector:value=\"source\" #for=\"const item of items\">{source.value}</span>";

        const expected = "<template #inject:value=\"source\"><template #if=\"true\"><template #injector:value=\"source\"><template #for=\"const item of items\"><span class=\"foo\"> </span></template></template></template></template>";

        const actual = TemplateParser.parse("x-component", template)[0].innerHTML;

        assert.equal(actual, expected);
    }

    @shouldPass @test
    public decomposeInjectorWithInjectorKey(): void
    {
        const template = document.createElement("template");

        template.innerHTML = "<span #injector=\"source\" #injector-key=\"key\">{source.value}</span>";

        const expected = "<template #injector=\"source\" #injector-key=\"key\"><span> </span></template>";

        const actual = TemplateParser.parse("x-component", template)[0].innerHTML;

        assert.equal(actual, expected);
    }

    @shouldPass @test
    public decomposeInjectorAndInject(): void
    {
        const template = document.createElement("template");

        template.innerHTML = "<span #injector:value=\"source\" #inject:value=\"source\">{source.value}</span>";

        const expected = "<template #injector:value=\"source\"><template #inject:value=\"source\"><span> </span></template></template>";

        const actual = TemplateParser.parse("x-component", template)[0].innerHTML;

        assert.equal(actual, expected);
    }

    @shouldFail @test
    public ErrorParsingTextNode(): void
    {
        const template = document.createElement("template");

        template.innerHTML = "<div>This is a invalid expression: {++true}</div>";

        const message = "Error parsing \"This is a invalid expression: {++true}\": Invalid left-hand side expression in prefix operation at position 33";
        const stack   = "<x-component>\n   #shadow-root\n      <div>\n         This is a invalid expression: {++true}";

        const actual   = tryAction(() => TemplateParser.parse("x-component", template));
        const expected = toRaw(new TemplateParseError(message, stack));

        assert.deepEqual(actual, expected);
    }

    @shouldFail @test
    public InvalidTwoWayDataBind(): void
    {
        const template = document.createElement("template");

        template.innerHTML = "<x-foo ::value='host.value1 || host.value2'></x-foo>";

        const message = "Two way data bind cannot be applied to dynamic properties: \"host.value1 || host.value2\"";
        const stack   = "<x-component>\n   #shadow-root\n      <x-foo ::value=\"host.value1 || host.value2\">";

        const actual   = tryAction(() => TemplateParser.parse("x-component", template));
        const expected = toRaw(new TemplateParseError(message, stack));

        assert.deepEqual(actual, expected);
    }

    @shouldFail @test
    public InvalidTwoWayDataBindWithDinamicProperty(): void
    {
        const template = document.createElement("template");

        template.innerHTML = "<x-foo ::value=\"host[a + b]\"></x-foo>";

        const message = "Two way data bind cannot be applied to dynamic properties: \"host[a + b]\"";
        const stack   = "<x-component>\n   #shadow-root\n      <x-foo ::value=\"host[a + b]\">";

        const actual   = tryAction(() => TemplateParser.parse("x-component", template));
        const expected = toRaw(new TemplateParseError(message, stack));

        assert.deepEqual(actual, expected);
    }

    @shouldFail @test
    public InvalidTwoWayDataBindWithOptionalProperty(): void
    {
        const template = document.createElement("template");

        template.innerHTML = "<x-foo ::value=\"host?.value\"></x-foo>";

        const message = "Two way data bind cannot be applied to dynamic properties: \"host?.value\"";
        const stack   = "<x-component>\n   #shadow-root\n      <x-foo ::value=\"host?.value\">";

        const actual   = tryAction(() => TemplateParser.parse("x-component", template));
        const expected = toRaw(new TemplateParseError(message, stack));

        assert.deepEqual(actual, expected);
    }

    @shouldFail @test
    public InvalidForDirective(): void
    {
        const template = document.createElement("template");

        template.innerHTML = "<div #inject:items='items' #if='false'><span #injector:items='items' #if='true' #for='x item of items'></span></div>";

        const message = "Error parsing \"x item of items\" in \"#for='x item of items'\": Unexpected token item at position 2";
        const stack   = "<x-component>\n   #shadow-root\n      <div #inject:items=\"items\" #if=\"false\">\n         <span #injector:items=\"items\" #if=\"true\" #for=\"x item of items\">";

        // TemplateParser.parse("x-component", template);

        const actual   = tryAction(() => TemplateParser.parse("x-component", template));
        const expected = toRaw(new TemplateParseError(message, stack));

        assert.deepEqual(actual, expected);
    }

    @shouldFail @test
    public unexpectedElseIf(): void
    {
        const template = document.createElement("template");

        template.innerHTML = "<span #for='const item of items'></span><span #else-if></span>";

        const message = "Unexpected #else-if directive. #else-if must be used in an element next to an element that uses the #else-if directive.";
        const stack   = "<x-component>\n   #shadow-root\n      ...1 other(s) node(s)\n      <span #else-if>";

        const actual   = tryAction(() => TemplateParser.parse("x-component", template));
        const expected = toRaw(new TemplateParseError(message, stack));

        assert.deepEqual(actual, expected);
    }

    @shouldFail @test
    public unexpectedElse(): void
    {
        const template = document.createElement("template");

        template.innerHTML = "<span #for='const item of items'></span><span #else></span>";

        const message = "Unexpected #else directive. #else must be used in an element next to an element that uses the #if or #else-if directive.";
        const stack   = "<x-component>\n   #shadow-root\n      ...1 other(s) node(s)\n      <span #else>";

        const actual   = tryAction(() => TemplateParser.parse("x-component", template));
        const expected = toRaw(new TemplateParseError(message, stack));

        assert.deepEqual(actual, expected);
    }

    @shouldFail @test
    public unresgisteredDirective(): void
    {
        const template = document.createElement("template");

        template.innerHTML = "<div><div></div><section><span #foo='bar'></span></section></div>";

        const message = "Unregistered directive #foo.";
        const stack   = "<x-component>\n   #shadow-root\n      <div>\n         ...1 other(s) node(s)\n         <section>\n            <span #foo=\"bar\">";

        const actual   = tryAction(() => TemplateParser.parse("x-component", template));
        const expected = toRaw(new TemplateParseError(message, stack));

        assert.deepEqual(actual, expected);
    }
}