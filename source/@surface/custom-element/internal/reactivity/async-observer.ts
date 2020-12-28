import { CancellationTokenSource } from "@surface/core";
import { Observer }                from "@surface/reactive";
import type Scheduler              from "../processors/scheduler.js";

export default class AsyncObserver extends Observer
{
    private readonly scheduler: Scheduler;
    private cancellationTokenSource: CancellationTokenSource = new CancellationTokenSource();

    public constructor(root: object, path: string[], scheduler: Scheduler)
    {
        super(root, path);

        this.scheduler = scheduler;
    }

    public notify(): void
    {
        const task = (): void => super.notify();

        this.cancellationTokenSource.cancel();

        this.cancellationTokenSource = new CancellationTokenSource();

        void this.scheduler.enqueue(task, "high", this.cancellationTokenSource.token);
    }
}