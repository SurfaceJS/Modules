import { Action1, Unknown } from ".";

export default class Observer
{
    private listeners: Array<Action1<Unknown>> = [];

    public notify(value?: Unknown): void
    {
        this.listeners.forEach(listener => listener(value));
    }

    public subscribe(action: Action1<Unknown>): void
    {
        this.listeners.push(action);
    }

    public unsubscribe(action: Action1<Unknown>): void
    {
        this.listeners = this.listeners.filter(x => x != action);
    }
}