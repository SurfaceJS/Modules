import { Action2, Func1, Func2, Func3, Nullable } from "@surface/types";

export abstract class Enumerable<TSource> implements Iterable<TSource>
{
    public abstract [Symbol.iterator]: () => Iterator<TSource>;

    public static empty<T>(): Enumerable<T>
    {
        return new EnumerableIterator([]);
    }

    /**
     * Create a enumerable object from a iterable source
     * @param source Source used to create the iterable object
     */
    public static from<T>(source: Iterable<T>): Enumerable<T>
    {
        return new EnumerableIterator(source);
    }

    protected next(): Nullable<TSource>
    {
        return this[Symbol.iterator]().next().value;
    }

    /**
     * Determines whether all elements of a sequence satisfy a condition.
     * @param predicate A function to test each element for a condition.
     */
    public all(predicate: Func1<TSource, boolean>): boolean
    {
        for (const element of this)
        {
            if (!predicate(element))
            {
                return false;
            }
        }

        return true;
    }

    /** Determines whether a sequence contains any elements. */
    public any(): boolean;
    /**
     * Determines whether any element of a sequence satisfies a condition.
     * @param predicate A function to test each element for a condition.
     */
    public any(predicate: Func1<TSource, boolean>): boolean;
    public any(predicate?: Func1<TSource, boolean>): boolean
    {
        let hasAny = false;

        let sequence: Enumerable<TSource> = this;

        if (predicate)
        {
            sequence = sequence.where(predicate);
        }

        for (let element of sequence)
        {
            hasAny = element == element;
            break;
        }

        return hasAny;
    }

    /** Casts the elements of an IEnumerable to the specified type. Note that no type checking is performed at runtime. */
    public cast<T extends TSource>(): Enumerable<T>
    {
        return (this as Enumerable<TSource>) as Enumerable<T>;
    }

    /**
     * Returns the elements of the specified sequence or the specified value in a singleton collection if the sequence is empty.
     * @param value The value to return if the sequence is empty.
     */
    public defaultIfEmpty(value: TSource): Enumerable<TSource>
    {
        return new DefaultIfEmptyIterator(this, value);
    }

    /**
     * Returns the element at a specified index in a sequence.
     * @param index The zero-based index of the element to retrieve.
     */
    public elementAt(index: number): TSource
    {
        let element = this.elementAtOrDefault(index);

        if (!element)
        {
            throw new Error("Index is less than 0 or greater than the number of elements in source.");
        }

        return element;
    }

    /**
     * Returns the element at a specified index in a sequence or or undefined|null value if the index is out of range.
     * @param index The zero-based index of the element to retrieve.
     */
    public elementAtOrDefault(index: number): Nullable<TSource>
    {
        let currentIndex = 0;
        let current: Nullable<TSource> = null;

        for (const element of this)
        {
            current = element;
            if (currentIndex == index)
            {
                break;
            }

            index++;
        }

        return current;
    }

    /** Returns the first element of a sequence. */
    public first(): TSource;
    /**
     * Returns the first element of the sequence that satisfies a condition.
     * @param predicate A function to test each element for a condition.
     */
    public first(predicate: Func1<TSource, boolean>): TSource;
    public first(predicate?: Func1<TSource, boolean>): TSource
    {
        let element: Nullable<TSource> = null;

        if (predicate)
        {
            element = this.where(predicate).next();
        }
        else
        {
            element = this.next();
        }

        if (!element && predicate)
        {
            throw new Error("No element satisfies the condition in predicate.");
        }
        else if (!element)
        {
            throw new Error("The source sequence is empty.");
        }

        return element;
    }

    /** Returns the first element of a sequence, or undefined|null if the sequence contains no elements. */
    public firstOrDefault(): Nullable<TSource>;
    /**
     * Returns the first element of the sequence that satisfies a condition or a default value if no such element is found.
     * @param predicate A function to test each element for a condition.
     */
    public firstOrDefault(predicate: Func1<TSource, boolean>): Nullable<TSource>;
    public firstOrDefault(predicate?: Func1<TSource, boolean>): Nullable<TSource>
    {
        if (predicate)
        {
            return this.where(predicate).next();
        }

        return this.next();
    }

    /**
     * Performs the specified action on each element of the sequence by incorporating the element"s index.
     * @param action The Action2<TSource, number> delegate to perform on each element of the sequence.
     */
    public forEach(action: Action2<TSource, number>)
    {
        let index = 0;
        for (const element of this)
        {
            action(element, index);
            index++;
        }
    }

