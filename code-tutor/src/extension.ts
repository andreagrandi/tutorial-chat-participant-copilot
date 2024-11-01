// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

const BASE_PROMPT = `You are a helpful code tutor. 
  Your job is to teach the user with simple descriptions and sample code of the concept.
  Respond with a guided overview of the concept in a series of messages. 
  Do not give the user the answer directly, but guide them to find the answer themselves. 
  If the user asks a non-programming question, politely decline to respond.`;

const MODEL_SELECTOR: vscode.LanguageModelChatSelector = {
  vendor: 'copilot',
  family: 'gpt-4o'
};

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
    // Initialize or reset history if this is a new conversation
    if (!context.history?.length) {
      conversationHistory = [vscode.LanguageModelChatMessage.User(BASE_PROMPT)];
    }

    const [model] = await vscode.lm.selectChatModels(MODEL_SELECTOR);
    if (!model) {
      throw new Error('No suitable model found');
    }

    // Add user's new message to history
    const userMessage = vscode.LanguageModelChatMessage.User(request.prompt);
    conversationHistory.push(userMessage);

    // Send request with full conversation history
    const chatResponse = await model.sendRequest(conversationHistory, {}, token);

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
// Your extension is activated the very first time the command is executed
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
