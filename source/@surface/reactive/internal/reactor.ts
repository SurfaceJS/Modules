import { Indexer, Nullable }   from "@surface/core";
import { hasValue, typeGuard } from "@surface/core/common/generic";
import { uuidv4 }              from "@surface/core/common/string";
import Type                    from "@surface/reflection";
import FieldInfo               from "@surface/reflection/field-info";
import PropertyInfo            from "@surface/reflection/property-info";
import IObserver               from "../interfaces/observer";
import IPropertySubscription   from "../interfaces/property-subscription";
import IReactor                from "../interfaces/reactor";
import ISubscription           from "../interfaces/subscription";
import PropertySubscription    from "./property-subscription";
import { KEYS, REACTOR }       from "./symbols";

export type Reactiveable<T = Indexer> = T & { [KEYS]?: Array<string>, [REACTOR]?: Reactor };

export default class Reactor implements IReactor
{
    private static readonly stack: Array<Reactor> = [];

    private readonly dependencies:  Map<string, Reactor>                                  = new Map();
    private readonly observers:     Map<string, IObserver>                                = new Map();
    private readonly registries:    Set<Reactor>                                          = new Set();
    private readonly subscriptions: Map<string, Set<ISubscription|IPropertySubscription>> = new Map();

    private _id: string = "";

    public get id(): string
    {
        return this._id = this._id || uuidv4();
    }

    private static notify(target: Reactiveable, key: string): void
    {
        const reactor = target[REACTOR]!;

        reactor.update(key, target[key]);

        reactor.notify(target, key);
    }

    public static makeReactive(target: Reactiveable, key: string): void
    {
        const keys   = target[KEYS] || [] as Array<string>;
        target[KEYS] = keys;

        if (keys.includes(key))
        {
            return;
        }

        keys.push(key);

        const member = Type.from(target).getMember(key);

        if (member instanceof PropertyInfo)
        {
            const privateKey = `_${key}`;

            if (member.readonly && privateKey in target)
            {
                const hiddenKey = `_${key}_`;

                target[hiddenKey] = target[key];

                Object.defineProperty
                (
                    target,
                    privateKey,
                    {
                        get(this: Indexer)
                        {
                            return this[hiddenKey];
                        },
                        set(this: Indexer, value: unknown)
                        {
                            const oldValue = this[hiddenKey];

                            if (!Object.is(oldValue, value))
                            {
                                this[hiddenKey] = value;

                                Reactor.notify(this, key);
                            }
                        }
                    }
                );
            }
            else
            {
                Object.defineProperty
                (
                    target,
                    key,
                    {
                        get(this: Indexer)
                        {
                            return member.getter!.call(this);
                        },
                        set(this: Indexer, value: unknown)
                        {
                            const oldValue = member.getter!.call(this);

                            if (!Object.is(oldValue, value))
                            {
                                member.setter!.call(this, value);

                                Reactor.notify(this, key);
                            }
                        }
                    }
                );
            }
        }
        else if (member instanceof FieldInfo)
        {
            const privateKey = `_${key}`;

            target[privateKey] = target[key];

            Object.defineProperty
            (
                target,
                key,
                {
                    get(this: Indexer)
                    {
                        return this[privateKey];
                    },
                    set(this: Indexer, value: unknown)
                    {
                        const oldValue = this[privateKey];

                        if (!Object.is(oldValue, value))
                        {
                            this[privateKey] = value;

                            Reactor.notify(this, key);
                        }
                    }
                }
            );
        }
    }

    private register(target: Reactiveable, registry: Reactor): void
    {
        if (registry != this)
        {
            for (const [key, dependency] of this.dependencies)
            {
                if (registry.dependencies.has(key))
                {
                    dependency.register(target[key] as Indexer, registry.dependencies.get(key)!);
                }
                else
                {
                    const value = target[key] as Reactiveable;

                    const reactor = value[REACTOR] = value[REACTOR] || new Reactor();

                    const keys = value[KEYS] = value[KEYS] || [];

                    if (!keys.includes(key))
                    {
                        Reactor.makeReactive(target, key);
                    }

                    registry.dependencies.set(key, reactor);
                    dependency.register(value, reactor);
                }
            }

            for (const key of this.observers.keys())
            {
                const keys = target[KEYS] = target[KEYS] || [];

                if (!keys.includes(key))
                {
                    Reactor.makeReactive(target, key);
                }
            }

            registry.registries.add(this);
            this.registries.add(registry);
        }
    }

