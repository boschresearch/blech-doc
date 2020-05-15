# String

Blech has no built-in string type, but a module `String` that defines a type `string` and operations on strings, which are essentially, a safe variant of the standard C string functions.

# String types

Strings in C are null-terminated arrays of char. 
C arrays are notoriously dangerous, because C arrays do not track their size.
Furthermore C strings need a terminating `\0` because they do not track their length. 

Blech tracks the length of arrays at compile-time, and the lenght and the capacity of slices at run-time.
In order to get rid of null-terminated arrays of char, Blech uses slices of char to represent strings.

The type `string` is defined as follows

```blech
signature String exposes string

ref typealias string = []char
```


# String literals

A string literal is read-only array of char with the string length as its compile-time size.
String literals represent a memory-location in read-only memory. This property defines their usage.

```blech
var buffer: [5]char = {'h', 'e', 'l', 'l', 'o'}
var buffer2: [5]char = "hello" 
var buffer3: [100]char = "hello"
let ref romBuffer: [5]char = "hello"   // reference taken implicitly
var ref romBuffer2: [5]char = "hello"  // type error, "hello" is read-only
let ref romBuffer:[100]char = "hello"  // type error, wrong size
```

The initialiser `"hello"` is just a simplified way to do initialisation of a character array.
A string literal can also be used for partial initialisation. 
A string literal can also be aliased by a reference to a read-only array of char.
It also carries its compile-time size, which is `5` for `"hello"`.

Additionally, a string literal is also an initializer for a slice of char, i.e. a `string`.

```blech
let s0: []char = "hello"
let s1: string = "hello"      // length '5', capacity '5', reference to ROM
let s2 = "hello"             // Error: unknown type for s2 
var s3: string = "hello"     // Error: referenced array is read-only
```

## Slicing

In order to initialise a `string` variable, a slice of char is needed.

Slicing an array of char returns a `string`, which is an alias for `[]char`.
```blech
var buffer: [100]char
var str: string = [0,0]buffer     // Empty string, first buffer[0], length 0, capacity 100 == #buffer
var str2: string = [0]buffer      // Empty string, first buffer[0], length 0, capacity 100 == #buffer
var str3: string = [42, 42]buffer // Empty string, first buffer[42], length 0, capacity 100-42 
var str4: string = [42, 44]buffer // first buffer[42], length 44-42, capacity 100-42
var str5: string = []buffer       // first buffer[0], length 100 == #buffer, capacity 100  
```

Slicing a string also returns a string
```blech
var str50: string = [9, 50]buffer  // Empty string, first buffer[9], length 50, capacity 100-9 == #buffer - 9
var str1: string = [0, 10]str50    // Empty string, first buffer[9], length 10, capacity 100-9 == ##str50 - 0
var str2: string = [10]str50       // Empty string, first buffer[9], length 10, capacity 100-9 == ##str50
var str3: string = [4, 4]str50     // Empty string, first buffer[9+4], length 4, capacity 100-9-4 == ##str50 - 4 
var str4: string = [0, 0]str50     // first buffer[9], length 0, capacity 100-9 = ##str50
var str5: string = []str50         // first buffer[9], length 0, capacity 100-9  
```

## Accessing single characters

Indexing is defined for arrays and slices.
Out-of-range accesses either panic in debug code and are mitigated in release code or throw for recoverable indexing `mem[idx]?`

```blech
var buffer:[100]char
var string50: []char = [0,50]buffer
var string100: []char = [100]buffer  

// all of the following are shared
buffer[42]
string50[42]
string100[42]

// access is restricted by length
buffer[72]    // ok
string50[72]   // out-of-bounds, panic or slice50[49]
string100[72] // ok

buffer[72]?    // ok
slice50[72]?   // throws
string100[72]? // ok
``` 

If an array, or a slice is writeable, indexing also allows to change a single character. This also possible for a `string`.
```blech
do
    string50[42] = 'a'
    string50[72] = 'a'  // panic, or do nothing

    string50[72]? = 'a' // throws
end
```

## Accessing the underlying string buffer

There is an operator to access underlying array.
In order to assign its contents where an array is expected.
The safe behaviour is, to truncate the underlying array.

```blech

var a: [5]char
var b: [14]char

let s:[] = "hello world!"
var buffer: [10] char
var strBuff = [0]buffer // empty

do
    a = s[]   // a == "hello"
    b = s[]   // b == "hello world!\0\0"

    strBuf[] = a  // copy, len 5, cap 10, content "hello" 
    strBuf[] = b  // copy, len 10, cap 10, content "hello worl"  

```

The partial variant throws without truncating.
```blech
do
    a = helloWorld[]? // throws, a too small
    b = helloWorld[]? // ok, b = "hello world!\0\0"

    strBuf[]? = a  // ok
    strBuf[]? = b  // throws, strBuf capacity too small
end 




## Programming with strings

For programming with strings. Blech supplies a build-in module, that implements safe versions of the standard C string functions. Maybe, we should choose longer names?

```blech
signature String exposes string, cat, tryCat, str, cpy, tryCpy

ref typealias string = []char

prototype function cat (source: string) (destination: string)
prototype function tryCat ? (source: string) (destination: string) throws

prototype function str (str1: string, ref str2: string) returns shares str2 string

prototype function cpy (source: string) (dest: string)
prototype function tryCpy ? (source: string) (dest: string)

```

### Extracting and building strings as slices of char.

```blech
function firstWord(ref s: []char) returns shares s []char
    var len: usize = 0
    for let i: usize = 0, #s do
        if s[i] == ' ' then
            len = i
            break
        end
    end
    return [0, len]s
end
```

The following code uses built-in polymorphic functions defined for slices.
``` blech
signature Seq exposes remove, insert

prototype function remove{T: type} (pos: usize) (fromSeq: []T) returns T
prototype function insert{T: type} (pos: usize, elem: T) (intoSeq: []T)
```


```blech
import String

function firstWord(ref s: string) returns shares s string
    var len: usize = 0
    for let i: usize = 0, #s do
        if s[i] == ' ' then
            len = i
            break
        end
    end
    return [0, len]s
end

do 
    var buffer: [100]char
    var greetings: []char = [100]buffer
    String.cat("Hello World!")(greetings)
    let hello: []char = firstWord("Hello World!")
    String.cat(hello)(greetings)
    Seq.insert(#greetings, ' ')(greetings)
    String.cat("Blech")(greetings)
    Seq.insert(#greetings, '!')(greetings)
    
    println(greetings)   // Prints "Hello Blech!\n"
end
```

### Slices of strings

```blech
do
    let fourLines: [4][]char = {
        "These",
        "are",
        "four",
        "lines"
    }

    let twoLines: [][]char = [1,2]fourLines
end
```

### Interpolated strings


### `print` and `println`



