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

import { DeepSet } from '../src/DeepSet';
import * as _ from 'lodash';

type TestValueType = number | BigInt | string | object | Symbol | any[] ;

const TEST_ARRAY_SIZE = 5;
const TEST_DATA : Array<[string, TestValueType[]]> = [
  ['string', ['a','b','c','d','e']],
  ['number', [1,2,3,4,5]],
  ['object', [
    {n: 1, s: '1', o: { a: [1,2,3]},b:true}, 
    {n: 1, s: '1', o: { a: [1,2,3]},b:false}, 
    {n: 1, s: '1', o: { a: [1,2,3]}}, 
    {n: 2, s: '2', o: { a: [1,2,3]},b:true},
    {n: 2, s: 'two', o: { a: [1,2,3]},b:true}
  ]],
  ['array', [[1,2,3,4],[4,5,6,7],[7,8,9,10],[1,2,3],[1,2]]],
  ['symbol', [Symbol('a'), Symbol('b'), Symbol('c'), Symbol('d'), Symbol('e')]],
  ['BigInt', [1n, 2n, 3n, 4n, 5n]],
  // mixed set members should not occur in TypeScript because DeepSet<T> is a generic class
  // however, when the same DeepSet class is used from JavaScript there might be mixed types
  ['mixed1', [1, 'one', [1], {one: 1}, 1n]],
  ['mixed2', ['a', Symbol('a'), ['a'], {a: 'a'}, 1]]

  // TODO: decide if there is any point in testing boolean, undefined, nullnot bothering testing boolean 
  // since the set could only be one of [true], [false], [true,false] I'm not sure there is a point
  // or any use case for aw set of booleans.  However, they might be considered for the 'mixed' sets.
]