    /** Returns the last element of a sequence. */
    public last(): TSource;
    /**
     * Returns the last element of the sequence that satisfies a condition.
     * @param predicate A function to test each element for a condition.
     */
    public last(predicate: Func1<TSource, boolean>): TSource;
    public last(predicate?: Func1<TSource, boolean>): TSource
    {
        let element: Nullable<TSource> = null;

        element = predicate && this.lastOrDefault(predicate) || this.lastOrDefault();

        if (!element && predicate)
        {
            throw new Error("No element satisfies the condition in predicate.");
        }
        else if (!element)
        {
            throw new Error("The source sequence is empty.");
        }

        return element;
    }

    /** Returns the last element of a sequence, or undefined|null if the sequence contains no elements. */
    public lastOrDefault(): Nullable<TSource>;
    /**
     * Returns the last element of the sequence that satisfies a condition or a default value if no such element is found.
     * @param predicate A function to test each element for a condition.
     */
    public lastOrDefault(predicate: Func1<TSource, boolean>): Nullable<TSource>;
    public lastOrDefault(predicate?: Func1<TSource, boolean>): Nullable<TSource>
    {
        if (predicate)
        {
            return this.where(predicate).lastOrDefault();
        }

        let current: Nullable<TSource> = null;

        for (let element of this)
        {
            current = element;
        }

        return current;
    }

    /**
     * Sorts the elements of a sequence in ascending order by using a specified comparer.
     * @param keySelector A function to extract a key from an element.
     */
    public orderBy<TKey>(keySelector: Func1<TSource, TKey>): OrderedEnumerable<TSource>;
    /**
     * Sorts the elements of a sequence in ascending order by using a specified comparer.
     * @param keySelector A function to extract a key from an element.
     * @param comparer    A function to compare keys.
     */
    public orderBy<TKey>(keySelector: Func1<TSource, TKey>, comparer: Func2<TKey, TKey, number>): OrderedEnumerable<TSource>;
    public orderBy<TKey>(keySelector: Func1<TSource, TKey>, comparer?: Func2<TKey, TKey, number>): OrderedEnumerable<TSource>
    {
        return new OrderByIterator(this, keySelector, false, comparer || Comparer.default);
    }

    /**
     * Sorts the elements of a sequence in descending order by using a specified comparer.
     * @param keySelector A function to extract a key from an element.
     */
    public orderByDescending<TKey>(keySelector: Func1<TSource, TKey>): OrderedEnumerable<TSource>;
    /**
     * Sorts the elements of a sequence in descending order by using a specified comparer.
     * @param keySelector A function to extract a key from an element.
     * @param comparer    A function to compare keys.
     */
    public orderByDescending<TKey>(keySelector: Func1<TSource, TKey>, comparer: Func2<TKey, TKey, number>): OrderedEnumerable<TSource>;
    public orderByDescending<TKey>(keySelector: Func1<TSource, TKey>, comparer?: Func2<TKey, TKey, number>): OrderedEnumerable<TSource>
    {
        return new OrderByIterator(this, keySelector, true, comparer || Comparer.default);
    }

    /**
     * Projects each element of a sequence into a new form by incorporating the element"s index.
     * @param selector A transform function to apply to each source element; the second parameter of the function represents the index of the source element.
     */
    public select<TResult>(selector: Func2<TSource, number, TResult>): Enumerable<TResult>
    {
        return new SelectIterator<TSource, TResult>(this, selector);
    }

    /**
     * Projects each element of a sequence to an Enumerable<T> and flattens the resulting sequences into one sequence.
     * @param collectionSelector A transform function to apply to each element of the input sequence.
     */
    public selectMany<TResult>(collectionSelector: Func1<TSource, Iterable<TResult>>): Enumerable<TResult>;
    /**
     *
     * @param collectionSelector A transform function to apply to each element of the input sequence.
     * @param selector           A transform function to apply to each element of the intermediate sequence.
     */
    public selectMany<TCollection, TResult>(collectionSelector: Func1<TSource, Iterable<TCollection>>, selector:  Func2<TCollection, number, TResult>): Enumerable<TResult>;
    public selectMany<TCollection, TResult>(collectionSelector: Func1<TSource, Iterable<TCollection>>, selector?: Func2<TCollection, number, TResult>): Enumerable<TResult>
    {
        if (!selector)
        {
            selector = x => x as Object as TResult;
        }

        return new SelectManyIterator(this, collectionSelector, selector);
    }

