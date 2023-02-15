<h1 align="left">
    <img src="https://github.com/internetarchive/coderunr-vscode/raw/master/images/logo.png" width="86" height="32" alt="a save logo" />
    CodeRunr - VSCode Extension
</h1>

Deploy saved changes to websites -- _without_ git commits, pushes & full CI/CD.

Configure shell commands and related file patterns -- commands will be executed when matched files are saved.

## CodeRunr project
An admin sets up a CodeRunr Server on a VM that you can `ssh` into (there is also an alternate way to use a web page instead of `ssh` to track your files as they change).
- https://coderunr.com/
- https://github.com/internetarchive/coderunr

This extension will then make it so every file saved (that matches your configured file name patterns) will get copied up to the CodeRunr Server.  The server will run setup, optional build hooks and more, and give you a unique https:// url, per branch, to rapidly develop with.


- Configure this VSCode extension's Settings:
```json
// Change `example.com` to your `ssh`-able CodeRunr Server.
"CodeRunr.server": "example.com",
// Change this to your desired file regex pattern.
// Here any file's full path that matches either 'dev/' or 'petabox' will get sync-ed.
"CodeRunr.match": "dev/|petabox",
```

---

## Addional Customizations
You can also customize further and/or setup additional "run on save" arbitrary commands if you like.

Continue reading for more details.

## Features

You can specify status bar messages which will show before and after commands executing, such that they will tell you what's happening and not distrub you much:

![example](images/example.gif)

If you prefer running commands in vscode terminal, which keeps message colors and give more feedback details, change the `runIn` option to `terminal`.

![terminal](images/terminal.gif)

If you need to run VS Code's commands change `runIn` option to `vscode`


## Configuration

| Name                             | Description
| ---                              | ---
| `CodeRunr.statusMessageTimeout` | Specify the timeout millisecond after which the status bar message will hide, default value is `3000`, means 3 seconds.
| `CodeRunr.commands`             | Specify the array of shell commands to execute and related info, its child options as below.
| `CodeRunr.shell`                | Specify in which shell the commands are executed, defaults to the default vscode shell.


### Command Options

| Name                              | Description
| ---                               | ---
| `commands[].match`                | Specify a RegExp source to match file path. E.g.: `\\.scss$` can used to match scss files.
| `commands[].notMatch`             | Specify a RegExp source, the file that whole path match it will be excluded. E.g.: `[\\\\\\/]_[\\w-]+\\.scss$` can be used to exclude scss library files.
| `commands[].globMatch`            | Specify a glob expression, the file that whole path match it will be included. E.g.: `**/*.scss` will match all scss files. Here it didn't provide a `globNotMatch` pattern because glob expression can do so, please reference to https://github.com/isaacs/node-glob#glob-primer.
| `commands[].command`              | Specify the shell command to execute. You may include variable substitution like what to do in [VSCode Tasks](https://code.visualstudio.com/docs/editor/tasks#_variable-substitution).
| `commands[].forcePathSeparator`   | Force path separator in variable substitution to be `/`, `\\`, default is not specified.
| `commands[].async`                | All the commands with `async: false` will run in a sequence, means run next after previous completed. Default value is `true`. |
| `commands[].runningStatusMessage` | Specify the status bar message when the shell command begin to run, supports variable substitution too. Only works when `runIn=backend`.
| `commands[].finishStatusMessage`  | Specify the status bar message after the shell command finished executing, also supports variable substitution. Only works when `runIn=backend`.
| `commands[].workingDirectoryAsCWD`| Specify the vscode working directory as shell CWD (Current Working Directory). Only works when `runIn=backend`.
| `commands[].runIn`                | See list below.
 - `backend`: Run command silently and show messages in output channel, you can specify runningStatusMessage and finishStatusMessage to give you a little feekback. Choose this when you don't want to be disturbed.
 - `terminal`: Run command in vscode terminal, which keeps message colors. Choose this when you want to get feedback details.
 - `vscode`: Run vscode's command. Choose this if you want to execute vscode's own command or a command of a particular extension.


### Sample Configuration

```js
{
    "CodeRunr.statusMessageTimeout": 3000,
    "CodeRunr.commands": [
        {
            // Match scss files except names start with `_`.
            "match": ".*\\.scss$",
            "notMatch": "[\\\\\\/]_[^\\\\\\/]*\\.scss$",
            "command": "node-sass ${file} ${fileDirname}/${fileBasenameNoExtension}.css",
            "runIn": "backend",
            "runningStatusMessage": "Compiling ${fileBasename}",
            "finishStatusMessage": "${fileBasename} compiled"
        },
        {
            // Match less files except names start with `_`.
            "globMatch": "**/[^_]*.less",
            "command": "node-sass ${file} ${fileDirname}/${fileBasenameNoExtension}.css",
            "runIn": "terminal"
        },
        {
            "match": ".*\\.py$",
            "command": "python.runLinting",
            "runIn": "vscode"
        }
    ]
}
```


### Variable Substitution

Can be used in `command`, `runningStatusMessage`, `finishStatusMessage`, `globMatch`.

Note that if `forcePathSeparator` specified, separators in these variables will be replaced.

For more details please refer to [VSCode Tasks](https://code.visualstudio.com/docs/editor/tasks#_variable-substitution).

| Name                         | Description
| ---                          | ---
| `${workspaceFolder}`         | the path of the folder opened in VS Code.
| `${workspaceFolderBasename}` | the name of the folder opened in VS Code without any slashes (/).
| `${file}`                    | the path of current opened file.
| `${fileBasename}`            | the basename part of current opened file.
| `${fileBasenameNoExtension}` | the basename part without extension of current opened file.
| `${fileDirname}`             | the dirname path part of current opened file.
| `${fileDirnameRelative}`     | the relative dirname path part of current opened file.
| `${fileExtname}`             | the extension part of current opened file.
| `${fileRelative}`            | the shorter relative path from current vscode working directory.
| `${cwd}`                     | the task runner's current working directory on startup.
| `${env.Name}`                | reference environment variables.



## Commands

The following commands are exposed in the command palette

- `CodeRunr: Enable` - to enable the extension
- `CodeRunr: Disable` - to disable the extension


## References

This plugin inspired from these plugins:

- [vscode-run-on-save](https://github.com/pucelle/vscode-run-on-save)
- [vscode-runonsave](https://github.com/emeraldwalk/vscode-runonsave)
- [vscode-save-and-run](https://github.com/wk-j/vscode-save-and-run)


## License

MIT