import type { Callable }  from "@surface/core";
import BaseSetup          from "./base-setup.js";
import type ICallSetup    from "./interfaces/call-setup";
import type IExecutable   from "./interfaces/executable";
import type IReturnsSetup from "./interfaces/returns-setup";
import ReturnSetup        from "./return-setup.js";

export default class CallSetup<TMethod extends Callable = Callable, TResult extends ReturnType<TMethod> = ReturnType<TMethod>> extends BaseSetup<TMethod, TResult>
    implements ICallSetup<TMethod>, IExecutable<TMethod>
{
    private invoke(...args: Parameters<TMethod>): unknown
    {
        return this.setup.get(args);
    }

    public call(...args: Parameters<TMethod>): IReturnsSetup<TResult>
    {
        return new ReturnSetup(this.setup, args);
    }

    public execute(): TMethod
    {
        return this.invoke.bind<unknown>(this) as TMethod;
    }
}