    /**
     * Bypasses a specified number of elements in a sequence and then returns the remaining elements.
     * @param count The number of elements to skip before returning the remaining elements.
     */
    public skip(count: number): Enumerable<TSource>
    {
        return new SkipIterator(this, count);
    }

    /**
     * Bypasses elements in a sequence as long as a specified condition is true and then returns the remaining elements.
     * The element"s index is used in the logic of the predicate function.
     * @param predicate A function to test each source element for a condition; the second parameter of the function represents the index of the source element.
     */
    public skipWhile(predicate: Func2<TSource, number, boolean>): Enumerable<TSource>
    {
        return new SkipWhileIterator(this, predicate);
    }

    /**
     * The sequence to return elements from.
     * @param count The number of elements to return.
     */
    public take(count: number): Enumerable<TSource>
    {
        return new TakeIterator(this, count);
    }

    /**
     * Returns elements from a sequence as long as a specified condition is true. The element"s index is used in the logic of the predicate function.
     * @param predicate A function to test each source element for a condition; the second parameter of the function represents the index of the source element.
     */
    public takeWhile(predicate: Func2<TSource, number, boolean>): Enumerable<TSource>
    {
        return new TakeWhileIterator(this, predicate);
    }

    /** Creates an array from a Enumerable<T>. */
    public toArray(): Array<TSource>
    {
        let values: Array<TSource> = [];

        for (let element of this)
        {
            values.push(element);
        }

        return values;
    }

    /**
     * Filters a sequence of values based on a predicate.
     * @param predicate A function to test each element for a condition.
     */
    public where(predicate: Func1<TSource, boolean>): Enumerable<TSource>
    {
        return new WhereIterator(this, predicate);
    }

    /**
     * Applies a specified function to the corresponding elements of two sequences, producing a sequence of the results.
     * @param second   The second sequence to merge.
     * @param selector A function that specifies how to merge the elements from the two sequences.
     */
    public zip<TSecond, TResult>(second: Iterable<TSecond>, selector: Func3<TSource, TSecond, number, TResult>): Enumerable<TResult>
    {
        return new ZipIterator(this, second, selector);
    }
}

abstract class OrderedEnumerable<TSource> extends Enumerable<TSource>
{
    /**
     * Performs a subsequent ordering of the elements in a sequence in ascending order.
     * @param keySelector A function to extract a key from an element.
     */
    public thenBy<TKey>(keySelector: Func1<TSource, TKey>): Enumerable<TSource>;
    /**
     * Performs a subsequent ordering of the elements in a sequence in ascending order.
     * @param keySelector A function to extract a key from an element.
     * @param comparer    A function to compare keys.
     */
    public thenBy<TKey>(keySelector: Func1<TSource, TKey>, comparer: Func2<TKey, TKey, number>): Enumerable<TSource>;
    public thenBy<TKey>(keySelector: Func1<TSource, TKey>, comparer?: Func2<TKey, TKey, number>): Enumerable<TSource>
    {
        comparer = comparer || Comparer.default;
        return new ThenByIterator(this, keySelector, false, comparer);
    }

    /**
     * Performs a subsequent ordering of the elements in a sequence in descending order.
     * @param keySelector A function to extract a key from an element.
     */
    public thenByDescending<TKey>(keySelector: Func1<TSource, TKey>): Enumerable<TSource>;
    /**
     * Performs a subsequent ordering of the elements in a sequence in descending order.
     * @param keySelector A function to extract a key from an element.
     * @param comparer    A function to compare keys.
     */
    public thenByDescending<TKey>(keySelector: Func1<TSource, TKey>, comparer: Func2<TKey, TKey, number>): Enumerable<TSource>;
    public thenByDescending<TKey>(keySelector: Func1<TSource, TKey>, comparer?: Func2<TKey, TKey, number>): Enumerable<TSource>
    {
        comparer = comparer || Comparer.default;
        return new ThenByIterator(this, keySelector, true, comparer);
    }
}

class Comparer
{
    public static default<TKey>(left: TKey, right: TKey): number
    {
        if (left > right)
        {
            return 1;
        }
        else if (left < right)
        {
            return -1;
        }

        return 0;
    }
}

