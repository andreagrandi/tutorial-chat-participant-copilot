"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = __importStar(require("vscode"));
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
const MODEL_SELECTOR = {
    vendor: 'copilot',
    family: 'gpt-4o'
};
// Store conversation history at module level
let conversationHistory = [];
// define a chat handler
const handler = async (request, context, stream, token) => {
    try {
        // initialize the prompt and model
        let prompt = BASE_PROMPT;
        if (request.command === 'exercise') {
            prompt = EXERCISES_PROMPT;
        }
        // Select a model for the conversation
        const [model] = await vscode.lm.selectChatModels(MODEL_SELECTOR);
        if (!model) {
            throw new Error('No suitable model found');
        }
        // Initialize or reset history if this is a new conversation
        if (!context.history?.length) {
            conversationHistory = [vscode.LanguageModelChatMessage.User(prompt)];
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
    }
    catch (error) {
        stream.markdown(`Chat error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
};
// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
function activate(context) {
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
function deactivate() { }
//# sourceMappingURL=extension.js.map