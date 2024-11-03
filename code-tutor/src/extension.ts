import * as vscode from 'vscode';
import { BASE_PROMPT, EXERCISES_PROMPT, MODEL_SELECTOR, MAX_TOKENS, TOKEN_SIZE } from './constants';
import { trimHistoryIfNeeded } from './utils';

// Store conversation history at module level
let conversationHistory: vscode.LanguageModelChatMessage[] = [];

// define a chat handler
const handler: vscode.ChatRequestHandler = async (
  request: vscode.ChatRequest,
  context: vscode.ChatContext,
  stream: vscode.ChatResponseStream,
  token: vscode.CancellationToken
) => {
    try {
      if (request.prompt === '') {
        stream.markdown('Please provide a prompt');
        return;
      }
      // initialize the prompt and model
      let prompt = BASE_PROMPT;

      if (request.command === 'exercise') {
        prompt = EXERCISES_PROMPT;
      }
      
      // Use default model or let user select one
      const selectedModel = request.model || (await vscode.lm.selectChatModels(MODEL_SELECTOR))[0];
      if (!selectedModel) {
        throw new Error('No suitable model found');
      }

      // Initialize or reset history if this is a new conversation
      if (!context.history?.length) {
        conversationHistory = [vscode.LanguageModelChatMessage.User(prompt)];
      }

      // Add user's new message to history
      const userMessage = vscode.LanguageModelChatMessage.User(request.prompt);
      conversationHistory.push(userMessage);

      // Trim history if needed
      conversationHistory = trimHistoryIfNeeded(conversationHistory, request.prompt, prompt);

      // Send request with full conversation history
      const chatResponse = await selectedModel.sendRequest(conversationHistory, {}, token);

      // Add assistant's response to history and stream it
      let assistantResponse = '';
      for await (const fragment of chatResponse.text) {
        assistantResponse += fragment;
        stream.markdown(fragment);
      }
      conversationHistory.push(vscode.LanguageModelChatMessage.Assistant(assistantResponse));
    } catch (error) {
      stream.markdown(`Chat error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
};

// This method is called when your extension is activated
export function activate(context: vscode.ExtensionContext) {
  // create participant
  const tutor = vscode.chat.createChatParticipant('chat-tutorial.code-tutor', handler);
  // add icon to participant
  tutor.iconPath = vscode.Uri.joinPath(context.extensionUri, 'chalkboard-user.png');

  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('Congratulations, your extension "code-tutor" is now active!');

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  const disposable = vscode.commands.registerCommand('code-tutor.helloWorld', () => {
    // The code you place here will be executed every time your command is executed
    // Display a message box to the user
    vscode.window.showInformationMessage('Hello World from Code Tutor!');
  });

  context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}