class DefaultIfEmptyIterator<TSource> extends Enumerable<TSource>
{
    public [Symbol.iterator]: () => Iterator<TSource>;

    public constructor(source: Iterable<TSource>, defaultValue: TSource)
    {
        super();
        this[Symbol.iterator] = function*()
        {
            let index = 0;
            for (const element of source)
            {
                index++;
                yield element;
            }

            if (index == 0)
            {
                yield defaultValue;
            }
        };
    }
}

class EnumerableIterator<TSource> extends Enumerable<TSource>
{
    public [Symbol.iterator]: () => Iterator<TSource>;

    public constructor(source: Iterable<TSource>)
    {
        super();
        this[Symbol.iterator] = function*()
        {
            for (const element of source)
            {
                yield element;
            }
        };
    }
}

class EnumerableSorter<TElement, TKey>
{
    private comparer:    Func2<TKey, TKey, number>;
    private descending:  boolean;
    private keys:        Array<TKey>;
    private keySelector: Func1<TElement, TKey>;
    private next:        Nullable<EnumerableSorter<TElement, TKey>>;

    public constructor(keySelector: Func1<TElement, TKey>, descending: boolean, comparer: Func2<TKey, TKey, number>, next: Nullable<EnumerableSorter<TElement, TKey>>)
    {
        this.comparer    = comparer;
        this.descending  = descending;
        this.keySelector = keySelector;
        this.next        = next;

        this.keys = [];
    }

    private compareKeys(left: number, right: number): number
    {
        let order = this.comparer(this.keys[left], this.keys[right]);

        if (order == 0)
        {
            if (this.next)
            {
                return this.next.compareKeys(left, right);
            }

            return order;
        }

        if (this.descending)
        {
            return -order;
        }

        return order;
    }

    private computeKeys(elements: Array<TElement>): void
    {
        this.keys = elements.map(x => this.keySelector(x));

        if (this.next)
        {
            this.next.computeKeys(elements);
        }
    }

    private merge(left: Array<number>, right: Array<number>): Array<number>
    {
        let buffer: Array<number> = [];

        let leftIndex  = 0;
        let rightIndex = 0;

        while (leftIndex < left.length && rightIndex < right.length)
        {
            if (this.compareKeys(left[leftIndex], right[rightIndex]) < 0)
            {
                buffer.push(left[leftIndex]);
                leftIndex++;
            }
            else
            {
                buffer.push(right[rightIndex]);
                rightIndex++;
            }
        }

        while (leftIndex < left.length)
        {
            buffer.push(left[leftIndex]);
            leftIndex++;
        }

        while (rightIndex < right.length)
        {
            buffer.push(right[rightIndex]);
            rightIndex++;
        }

        return buffer;
    }

    private mergeSort(source: Array<number>): Array<number>
    {
        if (source.length > 1)
        {
            let middle = Math.floor(source.length / 2);

            let left  = source.slice(0, middle);
            let right = source.slice(middle);

            left  = this.mergeSort(left);
            right = this.mergeSort(right);

            return this.merge(left, right);
        }

        return source;
    }

    public sort(elements: Array<TElement>): Array<number>
    {
        this.computeKeys(elements);
        return this.mergeSort(this.keys.map((value, index) => index));
    }
}

class OrderByIterator<TSource, TKey> extends OrderedEnumerable<TSource>
{
    private _parentSorter: Nullable<EnumerableSorter<TSource, TKey>>;
    public get parentSorter(): Nullable<EnumerableSorter<TSource, TKey>>
    {
        return this._parentSorter;
    }

    public set parentSorter(value: Nullable<EnumerableSorter<TSource, TKey>>)
    {
        this._parentSorter = value;
    }

    public [Symbol.iterator]: () => Iterator<TSource>;

    public constructor(source: Iterable<TSource>, keySelector: Func1<TSource, TKey>, descending: boolean, comparer: Func2<TKey, TKey, number>)
    {
        super();

        this[Symbol.iterator] = function* ()
        {
            let buffer = Array.from(source);

            let indexes = new EnumerableSorter(keySelector, descending, comparer, this.parentSorter).sort(buffer);

            for (let index of indexes)
            {
                yield buffer[index];
            }
        };
    }
}

class SelectIterator<TSource, TResult> extends Enumerable<TResult>
{
    public [Symbol.iterator]: () => Iterator<TResult>;

