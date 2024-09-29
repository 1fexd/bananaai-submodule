import { getHeaders } from "../../BananaAIServer/stubs/headers.js";
import {
  ChatMessage,
  CompletionOptions,
  LLMOptions,
  ModelProvider,
  BananaAuth,
} from "../../index.js";
import { SERVER_URL } from "../../util/parameters.js";
import { Telemetry } from "../../util/posthog.js";
import { BaseLLM } from "../index.js";
import { streamSse, streamResponse, streamJSON } from "../stream.js";
import { checkTokens } from "../../db/token.js";
import { stripImages } from "../images.js";
import {
  compileChatMessages,
  countTokens,
  pruneRawPromptFromTop,
} from "./../countTokens.js";


class BananaAIServer extends BaseLLM {
  getCredentials: (() => Promise<BananaAuth | undefined>) | undefined = undefined;
  setCredentials: (auth: BananaAuth) => Promise<void> = async () => {};
  BananaAIAccessToken: string | undefined = undefined;
  BananaAIRefreshToken: string | undefined = undefined;


  static providerName: ModelProvider = "BananaAI_server";
  constructor(options: LLMOptions) {
    super(options);
    this.BananaAIAccessToken = undefined;
    this.BananaAIRefreshToken = undefined;
  }

  // Public setter for BananaAIAccessToken
  public setBananaAIAccessToken(value: string | undefined): void {
    this.BananaAIAccessToken = value;
  }

  // Public setter for BananaAIRefreshToken
  public setBananaAIRefreshToken(value: string | undefined): void {
    this.BananaAIRefreshToken = value;
  }

  private async _getHeaders() {
    await this._checkAndUpdateCredentials();
    return {
      "Content-Type": "application/json",
      ...(await getHeaders()),
    };
  }

  private async _countTokens(prompt: string, model: string, isPrompt: boolean) {
    // no-op
  }

  private _convertArgs(options: CompletionOptions): any {
    return {
      model: options.model,
      frequency_penalty: options.frequencyPenalty,
      presence_penalty: options.presencePenalty,
      max_tokens: options.maxTokens,
      stop:
        options.model === "starcoder-7b"
          ? options.stop
          : options.stop?.slice(0, 2),
      temperature: options.temperature,
      top_p: options.topP,
    };
  }

  protected async *_streamComplete(
    prompt: string,
    options: CompletionOptions,
  ): AsyncGenerator<string> {
    for await (const chunk of this._streamChat(
      [{ role: "user", content: prompt }],
      options,
    )) {
      yield stripImages(chunk.content);
    }
  }

  countTokens(text: string): number {
    return countTokens(text, this.model);
  }


  protected _convertMessage(message: ChatMessage) {
    if (typeof message.content === "string") {
      return message;
    }
    return {
      ...message,
      content: message.content.map((part) => {
        if (part.type === "text") {
          return part;
        }
        return {
          type: "image",
          source: {
            type: "base64",
            media_type: "image/jpeg",
            data: part.imageUrl?.url.split(",")[1],
          },
        };
      }),
    };
  }

  protected async *_streamChat(
    messages: ChatMessage[],
    options: CompletionOptions,
  ): AsyncGenerator<ChatMessage> {
    const args = this._convertArgs(this.collectArgs(options));

    await this._countTokens(
      messages.map((m) => m.content).join("\n"),
      args.model,
      true,
    );

    await this._checkAndUpdateCredentials();

    const body = JSON.stringify({
            messages: messages.map(this._convertMessage),
            ...args,
        });

    const response = await this.fetch(`${SERVER_URL}/server_chat`, {
      method: "POST",
      headers: {
        ...(await this._getHeaders()),
        Authorization: `Bearer ${this.BananaAIAccessToken}`,
      },
      body: body,
    });

    let completion = "";

    for await (const value of streamJSON(response)) {
      // Handle initial metadata if necessary
      if (value.metadata && Object.keys(value.metadata).length > 0) {
        // Do something with metadata if needed, currently just logging
        console.log("Metadata received:", value.metadata);
      }

      if (value.content) {
        yield {
          role: "assistant",
          content: value.content,
        };
        completion += value.content;
      }
    }
    this._countTokens(completion, args.model, false);
  }

  async *_streamFim(
    prefix: string,
    suffix: string,
    options: CompletionOptions
  ): AsyncGenerator<string> {
    options.stream = true;

    let user_logged_in = await this._checkAndUpdateCredentials();
    if (!user_logged_in) {
      return null
    }

    const endpoint = `${SERVER_URL}/server_fim`;
    const resp = await this.fetch(endpoint, {
        method: "POST",
        body: JSON.stringify({
        model: options.model,
          prefix,
          suffix,
        max_tokens: options.maxTokens,
        temperature: options.temperature,
        top_p: options.topP,
        frequency_penalty: options.frequencyPenalty,
        presence_penalty: options.presencePenalty,
        stop: options.stop,
        stream: true,
        }),
      headers: {
        ...(await this._getHeaders()),
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${this.BananaAIAccessToken}`,
      },
    });
    let completion = "";
    for await (const chunk of streamSse(resp)) {
      yield chunk.choices[0].delta.content;
    }
  }


  async listModels(): Promise<string[]> {
    return [
      "BananaAI_model",
    ];
  }
  supportsFim(): boolean {
    // Todo: Change to true when server is ready
    return false;
  }

  private async _checkAndUpdateCredentials(): Promise<boolean> {
    try {
      let creds = undefined;


      if (this.getCredentials && this.BananaAIAccessToken === undefined) {
        console.log("Attempting to get credentials...");
        creds = await this.getCredentials();

        if (creds && creds.accessToken && creds.refreshToken) {
          this.BananaAIAccessToken = creds.accessToken;
          this.BananaAIRefreshToken = creds.refreshToken;
        }
        else {
          return false;
        }
      }

      const tokens = await checkTokens(this.BananaAIAccessToken, this.BananaAIRefreshToken);

      if (tokens.accessToken !== this.BananaAIAccessToken || tokens.refreshToken !== this.BananaAIRefreshToken) {
        if (tokens.accessToken !== this.BananaAIAccessToken) {
          this.BananaAIAccessToken = tokens.accessToken;
          console.log(
            "BananaAI access token changed from:",
            this.BananaAIAccessToken,
            "to:",
            tokens.accessToken,
          );
        }

        if (tokens.refreshToken !== this.BananaAIRefreshToken) {
          this.BananaAIRefreshToken = tokens.refreshToken;
          console.log(
            "BananaAI refresh token changed from:",
            this.BananaAIRefreshToken,
            "to:",
            tokens.refreshToken,
          );
        }
        if (creds) {
          creds.accessToken = tokens.accessToken
          creds.refreshToken = tokens.refreshToken
          this.setCredentials(creds)
        }
      }
    } catch (error) {
      console.error("Error checking token expiration:", error);
      // Handle the error (e.g., redirect to login page)
    }
    return true
  }

  protected async _sendTokensUsed(
    kind: string,
    prompt: string,
    completion: string,
  ) {
    let promptTokens = this.countTokens(prompt);
    let generatedTokens = this.countTokens(completion);

    const response = await this.fetch(`${SERVER_URL}/log_tokens`, {
      method: "POST",
      headers: {
        ...(await this._getHeaders()),
        Authorization: `Bearer ${this.BananaAIAccessToken}`,
      },
      body: JSON.stringify({
        kind,
        promptTokens,
        generatedTokens
      }),
    })
  }
}

export default BananaAIServer;
