import Enumerable from "..";

export default interface ILookup<TKey, TElement>
{
    count:               number;
    contains(key: TKey): boolean
    get(key: TKey):      Enumerable<TElement>;
}