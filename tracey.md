
# helpful hints for updating this extension

```sh
# basic lint file(s)
deno lint -c $HOME/dev/eslint/deno.json  src/run-on-save.ts

# change version in package.json
npm i

# publish to vscode marketplace
vsce package

vsce publish
```
