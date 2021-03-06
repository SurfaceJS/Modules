import mocha from "./mocha.js";
import
{
    AFTER,
    AFTER_EACH,
    BATCH,
    BEFORE,
    BEFORE_EACH,
    CATEGORY,
    DATA,
    DESCRIPTION,
    EXPECTATION,
    TEST,
} from "./symbols.js";
import type Test       from "./types/test";
import type TestMethod from "./types/test-method";
import type TestObject from "./types/test-object";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Constructor<T = object>                                = new (...args: any[]) => T;
type Delegate<TArgs extends unknown[] = [], TResult = void> = (...args: TArgs) => TResult;
type Indexer<T = unknown>                                   = object & Record<string | number, T | undefined>;

function camelToText(value: string): string
{
    return value.split(/(?:(?<![A-Z])(?=[A-Z]))|(?:(?<![a-zA-Z])(?=[a-z]))|(?:(?<![0-9])(?=[0-9]))/g).join(" ").toLowerCase();
}

export function after(description: string): MethodDecorator;
export function after(target: object, key: string | symbol): void;
export function after(...args: [string] | [object, string | symbol]): MethodDecorator | void
{
    const decorator = (target: TestObject, key: string | symbol, description: string): void =>
    {
        target[key as string][AFTER]       = true;
        target[key as string][DESCRIPTION] = description;
    };

    if (args.length == 1)
    {
        return (target: object, key: string | symbol) => decorator(target as TestObject, key, args[0]);
    }

    const [target, key] = args;

    decorator(target as TestObject, key, camelToText(key.toString()));
}

export function afterEach(description: string): MethodDecorator;
export function afterEach(target: object, key: string | symbol): void;
export function afterEach(...args: [string] | [object, string | symbol]): MethodDecorator | void
{
    const decorator = (target: TestObject, key: string | symbol, description: string): void =>
    {
        target[key as keyof TestObject][AFTER_EACH]  = true;
        target[key as keyof TestObject][DESCRIPTION] = description;
    };

    if (args.length == 1)
    {
        return (target: object, key: string | symbol) => decorator(target as TestObject, key, args[0]);
    }

    const [target, key] = args;

    decorator(target as TestObject, key, camelToText(key.toString()));
}

export function batchTest<T = unknown>(source: T[], expectation: Delegate<[T], string>): MethodDecorator
{
    return (target: object, key: string | symbol) =>
    {
        (target as TestObject<T>)[key as keyof TestObject<T>][BATCH] = true;
        (target as TestObject<T>)[key as keyof TestObject<T>][DATA]  = { expectation, source };
    };
}

export function before(description: string): MethodDecorator;
export function before(target: object, key: string | symbol): void;
export function before(...args: [string] | [object, string | symbol]): MethodDecorator | void
{
    const decorator = (target: TestObject, key: string | symbol, description: string): void =>
    {
        target[key as string][BEFORE]      = true;
        target[key as string][DESCRIPTION] = description;
    };

    if (args.length == 1)
    {
        return (target: object, key: string | symbol) => decorator(target as TestObject, key, args[0]);
    }

    const [target, key] = args;

    decorator(target as TestObject, key, camelToText(key.toString()));
}

export function beforeEach(description: string): MethodDecorator;
export function beforeEach(target: object, propertyKey: string | symbol): void;
export function beforeEach(...args: [string] | [object, string | symbol]): MethodDecorator | void
{
    const decorator = (target: TestObject, key: string | symbol, description: string): void =>
    {
        target[key as keyof TestObject][BEFORE_EACH] = true;
        target[key as keyof TestObject][DESCRIPTION] = description;
    };

    if (args.length == 1)
    {
        return (target: object, key: string | symbol) => decorator(target as TestObject, key.toString(), args[0]);
    }

    const [target, key] = args;

    decorator(target as TestObject, key, camelToText(key.toString()));
}

export function category(name: string): MethodDecorator
{
    return (target: object, key: string | symbol) =>
    {
        (target as TestObject)[key as string][CATEGORY] = name;
    };
}

export function shouldPass(target: object, propertyKey: string | symbol): void
{
    category("should pass")(target, propertyKey, Object.getOwnPropertyDescriptor(target, propertyKey) as TypedPropertyDescriptor<object>);
}

