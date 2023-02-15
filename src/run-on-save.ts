import {exec, ChildProcess} from 'child_process'
import * as vscode from 'vscode'
import {RawCommand, CommandProcessor, BackendCommand, TerminalCommand, VSCodeCommand} from './command-processor'
import {timeout} from './util'


export interface Configuration {
	statusMessageTimeout: number
	// deno-lint-ignore ban-types
	shell: String
	commands: RawCommand
}

export class RunOnSaveExtension {

	private context: vscode.ExtensionContext
	private config!: vscode.WorkspaceConfiguration
	private channel: vscode.OutputChannel = vscode.window.createOutputChannel('CodeRunr')
	private commandProcessor: CommandProcessor = new CommandProcessor()

	constructor(context: vscode.ExtensionContext) {
		this.context = context
		this.loadConfig()
		this.showEnablingChannelMessage()

		context.subscriptions.push(this.channel)
	}

	/** Load or reload configuration. */
	loadConfig() {
		this.config = vscode.workspace.getConfiguration('CodeRunr')

		const command_default: RawCommand = {

			"command": "cd '${workspaceFolder}'  &&  export CLONE=$(git config --get remote.origin.url)  BRANCH=$(git rev-parse --abbrev-ref HEAD)  && cat '${file}' | ssh " +
			this.config.get('server') +
			" 'export INCOMING=$(mktemp) VERBOSE=" + (this.config.get('verbose') ? '' : '1') +
			" CLONE='$CLONE' BRANCH='$BRANCH' \"FILE=${fileRelative}\"  &&  cat >| $INCOMING  &&  /coderunr/run.sh'  &&  echo SUCCESS",

			"match": this.config.get('match') || "",
			"runIn": this.config.get('runIn') || "",
			"async": this.config.get('async') || false,
			"notMatch": "",
			"globMatch": "",
			"runningStatusMessage": this.config.get('runningStatusMessage') || "",
			"finishStatusMessage": this.config.get('finishStatusMessage') || "",
		}

		let commands: RawCommand[] = this.config.get('commands') || []
		if (!commands.length)
			commands = [command_default]

		commands = commands.map((e) => Object.keys(e).length ? e : command_default)

		this.commandProcessor.setRawCommands(<RawCommand[]>commands)
	}

	private showEnablingChannelMessage () {
		const message = `CodeRunr is ${this.getEnabled() ? 'enabled' : 'disabled'}`
		this.showChannelMessage(message)
		this.showStatusMessage(message)
	}

	private showChannelMessage(message: string) {
		this.channel.appendLine(message)
	}

	getEnabled(): boolean {
		return !!this.context.globalState.get('enabled', true)
	}

	setEnabled(enabled: boolean) {
		this.context.globalState.update('enabled', enabled)
		this.showEnablingChannelMessage()
	}

	private showStatusMessage(message: string, timeout?: number) {
		timeout = timeout || this.config.get('statusMessageTimeout') || 3000
		const disposable = vscode.window.setStatusBarMessage(message, timeout)
		this.context.subscriptions.push(disposable)
	}

	/** Returns a promise it was resolved firstly and then save document. */
	async onWillSaveDocument(document: vscode.TextDocument) {
		if (!this.getEnabled()) {
			return
		}

		const commandsToRun = this.commandProcessor.prepareCommandsForFileBeforeSaving(document.fileName)
		if (commandsToRun.length > 0) {
			await this.runCommands(commandsToRun)
		}
	}

	async onDocumentSaved(document: vscode.TextDocument) {
		if (!this.getEnabled()) {
			return
		}

		const commandsToRun = this.commandProcessor.prepareCommandsForFileAfterSaving(document.fileName)
		if (commandsToRun.length > 0) {
			await this.runCommands(commandsToRun)
		}
	}

	private async runCommands(commands: (BackendCommand | TerminalCommand | VSCodeCommand)[]) {
		const promises: Promise<void>[] = []
		const syncCommands = commands.filter(c => !c.async)
		const asyncCommands = commands.filter(c => c.async)

		// Run commands in a parallel.
		for (const command of asyncCommands) {
			const promise = this.runACommand(command)
			promises.push(promise)
		}

		// Run commands in series.
		for (const command of syncCommands) {
			await this.runACommand(command)
		}

		await Promise.all(promises)
	}

	private runACommand(command: BackendCommand | TerminalCommand | VSCodeCommand): Promise<void> {
		if (command.runIn === 'backend') {
			return this.runBackendCommand(command)
		}
		else if (command.runIn === 'terminal') {
			return this.runTerminalCommand(command)
		}
		else {
			return this.runVSCodeCommand(command)
		}
	}

	private runBackendCommand(command: BackendCommand) {
		return new Promise((resolve) => {
			this.showChannelMessage(`Running "${command.command}"`)

			if (command.runningStatusMessage) {
				this.showStatusMessage(command.runningStatusMessage, command.statusMessageTimeout)
			}

			const child = this.execShellCommand(command.command, command.workingDirectoryAsCWD ?? true)
			child.stdout.on('data', data => this.channel.append(data.toString()))
			child.stderr.on('data', data => this.channel.append(data.toString()))

			child.on('exit', (e) => {
				if (e === 0 && command.finishStatusMessage) {
					this.showStatusMessage(command.finishStatusMessage, command.statusMessageTimeout)
				}

				if (e !== 0) {
					this.channel.show(true)
				}

				resolve()
			})
		}) as Promise<void>
	}

	private execShellCommand(command: string, workingDirectoryAsCWD: boolean): ChildProcess {
		const cwd = workingDirectoryAsCWD ? vscode.workspace.rootPath : undefined

		const shell = this.getShellPath()
		if (shell) {
			return exec(command, {
				shell,
				cwd,
			})
		}
		else {
			return exec(command, {
				cwd,
			})
		}
	}

	private getShellPath(): string | undefined {
		return this.config.get('shell') || undefined
	}

	private async runTerminalCommand(command: TerminalCommand) {
		const terminal = this.createTerminal()

		terminal.show()
		terminal.sendText(command.command)

		await timeout(100)
		await vscode.commands.executeCommand("workbench.action.focusActiveEditorGroup")
	}

	private createTerminal(): vscode.Terminal {
		const terminalName = 'CodeRunr'
		let terminal = vscode.window.terminals.find(terminal => terminal.name === terminalName)

		if (!terminal) {
			this.context.subscriptions.push(terminal = vscode.window.createTerminal(terminalName, this.getShellPath()))
		}

		return terminal
	}

	private async runVSCodeCommand(command: VSCodeCommand) {
		// finishStatusMessage have to be hooked to exit of command execution
		this.showChannelMessage(`Running "${command.command}"`)

		await vscode.commands.executeCommand(command.command)
	}
}