    private unregister(): void
    {
        for (const dependency of this.dependencies.values())
        {
            dependency.unregister();
        }

        for (const registry of this.registries)
        {
            registry.registries.delete(this);
        }

        this.registries.clear();
    }

    public getDependency(key: string): Nullable<Reactor>
    {
        return this.dependencies.get(key);
    }

    public getObserver(key: string): Nullable<IObserver>
    {
        return this.observers.get(key);
    }

    public notify(value: unknown): void;
    public notify<TTarget extends Indexer, TKey extends keyof TTarget>(target: TTarget, key: TKey): void;
    public notify(...args: [unknown]|[Indexer, string]): void
    {
        if (Reactor.stack.includes(this))
        {
            return;
        }

        const value = args.length == 1 ? args[0] : args[0][args[1]];

        if (!hasValue(value))
        {
            return;
        }

        Reactor.stack.push(this);

        if (args.length == 1)
        {
            for (const registry of this.registries.values())
            {
                registry.notify(value);
            }

            if (typeGuard<unknown, Indexer>(value, x => x instanceof Object))
            {
                for (const subscriptions of this.subscriptions.values())
                {
                    for (const subscription of subscriptions)
                    {
                        if ("update" in subscription)
                        {
                            subscription.update(value);
                        }
                    }
                }

                for (const [key, observer] of this.observers)
                {
                    observer.notify(value[key]);
                }
            }
            else
            {
                this.notify(value);
            }
        }
        else
        {
            const [target, key] = args;

            if (this.subscriptions.has(key))
            {
                for (const subscription of this.subscriptions.get(key)!)
                {
                    if ("update" in subscription)
                    {
                        subscription.update(target);
                    }
                }
            }

            if (this.dependencies.has(key))
            {
                const dependency = this.dependencies.get(key)!;

                if (dependency.dependencies.size > 0)
                {
                    for (const dependencyKey of dependency.dependencies.keys())
                    {
                        dependency.notify(value as Indexer, dependencyKey);
                    }
                }
                else
                {
                    dependency.notify(value);
                }
            }

            for (const registry of this.registries.values())
            {
                registry.notify(target, key);
            }

            if (this.observers.has(key))
            {
                this.observers.get(key)!.notify(value);
            }
        }

        Reactor.stack.pop();
    }

    public setDependency(key: string, dependency: Reactor): void
    {
        this.dependencies.set(key, dependency);
    }

    public setObserver(key: string, observer: IObserver): void
    {
        this.observers.set(key, observer);
    }

    public setSubscription(key: string, subscription: PropertySubscription): void
    {
        const subscriptions = this.subscriptions.get(key) || new Set();

        this.subscriptions.set(key, subscriptions);

        subscriptions.add(subscription);
    }

    public toString(): string
    {
        if (Reactor.stack.includes(this))
        {
            return `"[circular ${this.id}]"`;
        }

        Reactor.stack.push(this);

        const keys = [`"id": "${this.id}"`];

        if (this.dependencies.size > 0)
        {
            const dependencies =  Array.from(this.dependencies)
                .map(([key, dependency]) => `"${key}": ${dependency.toString()}`)
                .join(", ");

            keys.push(`"dependencies": { ${dependencies} }`);
        }

        if (this.observers.size > 0)
        {
            const observers =  Array.from(this.observers)
                .map(([key, observer]) => `"${key}": ${observer.toString()}`)
                .join(", ");

            keys.push(`"observers": { ${observers} }`);
        }

        if (this.registries.size > 0)
        {
            const registries =  Array.from(this.registries)
                .map(x => x.toString())
                .join(", ");

            keys.push(`"registries": [${registries}]`);
        }

        if (this.subscriptions.size > 0)
        {
            const subscriptions =  Array.from(this.subscriptions)
                .map(([key, subscription]) => `"${key}": ${subscription.toString()}`)
                .join(", ");

            keys.push(`"subscriptions": { ${subscriptions} }`);
        }

        Reactor.stack.pop();

        return `{ ${keys.join(", ")} }`;
    }

    public update(key: string, value: unknown)
    {
        const dependency = this.dependencies.get(key);

        if (dependency)
        {
            dependency.unregister();

            if (typeGuard<unknown, Reactiveable>(value, x => x instanceof Object))
            {
                if (!value[REACTOR])
                {
                    value[REACTOR] = new Reactor();
                }

                dependency.register(value, value[REACTOR]!);
            }
        }
    }
}