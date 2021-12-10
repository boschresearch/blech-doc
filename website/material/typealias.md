
# Export inference and type checking for type aliases


## Type checking type aliases

We should be careful not to create transitive type alias declarations and transitive abstract type declarations.

### No type alias for a type alias

It should not be allowed to define a type alias to another type alias

```blech

struct T
    var b: bool 
end

typealias AT = T // this is allowed

typealias AAT = AT // this should create a type check error: alias of alias
```

Especially, across module boundaries this is complicated to understand. 

This rule eliminates transitive alias relationships.

### No type alias for an abstract type

It should not be allowed to define a type alias for an abstract type.

Assume a module in file "abstracttype.blc", that exports an abstract type.

```blech
// in file "abstracttype.blc"
module exposes init

struct T
    var b: bool
end

function init () returns T
    return { b = true }
end
```

If imported, we could be tempted to define a type alias for the abstract type, which again is exported as an abstract type.

```blech
import at "abstracttype.blc"

module exposes create

typealias AliasT = at.T // this should create a type check error: alias of abstract type

function create() returns AliasT
    return at.init()
end
```

We would create and abstract type from an abstract type.

Especially, across module boundaries this is complicated to understand. 

This rule eliminates transitive abstract type relationships.

Concerning this aspect an abstract type is very similar to a type alias.


## Export checking type aliases

With the above rules we can easily determine the correct annotation for abstract types:  
`@[StructType]`,  `@[ArrayType]`, or `@[SimpleType]`
Without this rule we would have to track the *original* type for a type alias transitively across module boundaries.

### Check accessibility for type aliases 

The following code should be rejected by the export inference

```blech

module exposes init, T

struct S
    var b: bool
end

typealias T = S   // this should create an export inference error: S is less accessible than T

function init() returns T
    return { b = true }
end
```

The signature would have the following form:

```blech
signature 

@[StructType]
type S

typealias T = S

function init() returns T
```

This signature cannot be typechecked, according to the rule: No type alias for abstract types.

The export inference can detect this because: `T` is more accessible than `S` and would reject the above module.



