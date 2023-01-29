import * as vscode from "vscode";
import { ChatController } from "./chat/ChatController";
import { ChatConversationModel } from "./chat/ChatConversationModel";
import { ChatModel } from "./chat/ChatModel";
import { ChatPanel } from "./chat/ChatPanel";
import { ExplainCodeConversationModel } from "./chat/ExplainCodeConversationModel";
import { GenerateTestConversationModel } from "./chat/GenerateTestConversationModel";
import { ApiKeyManager } from "./openai/ApiKeyManager";
import { OpenAIClient } from "./openai/OpenAIClient";

export const activate = async (context: vscode.ExtensionContext) => {
  const apiKeyManager = new ApiKeyManager({
    secretStorage: context.secrets,
  });

  const chatPanel = new ChatPanel({
    extensionUri: context.extensionUri,
  });

  const chatModel = new ChatModel();

  const chatController = new ChatController({
    chatPanel,
    chatModel,
    openAIClient: new OpenAIClient({
      apiKeyManager,
    }),
    conversationTypes: {
      [ChatConversationModel.id]: ChatConversationModel,
      [ExplainCodeConversationModel.id]: ExplainCodeConversationModel,
      [GenerateTestConversationModel.id]: GenerateTestConversationModel,
    },
  });

  chatPanel.onDidReceiveMessage(
    chatController.receivePanelMessage.bind(chatController)
  );

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider("rubberduck.chat", chatPanel),
    vscode.commands.registerCommand(
      "rubberduck.enterOpenAIApiKey",
      apiKeyManager.enterOpenAIApiKey.bind(apiKeyManager)
    ),
    vscode.commands.registerCommand(
      "rubberduck.clearOpenAIApiKey",
      async () => {
        await apiKeyManager.clearOpenAIApiKey();
        vscode.window.showInformationMessage("OpenAI API key cleared.");
      }
    ),
    vscode.commands.registerCommand("rubberduck.explainCode", () => {
      chatController.createConversation(ExplainCodeConversationModel.id);
    }),
    vscode.commands.registerCommand("rubberduck.generateTest", () => {
      chatController.createConversation(GenerateTestConversationModel.id);
    }),
    vscode.commands.registerCommand("rubberduck.startChat", () => {
      chatController.createConversation(ChatConversationModel.id);
    }),
    vscode.commands.registerCommand("rubberduck.touchBar.startChat", () => {
      chatController.createConversation(ChatConversationModel.id);
    })
  );
};

export const deactivate = async () => {
  // noop
};
