
# helpful hints for updating this extension

- https://marketplace.visualstudio.com/items?itemName=InternetArchive.coderunr-vscode
- https://code.visualstudio.com/api/working-with-extensions/publishing-extension


```sh
# basic lint file(s)
deno lint -c $HOME/dev/eslint/deno.json  src/run-on-save.ts

# change version in package.json
npm i

# publish to vscode marketplace
vsce package

vsce publish
```
