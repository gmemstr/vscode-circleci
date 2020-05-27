import * as vscode from 'vscode';
import {parse} from 'yaml';

export function activate(context: vscode.ExtensionContext) {
	let cache:any = {};
	const paramProvider = vscode.languages.registerCompletionItemProvider(
		'yaml',
		{
			provideCompletionItems(document: vscode.TextDocument, position: vscode.Position) {
				// Find line prefix and strip out WIP line.
				let linePrefix = document.lineAt(position).text.substr(0, position.character);
				let lineNum = document.lineAt(position).lineNumber
				let text = document.getText().split("\n");
				text[lineNum] = "";

				let textProcessed = text.join("\n");
				let parsedDoc = {parameters: {}};
				try {
					parsedDoc = parse(textProcessed);
				} catch (e) {
					console.log("error parsing",e);
				}

				if (!linePrefix.endsWith('parameters.')) {
					return undefined;
				}

				if (parsedDoc == null || parsedDoc.parameters == null) {
					return undefined;
				}
				let completions = new Array();
				for (let [key, _] of Object.entries(parsedDoc.parameters)) {
					completions.push(new vscode.CompletionItem(key, vscode.CompletionItemKind.Variable));
				}
				cache = parsedDoc.parameters;
				return completions;
			},
			resolveCompletionItem(item: vscode.CompletionItem, token: vscode.CancellationToken): vscode.ProviderResult<vscode.CompletionItem> {
				let completionItem =  new vscode.CompletionItem(item.label, item.kind);
				let cacheItem: any = cache[item.label];
				let type: string = cacheItem.type;
				let defaultValue: string = "none";
				if (cacheItem.default !== null) {
					if (cacheItem.default === "") { defaultValue = '""' } 
					else {
						defaultValue = cacheItem.default;
					}
				}
				completionItem.detail = type +  " (" + defaultValue + ")";
				return completionItem;
			}
		},
		'.' // triggered whenever a '.' is being typed
	);

	context.subscriptions.push(paramProvider);
}