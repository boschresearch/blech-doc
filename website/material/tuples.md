## Tuples

If we introduce a tuple type that has value semantics - i.e. allows assignment, we could
make structs and and arrays non-value types which do not allow whole composite assignment.

This clears the strange behaviour that a struct with let fields cannot be assigned as a whole.
And it introduces a structure - the tuple - that is either immutable or mutable as a whole.

This is similar to Rust where only simple types and tuples of simple types can be assigned.

```blech

var tup: (int32, bool) = {42, true}

if tup._2 then
    tup._1 = tup._1 + 1
end

let otherTup: (int32, bool) = {-42, false}

tup = otherTup
```

With built-in tuples we get a simple composite value type.
We would restrict tuples to only hold value types - simple types and other tuples.
Instead of accessing tuples with build in field names: `_1`, `_2`, an so on, we could also allow named tuples like in F#.


Structures and arrays generally would become reference types which
- do not allow assigment as a whole composite, and
- which cannot be used with `prev`.

Structures would be the only types that are allowed to contain references to other memory locations.