export function shouldFail(target: object, propertyKey: string | symbol): void
{
    category("should fail")(target, propertyKey, Object.getOwnPropertyDescriptor(target, propertyKey) as TypedPropertyDescriptor<object>);
}

export function suite(target: Function): void;
export function suite(description: string): ClassDecorator;
export function suite(targetOrDescription: Function | string): ClassDecorator | void
{
    const decorator = (target: Function, description: string): void =>
    {
        const tests:       Test[]          = [];
        const catergories: Indexer<Test[]> = { };

        let afterCallback:      TestMethod | null = null;
        let afterEachCallback:  TestMethod | null = null;
        let beforeCallback:     TestMethod | null = null;
        let beforeEachCallback: TestMethod | null = null;

        for (const name of Object.getOwnPropertyNames(target.prototype))
        {
            const method = target.prototype[name] as TestMethod;
            if (method[AFTER])
            {
                afterCallback = method as Delegate;
            }

            if (method[AFTER_EACH])
            {
                afterEachCallback = method as Delegate;
            }

            if (method[BEFORE])
            {
                beforeCallback = method as Delegate;
            }

            if (method[BEFORE_EACH])
            {
                beforeEachCallback = method as Delegate;
            }

            if (method[TEST])
            {
                const categoryName = method[CATEGORY];
                if (categoryName)
                {
                    const category = catergories[categoryName] = catergories[categoryName] ?? [];
                    category.push
                    ({
                        expectation: method[EXPECTATION] ?? "",
                        getMethod:   (context: object) => method.bind(context),
                    });
                }
                else
                {
                    tests.push
                    ({
                        expectation: method[EXPECTATION] ?? "",
                        getMethod:   context => method.bind(context),
                    });
                }
            }

            if (method[BATCH])
            {
                const batch = method[DATA] as { source: object[], expectation: Delegate<[object], string> };
                for (const data of batch.source)
                {
                    const categoryName = method[CATEGORY];
                    if (categoryName)
                    {
                        const category = catergories[categoryName] = catergories[categoryName] ?? [];
                        category.push
                        ({
                            expectation: batch.expectation(data),
                            getMethod:   (context: object) => () => method.call(context, data),
                        });
                    }
                    else
                    {
                        tests.push
                        ({
                            expectation: batch.expectation(data),
                            getMethod:   context => () => method.call(context, data),
                        });
                    }
                }
            }
        }

        mocha.suite
        (
            description,
            () =>
            {
                const context = new (target as Constructor)();

                if (beforeCallback)
                {
                    mocha.before(beforeCallback[DESCRIPTION]!, beforeCallback.bind(context));
                }

                if (beforeEachCallback)
                {
                    mocha.beforeEach(beforeEachCallback[DESCRIPTION]!, beforeEachCallback.bind(context));
                }

                for (const test of tests)
                {
                    mocha.test(test.expectation, test.getMethod(context));
                }

                for (const [name, tests] of Object.entries(catergories) as [string, Test[]][])
                {
                    mocha.suite
                    (
                        name,
                        () =>
                        {
                            for (const test of tests)
                            {
                                mocha.test(test.expectation, test.getMethod(context));
                            }
                        },
                    );
                }

                if (afterEachCallback)
                {
                    mocha.afterEach(afterEachCallback[DESCRIPTION]!, afterEachCallback.bind(context));
                }

                if (afterCallback)
                {
                    mocha.after(afterCallback[DESCRIPTION]!, afterCallback.bind(context));
                }
            },
        );
    };

    if (typeof targetOrDescription == "string")
    {
        return (target: Function) => decorator(target, targetOrDescription);
    }

    decorator(targetOrDescription, camelToText(targetOrDescription.name));
}

export function test(target: object, key: string | symbol): void;
export function test(expectation: string): MethodDecorator;
export function test(...args: [string] | [object, string | symbol]): MethodDecorator | void
{
    const decorator = (target: TestObject, key: string, expectation: string): void =>
    {
        target[key][TEST]        = true;
        target[key][EXPECTATION] = expectation;
    };

    if (args.length == 1)
    {
        return (target: object, key: string | symbol) => decorator(target as TestObject, key.toString(), args[0]);
    }

    const [target, key] = args;

    decorator(target as TestObject, key.toString(), camelToText(key.toString()));
}