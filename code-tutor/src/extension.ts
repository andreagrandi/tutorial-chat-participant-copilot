// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

const BASE_PROMPT = `You are a helpful code tutor. 
  Your job is to teach the user with simple descriptions and sample code of the concept.
  Respond with a guided overview of the concept in a series of messages. 
  Do not give the user the answer directly, but guide them to find the answer themselves. 
  If the user asks a non-programming question, politely decline to respond.`;

const EXERCISES_PROMPT = `You are a helpful tutor. Your job is to teach the user with fun, 
  simple exercises that they can complete in the editor. 
  Your exercises should start simple and get more complex as the user progresses. 
  Move one concept at a time, and do not move on to the next concept until the user 
  provides the correct answer. Give hints in your exercises to help the user learn. 
  If the user is stuck, you can provide the answer and explain why it is the answer. 
  If the user asks a non-programming question, politely decline to respond.`;

const MODEL_SELECTOR: vscode.LanguageModelChatSelector = {
  vendor: 'copilot',
  family: 'gpt-4o'
};

const MAX_TOKENS = 8000; // Maximum tokens for the model
const TOKEN_SIZE = 4; // Each token is approximately 4 characters

function calculateTokens(text: string): number {
  return Math.ceil(text.length / TOKEN_SIZE);
}

function isTextPart(part: any): part is vscode.LanguageModelTextPart {
  return 'text' in part && typeof part.text === 'string';
}

function calculateTokensFromParts(parts: (vscode.LanguageModelTextPart | vscode.LanguageModelToolResultPart | vscode.LanguageModelToolCallPart)[]): number {
  let totalLength = 0;
  for (const part of parts) {
    if (isTextPart(part)) {
      totalLength += part.value.length;
    }
  }
  return Math.ceil(totalLength / TOKEN_SIZE);
}

function trimHistoryIfNeeded(history: vscode.LanguageModelChatMessage[], newMessage: string, prompt: string): vscode.LanguageModelChatMessage[] {
  let totalTokens = calculateTokens(prompt) + calculateTokens(newMessage);
  const trimmedHistory = [];

  for (let i = history.length - 1; i >= 0; i--) {
    const message = history[i];
    const messageTokens = calculateTokensFromParts(message.content);

    if (totalTokens + messageTokens > MAX_TOKENS) {
      break;
    }

    totalTokens += messageTokens;
    trimmedHistory.unshift(message);
  }

  return trimmedHistory;
}

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
      // initialize the prompt and model
      let prompt = BASE_PROMPT;

      if (request.command === 'exercise') {
        prompt = EXERCISES_PROMPT;
      }
      console.log('The prompt is:', prompt);
      
      // Select a model for the conversation
      const [model] = await vscode.lm.selectChatModels(MODEL_SELECTOR);
      if (!model) {
        throw new Error('No suitable model found');
      }
      console.log('The model is:', model);

      // Initialize or reset history if this is a new conversation
      if (!context.history?.length) {
        conversationHistory = [vscode.LanguageModelChatMessage.User(prompt)];
      }
      console.log('The conversation history is:', conversationHistory.toString());

      // Add user's new message to history
      const userMessage = vscode.LanguageModelChatMessage.User(request.prompt);
      conversationHistory.push(userMessage);
      console.log('Pushed user message to conversation history:');

      // Trim history if needed
      conversationHistory = trimHistoryIfNeeded(conversationHistory, request.prompt, prompt);
      console.log('Trimmed history');

      // Send request with full conversation history
      console.log('The length of the conversation history is:', conversationHistory.toString().length);
      const chatResponse = await model.sendRequest(conversationHistory, {}, token);
      console.log('History sent to model:', conversationHistory.toString());

      // Add assistant's response to history and stream it
      let assistantResponse = '';
      for await (const fragment of chatResponse.text) {
        assistantResponse += fragment;
        stream.markdown(fragment);
      }
      console.log('About to send the assistant response:', assistantResponse);
      conversationHistory.push(vscode.LanguageModelChatMessage.Assistant(assistantResponse));
      console.log('History after assistant response:', conversationHistory.toString());
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
