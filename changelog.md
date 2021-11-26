# Version 0.3.0
## New Features

### Word aliases for binary ariphmetic
```ts
not true;
not 0 + 1;
true and false;
false or true;
```
transforms to:
```ts
!true;
!(0 + 1);
true && false;
false || true;
```

### Symbol constructor property shortcuts
```ts
iterator = [0, 1, 2, 3, 4][@@iterator]();
while (not (next = iterator.next()).done) {
    __external_var("console").log(next.value);
}

/**
 * Prints to console:
 * 0
 * 1
 * 2
 * 3
 * 4
 */
```
transforms to:
```js
var $iterator, $next;
$iterator = [0, 1, 2, 3, 4][Symbol.iterator]();
while (!(($next = $iterator.next())).done) {
    console.log($next.value);
};
```

### include { symbol } from "module.tsk";
Same as normal `include "module.tsk";`, except only some symbols from module are exported.  
NOTE: WHOLE module is evaluated and NO functionality is stripped and ALL symbols (variables and functions) in module available to exported symbols!  
Exmaples:
```ts
include { symbol, function } from "module.tsk";
include { symbol as newSymbolName } from "module.tsk";
```

### Import expressions
```ts
// Import expression are same as in js
fs = await import("fs");
```

# Version 0.2.0
## Bug fixes
Removed Extra newline emitted on code block and try statment.  
Fixed throw statment from not being parsed.  

## New Features
This release provides 4 new features:
1. Null asserted property access
2. While statment
3. Do-While statment
4. Try-Catch-Else-Finally
### Null asserted property access 
```ts
// Main dfference between normal and 
// null asserted property access is 
// that variable is checked for null and
// undefined before access is performed
test = undefined;
test!.asdf;
test![console.log("test") /* never gets called */];
```
### While and Do-While statments
```ts
console = __external_var("console");
// These statments are same as in JS
i = 0;
while (i < 10) {
    console.log(i);
    i += 1;
}
i = 0;
do {
    console.log(i);
    i += 1;
} while (i < 10);
```

### Try-Catch-Else-Finally

#### Try-Catch
```ts
console = __external_var("console");
try {
    // Throw an example error
    throw "Something bad happend!";
} catch (e) {
    // Executed because error inside of try statment is thrown
    console.error(e); // prints "Something bad happend!" to console
}
```
Also note that exception indentifier can be omitted:

```ts
JSON = __external_var("JSON");
console = __external_var("console");
/**
 * This example is taken from MDN:
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/try...catch#the_exception_identifier 
 */
fn isValidJSON(text) {
    try {
        JSON.parse(text);
        return true;
    } catch {
        return false;
    }
}
console.log(isValidJSON('[0, 1, 2, 3, 4]')); // Prints true to console 
```

#### Try-Else
```ts
console = __external_var("console");
try {
    if (__external_var("typeof window") !== "object") {
        throw "Code executed not in browser";
    }
} else { 
    // This block is executed when no errors 
    // in try statment happend
    // Note, that order of catch, else and 
    // finally statments is not important.
    console.log("Code executed in browser");
} catch (e) {
    console.log(e);
}
```

```ts
console = __external_var("console");
fn test() {
    try {
        return "Hello from try block!";
    } else {
        return "Hello from else block!";
    }
}
console.log(test()); // Prints "Hello from else block!", 
// because else statment is executed even if try block returns, 
// and it returned a string containing hello from else block,
// same logic goes for finally block.
```

Also note that errors from else block is not handled by try statment's catch:
```ts
try {
    try {
        console.log("inner try");
    } catch (error) {
        // Never gets executed
        console.error("inner", error);
    } else {
        // Note that placing else block  
        // before catch doesn't change anything
        throw "Test"; 
    } finally {
        console.log("inner finally");
    }
} catch (error) {
    console.error("outer", error); // prints outer Test
}

```

#### Try-Finally

```ts
someResource = getResource();
try {
    someResource.doWork();
} finally {
    // Finally block statments are always executed, 
    // even if error occurred in try block 
    someResource.cleanup();
}
```

# Version 0.1.2
Keep statment parameters are now stricter:  
If arguments or this without property access found, diagnostic message reported with runtime error severity  
If symbol other than property access or variable reference found, an error thrown  
Now it is possible to do expressions with numbers and chain them (such as +, -, /, *, etc.)  

# Version 0.1.1
fixed bug with named function parameters after rest parameter