    public constructor(source: Iterable<TSource>, selector: Func2<TSource, number, TResult>)
    {
        super();
        this[Symbol.iterator] = function* ()
        {
            let index = 0;
            for (const element of source)
            {
                yield selector(element, index++);
            }
        };
    }
}

class SelectManyIterator<TSource, TCollection, TResult> extends Enumerable<TResult>
{
    public [Symbol.iterator]: () => Iterator<TResult>;

    public constructor(source: Iterable<TSource>, iterableSelector: Func1<TSource, Iterable<TCollection>>, selector: Func2<TCollection, number, TResult>)
    {
        super();
        this[Symbol.iterator] = function* ()
        {
            let index = 0;
            for (const element of source)
            {
                for (const iteration of iterableSelector(element))
                {
                    yield selector(iteration, index);
                    index++;
                }
            }
        };
    }
}

class SkipIterator<TSource> extends Enumerable<TSource>
{
    public [Symbol.iterator]: () => Iterator<TSource>;

    public constructor(source: Iterable<TSource>, count: number)
    {
        super();

        let index = 1;

        this[Symbol.iterator] = function* ()
        {
            for (const element of source)
            {
                if (index > count)
                {
                    yield element;
                }

                index++;
            }
        };
    }
}

class SkipWhileIterator<TSource> extends Enumerable<TSource>
{
    public [Symbol.iterator]: () => Iterator<TSource>;

    public constructor(source: Iterable<TSource>, predicate: Func2<TSource, number, boolean>)
    {
        super();

        let index = 0;
        let skip  = true;

        this[Symbol.iterator] = function* ()
        {
            for (const element of source)
            {
                if (skip)
                {
                    skip = predicate(element, index);
                }

                if (!skip)
                {
                    yield element;
                }

                index++;
            }
        };
    }
}

class TakeIterator<TSource> extends Enumerable<TSource>
{
    public [Symbol.iterator]: () => Iterator<TSource>;

    public constructor(source: Iterable<TSource>, count: number)
    {
        super();

        let index = 0;

        this[Symbol.iterator] = function* ()
        {
            for (const element of source)
            {
                if (index < count)
                {
                    yield element;
                }
                else
                {
                    break;
                }

                index++;
            }
        };
    }
}

class TakeWhileIterator<TSource> extends Enumerable<TSource>
{
    public [Symbol.iterator]: () => Iterator<TSource>;

    public constructor(source: Iterable<TSource>, predicate: Func2<TSource, number, boolean>)
    {
        super();

        let index = 0;

        this[Symbol.iterator] = function* ()
        {
            for (const element of source)
            {
                if (predicate(element, index))
                {
                    yield element;
                }
                else
                {
                    break;
                }

                index++;
            }
        };
    }
}

class ThenByIterator<TSource, TKey> extends OrderedEnumerable<TSource>
{
    public [Symbol.iterator]: () => Iterator<TSource>;

    public constructor(source: Iterable<TSource>, keySelector: Func1<TSource, TKey>, descending: boolean, comparer: Func2<TKey, TKey, number>)
    {
        super();

        if (source instanceof OrderByIterator)
        {
            source.parentSorter = new EnumerableSorter(keySelector, descending, comparer, null);
            this[Symbol.iterator] = function* ()
            {
                for (let element of source)
                {
                    yield element;
                }
            };
        }
        else
        {
            throw new TypeError("Iterable is not an valid instance of OrderByIterator");
        }
    }
}

class WhereIterator<TSource> extends Enumerable<TSource>
{
    public [Symbol.iterator]: () => Iterator<TSource>;

    public constructor(source: Iterable<TSource>, predicate: Func1<TSource, boolean>)
    {
        super();
        this[Symbol.iterator] = function*()
        {
            for (const element of source)
            {
                if (predicate(element))
                {
                    yield element;
                }
            }
        };
    }
}

class ZipIterator<TSource, TSecond, TResult> extends Enumerable<TResult>
{
    public [Symbol.iterator]: () => Iterator<TResult>;

    public constructor(source: Iterable<TSource>, collection: Iterable<TSecond>, selector: Func3<TSource, TSecond, number, TResult>)
    {
        super();
        this[Symbol.iterator] = function* ()
        {
            let index = 0;
            for (const element of source)
            {
                yield selector(element, collection[index], index);
                index++;
            }
        };
    }
}