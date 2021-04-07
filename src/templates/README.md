# Templates

## Overview

Here are stored [**Handlebars**](https://handlebarsjs.com/) templates. Handlebars library is used for simple
constructing telegram messages layout or something.

## Usage

You can get compiled template using `utils/loadTemplate.ts` function.

### Example

##### example_template.hbs

```handlebars
<i>Hello from tempalte</i>
<b>{{name}}</b>
```

##### main.ts

```typescript
import loadTemplate from "utils/loadTemplate";

async function main(): Promise<void> {
    const template: HandlebarsTemplateDelegate = await loadTemplate("example_template");
    const context = {
        name: "John",
    };
    print(template(context));
}
```

##### RESULT

```handlebars
<i>Hello from tempalte</i>
<b>John</b>
```
