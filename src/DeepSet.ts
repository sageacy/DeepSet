/* 
Copyright (c) 2024 Mark Ericson <mark@sageacy.com>

Licensed under the terms of the ISC license as follows:

Permission to use, copy, modify, and distribute this software for any
purpose with or without fee is hereby granted, provided that the above
copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
*/

import * as _ from 'lodash';
import hashIt from 'hash-it';

/**
 * DeepSet is a typed Set that allows storing and manipulating unique values.
 * The values must conform to the generic type 'T' defined when creating a new instance.
 * T can be any concrete type, primitive or object.
 * 
 * DeepSet supports the same operations as the native Set<T>, has, add, delete, 
 * but the DeepSeet implementation is based on a deep hash and deep equality
 * to improve performance from O(n) to approaching O(1) time performance. 
 * 
 * DeepSet implements common Set operators like union, intersection, difference and symmetric difference.
 * 
 * DeepSet also implements the common JavaScript "Higher-Order Functions" 
 * like map, filter, reduce, forEach, etc.
 */

type PredicateFn<T> = (value: T, index: number, set: DeepSet<T>) => boolean;
type ReduceFn<T, U> = (previousValue: U, currentValue: T, currentIndex: number, set: DeepSet<T>) => U;
type MapFn<T, U> = (value: T, index: number, set: DeepSet<T>) => U;
type FlatMapFn<T, U> = (value: T, index: number, set: DeepSet<T>) => U[];
type EachFn<T> = (value: T, value2: T, set: DeepSet<T>) => void;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export class DeepSet<T=any> implements Iterable<T> {
  private _map = new Map<number, T[]>();
  private _size = 0;

  // #region construct and clone DeepSet<T>

  /**
   * Creates a new DeepSet instance.
   * @param iterable An optional iterable object to initialize the DeepSet from.
   */
  constructor(...values: T[]) {
    this.add(...values);
  }

  /**
   * Creates a new DeepSet instance with the same values as the current instance.
   * @returns A new DeepSet instance.
   */
  clone(): DeepSet<T> {
    const newSet = new DeepSet<T>();
    newSet._map = _.cloneDeep(this._map);
    return newSet;
  }

  // #endregion

  // #region manage items in the DeepSet

  private _add (value: T) : void {
    const hash = hashIt(value);
    if (!this._map.has(hash))
      this._map.set(hash, []);
    let values = this._map.get(hash);
    if (! values?.some(v => _.isEqual(v, value))) {
      values?.push(value);
    }
  }

  /**
   * Adds one or more values to the DeepSet.
   * 
   * @param values The values to add to the DeepSet.
   * @returns The updated DeepSet instance.
   */
  add(...values: T[]): this {
    for (const value of values) {
      this._add(value);
    }
    return this;
  }

  /**
   * Checks if the DeepSet contains a specific value.
   * 
   * @param value - The value to check for.
   * @returns `true` if the DeepSet contains the value, `false` otherwise.
   */
  has(value: T): boolean {
    const hash = hashIt(value);
    const values = this._map.get(hash) || [];
    return values.some(v => _.isEqual(v, value));
  }

  /**
   * Deletes a value from the DeepSet.
   * 
   * @param value - The value to delete.
   * @returns `true` if the value was successfully deleted, `false` otherwise.
   */
  delete(value: T): boolean {
    const hash = hashIt(value);
    const values = this._map.get(hash) || [];
    const index = values.findIndex(v => _.isEqual(v, value));
    if (index !== -1) {
      values.splice(index, 1);
      if (values.length === 0) {
        this._map.delete(hash);
      } else {
        this._map.set(hash, values);
      }
      return true;
    }
    return false;
  }

  /**
   * Clears all the entries from the DeepSet.
   */
  clear(): void {
    this._map.clear();
  }

  /**
   * Gets the size of the DeepSet.
   * @returns The number of elements in the DeepSet.
   */
  get size(): number {
    let size = 0;
    for (const values of this._map.values()) {
      size += values.length;
    }
    return size;
  }
  // #endregion

  // #region DeepSet iterators
  /**
   * Returns an iterable iterator that contains all the values in the DeepSet.
   * The values are returned in the order they were added to the set.
   *
   * @returns An iterable iterator containing all the values in the DeepSet.
   */
  *values(): IterableIterator<T> {
    for (const values of this._map.values()) {
      for (const value of values) {
        yield value;
      }
    }
  }

  /**
   * Returns an iterable iterator that contains key-value pairs of the values in the DeepSet.
   * Each key-value pair consists of the value itself as both the key and the value.
   * The DeepMap will have different key and value
   * 
   * @returns An iterable iterator containing key-value pairs of the values in the DeepSet.
   */
  *entries(): IterableIterator<[T, T]> {
    for (const value of this.values()) {
      yield [value, value];
    }
  }

  /**
   * Returns an iterable iterator of the keys in the DeepSet.
   * Note: just like the native Set<T> keys() is an alias of values()
   * @returns An iterable iterator of the keys in the DeepSet.
   */
  *keys(): IterableIterator<T> {
    yield* this.values();
  }

  /**
   * Returns an iterator for the DeepSet.
   * Essentially the iterator of the DeepSet is an iterator for values() of the DeepSet
   * @returns An iterator that iterates over the values in the DeepSet.
   */
  *[Symbol.iterator](): IterableIterator<T> {
    for (const v of this.values()) {
        yield v;
    }
  }
  // #endregion

  // #region DeepSet set operations
  /**
   * Returns a new DeepSet that is the intersection of other DeepSet(s) and this DeepSet.
   * @param other - other DeepSet(s) (1 or more) for the intersection
   * @returns A new DeepSet that is the intersection of this set and the other DeepSet(s).
   */

  // TODO add support for multiple other sets
  // intersection(...otherSet: DeepSet<T>) {
  intersection(otherSet: DeepSet<T>): DeepSet<T> {
    const result = new DeepSet<T>();

    for (const value of this) {
      if (otherSet.has(value))
        result.add(value);
    }
    return result;
  }

  /**
   * Returns a new DeepSet that is the union of this DeepSet and the provided DeepSet(s) or array(s) of DeepSet(s).
   * The union of two sets is a set containing all distinct elements from both sets.
   *
   * @param other - The DeepSet(s) or array(s) of DeepSet(s) to perform the union with.
   * @returns A new DeepSet that is the union of this DeepSet and the provided DeepSet(s) or array(s) of DeepSet(s).
   */
  union(other: DeepSet<T> | Array<DeepSet<T>>): DeepSet<T> {
    const otherSets = Array.isArray(other) ? other : [other];
    const result = this.clone();
  
    otherSets.forEach(set => {
      for (const value of set.values()) {
        result.add(value);
      }
    });
    return result;
  }

  /**
   * Returns a new DeepSet that is the difference of this set and the given set.
   * @param other - The other set.
   * @returns A new DeepSet that is the difference of this set and the given set.
   */
  difference(other: DeepSet<T>): DeepSet<T> {
    const differenceSet = new DeepSet<T>();
    for (const value of this.values()) {
      if (!other.has(value)) {
        differenceSet.add(value);
      }
    }
    return differenceSet;
  }

  /**
   * symmetricDifference (aka disjunctive union) returns a new DeepSet that is 
   * contains the intersection less the union of the two sets.  In other words
   * it excludes items that exist in both sets.
   * 
   * @param other - The other set.
   * @returns A new DeepSet that is the symmetric difference of this set and the given set.
   */
  symmetricDifference(other: DeepSet<T>): DeepSet<T> {
    const symmetricDifferenceSet = new DeepSet<T>();
    for (const value of this.values()) {
      if (!other.has(value)) {
        symmetricDifferenceSet.add(value);
      }
    }
    for (const value of other.values()) {
      if (!this.has(value)) {
        symmetricDifferenceSet.add(value);
      }
    }
    return symmetricDifferenceSet;
  }

  /**
   * Checks if this set is a subset of the given set.
   * @param other - The other set.
   * @returns True if this set is a subset of the given set, false otherwise.
   */
  isSubsetOf(other: DeepSet<T>): boolean {
    for (const value of this.values()) {
      if (!other.has(value)) {
        return false;
      }
    }
    return true;
  }

  /**
   * Checks if this set is a superset of the given DeepSet.
   * @param other - The other DeepSet.
   * @returns True if this set is a superset of the given DeepSet, false otherwise.
   */
  isSupersetOf(other: DeepSet<T>): boolean {
    for (const item of other) {
      if (!this.has(item)) {
        return false;
      }
    }
    return true;
  }

  /**
   * Checks if this DeepSet is disjoint from another DeepSet.
   * In other words, if the union is empty, return true.
   * 
   * @param other - The other DeepSet to compare with.
   * @returns `true` if this DeepSet is disjoint from the other DeepSet, `false` otherwise.
   */
  isDisjointFrom(other: DeepSet<T>): boolean {
    return this.union(other).size === 0;
  }
  // #endregion

  // #region DeepSet Higher-Order Functions

  /**
   * Executes a callback once for each value in the DeepSet object, in insertion order.
   *
   * @param cb - A function that is called for each value in the DeepSet object.
   *                     It takes three arguments: the value, the value again, and the DeepSet object itself.
   * @param thisArg - An optional value to use as `this` when executing the callback function.
   */
  forEach(cb: (value: T, index: number, set: DeepSet<T>) => void, thisArg?: T): void {
    let index = 0;
    for (const value of this.values()) {
      cb.call(thisArg, value, index++, this);
    }
  }

  /**
   * Applies a mapping function to each value in the DeepSet and returns an array of the results.
   *
   * @param cb - A function that accepts up to three arguments: the current value being processed, the index of the current value, and the DeepSet object being traversed.
   * @template U - The type of the elements in the resulting array.
   * @returns An array containing the results of applying the mapping function to each value in the DeepSet.
   */
  map<U>(cb: MapFn<T, U>): U[] {
    let index = 0;
    const result: U[] = [];
    for (const value of this.values()) {
      result.push(cb(value, index++, this));
    }
    return result;
  }

  /**
   * Filters the elements of the DeepSet based on the callback predicate.
   * 
   * @param cb - A function that accepts up to three arguments. The filter method calls the callbackfn function one time for each element in the DeepSet.
   *                     - value: The current value being processed in the DeepSet.
   *                     - index: The index of the current value being processed in the DeepSet.
   *                     - set: The DeepSet object that the filter method was called upon.
   * @returns An array containing the elements that pass the test implemented by the provided callback function.
   */
  filter(cb: PredicateFn<T>): T[] {
    let index = 0;
    const result: T[] = [];
    for (const value of this.values()) {
      if (cb(value, index++, this)) {
        result.push(value);
      }
    }
    return result;
  }

  /**
   * Applies a reduce function callback against an accumulator and each value in the set to reduce it to a single value.
   *
   * @template U - The type of the reduced value.
   * @param predicate - A function that accepts an accumulator, a value, an index, and the set itself, and returns the updated accumulator.
   * @param initialValue - The initial value of the accumulator.
   * @returns The reduced value.
   */
  reduce<U>(cb: ReduceFn<T, U>, initialValue: U): U {
    let index = 0;
    let accumulator: U = initialValue;
    for (const value of this.values()) {
      accumulator = cb(accumulator, value, index++, this);
    }
    return accumulator;
  }

  /**
   * Checks if at least one element in the set satisfies the predicate.
   *
   * @param callbackfn - A function that accepts up to three arguments. The `some` method calls the `callbackfn` function one time for each element in the set until it finds one where `callbackfn` returns `true`.
   * @returns `true` if the callback function returns `true` for at least one element in the set, otherwise `false`.
   */
  some(cb: PredicateFn<T>): boolean {
    let index = 0;
    for (const value of this.values()) {
      if (cb(value, index++, this)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Checks if all elements in the set satisfy the predicate.
   *
   * @param cb - A predicate that accepts up to three arguments. The every method calls the callbackfn function one time for each element in the set until the callbackfn returns false or until the end of the set.
   * @returns `true` if the callback function returns a truthy value for every element in the set; otherwise, `false`.
   */
  every(cb: (value: T, index: number, set: DeepSet<T>) => boolean): boolean {
    let index = 0;
    for (const value of this.values()) {
      if (!cb(value, index++, this)) {
        return false;
      }
    }
    return true;
  }

  /**
   * Finds the first element in the DeepSet that satisfies the provided predicate.
   *
   * @param cb - The predicate to test each element of the DeepSet.
   * @returns The first element that satisfies the predicate function, or undefined if no element is found.
   */
  find(cb: PredicateFn<T>): T | undefined {
    let index = 0;
    for (const value of this.values()) {
      if (cb(value, index++, this)) {
        return value;
      }
    }
    return undefined;
  }

  /**
   * Applies a callback function to each element in the set and flattens the result into a new array.
   * The callback can return an array, resulting in an array of arrays inside the implementation.
   * However, flatMap actually returns a flattened version so a single shallow array of the U type.
   *
   * @typeparam U - The type of the elements in the resulting array.
   * @param cb - A function that accepts three arguments: the current value, the index, and the set itself.
   *             It must return an array of elements of type U.
   * @returns An array containing the flattened results of applying the callback function to each element in the set.
   */
  flatMap<U>(cb: FlatMapFn<T, U>): U[] {
    let index = 0;
    const result: U[] = [];
    for (const value of this.values()) {
      result.push(...cb(value, index++, this));
    }
    return result;
  }  
}
