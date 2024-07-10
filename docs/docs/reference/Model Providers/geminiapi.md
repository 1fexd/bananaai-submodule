# Gemini API

The Google Gemini API is currently in beta. You can [create an API key in Google AI Studio](https://aistudio.google.com) and use `gemini-1.5-pro-latest`. Change `~/.pearai/config.json` to look like this:

```json title="~/.pearai/config.json"
{
  "models": [
    {
      "title": "Gemini Pro",
      "provider": "gemini",
      "model": "gemini-1.5-pro-latest",
      "apiKey": "YOUR_API_KEY"
    }
  ]
}
```

[View the source](https://github.com/trypear/pearai-app/blob/main/core/llm/llms/Gemini.ts)