describe.each(TEST_DATA)('DeepSet for %s type', (type, _values: TestValueType[]) => {
  let deepSet: DeepSet<typeof _values[0]>;
  const values = [..._values];

  // check preconditions for the test values array before running any of the tests
  beforeAll(() => {
    // the tests _values array must contain exactly TEST_ARRAY_SIZE elements
    // note: this value can be changed along with the if the tests require it, but all the arrays must share the same length
    if (_values.length !== TEST_ARRAY_SIZE)
      throw new Error(`Test precondition failed: the test _values array must have exactly ${TEST_ARRAY_SIZE} elements`);

    // the test _values array can not contain null or undefined elements
    if (_values.some(v => v===null || v===undefined)) {
      throw new Error('Test precondition failed: _values array must not have any null or undefined elements')
    }

    // all elements of the array must be unique for the tests to work
    let duplicates = _.differenceWith(_values, _.uniqWith(_values, _.isEqual), _.isEqual);
    if (duplicates.length > 0) {
      throw new Error('Test precondition failed: _values array must not have any duplicates');
    }
  });

  // create a fresh empty deepSet before each test function
  beforeEach(() => {
    deepSet = new DeepSet<typeof _values[0]>();
  });

  describe(`Test with ${test} data`, () => {
    test('add-one', () => {
      expect(deepSet.size).toBe(0);
      deepSet.add(values[0]!);
      expect(deepSet.size).toBe(1);
      deepSet.add(values[1]!);
      expect(deepSet.size).toBe(2);
      deepSet.add(values[0]!);
      expect(deepSet.size).toBe(2)
      deepSet.add(values[1]!);
      expect(deepSet.size).toBe(2)
      expect(deepSet.has(values[0]!)).toBe(true);
      expect(deepSet.has(values[1]!)).toBe(true);
      expect(deepSet.has(values[2]!)).toBe(false);
    });

    test('add-many', () => {
      expect(deepSet.size).toBe(0);
      deepSet.add(...values);
      expect(deepSet.size).toBe(values.length)
    });

    test('has', () => {
      deepSet.add(values[0]!);
      deepSet.add(values[1]!);
      expect(deepSet.size).toBe(2);
      expect(deepSet.has(values[0]!)).toBe(true);
      expect(deepSet.has(values[1]!)).toBe(true);
      expect(deepSet.has(values[2]!)).toBe(false);
    });
  
    test('delete', () => {
      deepSet.add(values[0]!);
      deepSet.add(values[1]!);
      deepSet.add(values[2]!);
      expect(deepSet.size).toBe(3);
      deepSet.delete(values[1]!);
      expect(deepSet.size).toBe(2);
      deepSet.delete(values[2]!);
      expect(deepSet.size).toBe(1);
      expect(deepSet.has(values[0]!)).toBe(true);
    });
  
    test('clear', () => {
      deepSet.add(values[0]!);
      deepSet.add(values[1]!);
      deepSet.add(values[2]!);
      expect(deepSet.size).toBe(3);
      deepSet.clear();
      expect(deepSet.size).toBe(0);    
    });
  
    test('size', () => {
      expect(deepSet.size).toBe(0);
      deepSet.add(values[0]!);
      expect(deepSet.size).toBe(1);
      deepSet.add(values[1]!);
      expect(deepSet.size).toBe(2);
      deepSet.add(values[2]!);
      expect(deepSet.size).toBe(3);
    });
  
    // this test forEach() and also confirms order is retained in the DeepSet
    test('forEach', () => {
      deepSet.add(values[0]!);
      deepSet.add(values[1]!);
      deepSet.add(values[2]!);
      deepSet.forEach((v,i) => { 
        expect(_.isEqual(v,values[i])).toBe(true)
      });
    });
  
    test('clone', () => {
      deepSet.add(values[0]!)
      deepSet.add(values[1]!)
      deepSet.add(values[2]!)
  
      deepSet.add(values)
      let deepSet2 = deepSet.clone();
      expect(_.isEqual(deepSet,deepSet2))
    });

    test('iterator', () => {
      deepSet.add(...values);
      const deepSet2 = new DeepSet(...values);
      for (const v of deepSet) {
        expect(deepSet2.has(v)).toBe(true);
        deepSet2.delete(v);
        console.log(v);
      }
      expect(deepSet2.size).toBe(0);
    })

    test('values', () => {
      deepSet.add(...values);
      const deepSet2 = new DeepSet(...values);
      let valueArray = deepSet.values();
      for (const v of valueArray) {
        expect(deepSet2.has(v)).toBe(true);
        deepSet2.delete(v);
        console.log(v);
      }
      expect(deepSet2.size).toBe(0);
    })

    test('intersection', () => {
      deepSet.add(...values); // all values
      let deepSet2 = new DeepSet<TestValueType>(...values)
      let emptyDeepSet = new DeepSet<TestValueType>()

      expect(deepSet).toEqual(deepSet2);
      expect(deepSet.intersection(deepSet2)).toEqual(deepSet);
      expect(deepSet.intersection(emptyDeepSet).size).toBe(0);

      deepSet2.clear();
      deepSet2.add(...values.slice(0,2));
      expect(deepSet2.size).toBe(2);
      expect(deepSet.intersection(deepSet2).size).toBe(2);
    })

    test('union', () => {
      deepSet.add(...values); // all values
      let deepSet2 = new DeepSet<TestValueType>(...values)
      let emptyDeepSet = new DeepSet<TestValueType>()

      expect(deepSet).toEqual(deepSet2);
      expect(deepSet.union(deepSet2)).toEqual(deepSet);
      expect(deepSet.union(emptyDeepSet)).toEqual(deepSet);

      deepSet2.clear();
      deepSet2.add(...values.slice(0,3));
      let deepSet3 = new DeepSet<TestValueType>(...values.slice(3));
      expect(deepSet2.union(deepSet3)).toEqual(deepSet);

      deepSet2.delete(values[0]!);
      deepSet3.delete(values[4]!);
      expect(deepSet2.union(deepSet3).size).toBe(values.length - 2)
    });

    test('difference', () => {
      // TODO implement test
    });

    test('symmetricDifference', () => {
      // TODO implement test      
    });

    // TODO implement test
    test('isSubSetOf', () => {
      // TODO implement test
    });

    test('isSuperSetOf', () => {
      // TODO implement test
    });

    test ('isDisjointFrom', () => {
      // TODO implement test      
    });

    test ('forEach', () => {
      // TODO implement test      
    });

    test ('map', () => {
      // TODO implement test
    })

    test ('filter', () => {
      // TODO implement test
    })


    // Add more tests for other functions here...
  });
});
