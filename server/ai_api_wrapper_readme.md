# AI API Wrappers

Unified Python interface for multiple AI provider APIs including OpenAI, Anthropic, Google Gemini, Perplexity, DeepSeek, and xAI (Grok).

## Features

- **Unified Interface**: All providers use the same function signature for easy swapping
- **Stateless Design**: Functions accept conversation history as parameters
- **Native Web Search**: Supports web search where available (Claude, Gemini, Perplexity)
- **Error Handling**: Standardized error response format
- **Raw Provider Format**: Returns conversation history in each provider's native format

## Installation

Install the required SDKs:

```bash
pip install openai anthropic google-generativeai
```

## Quick Start

```python
from ai_api_wrappers import call_anthropic_api

result = call_anthropic_api(
    api_key="your-api-key",
    model="claude-sonnet-4-5-20250929",
    message="Hello, how are you?",
    use_web_search=False
)

if result["success"]:
    print(result["response"])
else:
    print(result["error"])
```

# FAKE DATA TEST

{
    "auditId" : "1",
    "businessUrl" : "https://shigure.fr/",
    "businessType" : "coffee-shop",
    "language" : "fr",
    "businessName" : "Shingure Café",
    "fullBusinessName" : "Shigure Café シグレ - Your Daily Ritual, Elevated.",
    "street" : "Rue Clauzel",
    "number" : "27",
    "city": "Paris",
    "neighborhood" : ["St-George", "South Pigalle"],
    "pointOfInterest" : ["Rue des Martyrs", "Place St-George", "Pigalle"]
}


## Function Signature

All functions follow this signature:

```python
def call_<provider>_api(
    api_key: str,
    model: str,
    message: str,
    conversation_history: Optional[List[Dict]] = None,
    use_web_search: bool = False,
    **kwargs
) -> Dict[str, Any]
```

### Parameters

- `api_key`: Your API key for the provider
- `model`: Model name (see provider-specific models below)
- `message`: The user message to send
- `conversation_history`: Optional list of previous messages in provider's native format
- `use_web_search`: Enable web search (only works for providers that support it)
- `**kwargs`: Additional provider-specific parameters (temperature, max_tokens, etc.)

### Return Format

All functions return a standardized dictionary:

```python
{
    "success": bool,              # Whether the request succeeded
    "response": str,              # The AI's response text
    "conversation_history": list, # Updated conversation history
    "metadata": dict,             # Token usage, model info, etc.
    "error": str or None          # Error message if success=False
}
```

## Provider-Specific Information

### OpenAI (ChatGPT)

```python
from ai_api_wrappers import call_openai_api

result = call_openai_api(
    api_key="sk-...",
    model="gpt-4o",
    message="Hello!",
    temperature=0.7,
    max_tokens=1000
)
```

**Models**: `gpt-4o`, `gpt-4-turbo`, `gpt-3.5-turbo`
**Web Search**: ❌ Not supported
**Message Format**: `[{"role": "user/assistant", "content": "..."}]`

---

### Anthropic (Claude)

```python
from ai_api_wrappers import call_anthropic_api

result = call_anthropic_api(
    api_key="sk-ant-...",
    model="claude-sonnet-4-5-20250929",
    message="Hello!",
    use_web_search=True,  # ✅ Native support
    temperature=0.7,
    max_tokens=4096
)
```

**Models**: 
- `claude-opus-4-5-20251101`
- `claude-sonnet-4-5-20250929`
- `claude-haiku-4-5-20251001`

**Web Search**: ✅ Native support via web_search tool
**Message Format**: `[{"role": "user/assistant", "content": "..."}]`

---

### Google (Gemini)

```python
from ai_api_wrappers import call_google_api

result = call_google_api(
    api_key="AIza...",
    model="gemini-1.5-pro",
    message="Hello!",
    use_web_search=True,  # ✅ Native support
    temperature=0.7
)
```

**Models**: `gemini-1.5-pro`, `gemini-1.5-flash`
**Web Search**: ✅ Native support via Google Search grounding
**Message Format**: `[{"role": "user/model", "parts": ["..."]}]`

---

### Perplexity

```python
from ai_api_wrappers import call_perplexity_api

result = call_perplexity_api(
    api_key="pplx-...",
    model="llama-3.1-sonar-large-128k-online",  # Note: 'online' for web search
    message="What's the latest news?",
    use_web_search=True  # ✅ Built into 'online' models
)
```

**Models**: 
- `llama-3.1-sonar-large-128k-online` (with web search)
- `llama-3.1-sonar-small-128k-online` (with web search)
- `llama-3.1-sonar-large-128k-chat` (without web search)
- `llama-3.1-sonar-small-128k-chat` (without web search)

**Web Search**: ✅ Available in 'online' models
**Message Format**: `[{"role": "user/assistant", "content": "..."}]`
**Note**: Use models with "online" in the name for web search capabilities

---

### DeepSeek

```python
from ai_api_wrappers import call_deepseek_api

result = call_deepseek_api(
    api_key="sk-...",
    model="deepseek-chat",
    message="Hello!",
    temperature=0.7
)
```

**Models**: `deepseek-chat`, `deepseek-coder`
**Web Search**: ⚠️ Check DeepSeek documentation
**Message Format**: `[{"role": "user/assistant", "content": "..."}]`

---

### xAI (Grok)

```python
from ai_api_wrappers import call_xai_api

result = call_xai_api(
    api_key="xai-...",
    model="grok-beta",
    message="Hello!",
    temperature=0.7
)
```

**Models**: `grok-beta`, `grok-vision-beta`
**Web Search**: ⚠️ Check xAI documentation
**Message Format**: `[{"role": "user/assistant", "content": "..."}]`

---

## Usage Examples

### Simple Message

```python
result = call_openai_api(
    api_key="your-key",
    model="gpt-4o",
    message="What is Python?"
)

if result["success"]:
    print(result["response"])
```

### Conversation with History

```python
# First message
result1 = call_anthropic_api(
    api_key="your-key",
    model="claude-sonnet-4-5-20250929",
    message="Hello! My name is Alice."
)

# Continue conversation
result2 = call_anthropic_api(
    api_key="your-key",
    model="claude-sonnet-4-5-20250929",
    message="What's my name?",
    conversation_history=result1["conversation_history"]
)
# Result: "Your name is Alice."
```

### Using Web Search

```python
# Anthropic with web search
result = call_anthropic_api(
    api_key="your-key",
    model="claude-sonnet-4-5-20250929",
    message="What are the latest AI developments?",
    use_web_search=True
)

# Google with web search
result = call_google_api(
    api_key="your-key",
    model="gemini-1.5-pro",
    message="What's the weather in Tokyo?",
    use_web_search=True
)

# Perplexity (use 'online' model)
result = call_perplexity_api(
    api_key="your-key",
    model="llama-3.1-sonar-large-128k-online",
    message="What happened in the news today?"
)
```

### Error Handling

```python
result = call_openai_api(
    api_key="invalid-key",
    model="gpt-4o",
    message="Hello"
)

if not result["success"]:
    print(f"Error: {result['error']}")
    # Handle error appropriately
```

### Provider Swapping

```python
def ask_ai(provider_func, api_key, model, question):
    """Ask any AI provider the same question"""
    return provider_func(
        api_key=api_key,
        model=model,
        message=question
    )

# Easy to swap providers
response1 = ask_ai(call_openai_api, "key1", "gpt-4o", "What is AI?")
response2 = ask_ai(call_anthropic_api, "key2", "claude-sonnet-4-5-20250929", "What is AI?")
response3 = ask_ai(call_google_api, "key3", "gemini-1.5-pro", "What is AI?")
```

## Web Search Support Summary

| Provider | Web Search | How to Enable |
|----------|-----------|---------------|
| OpenAI | ❌ No | Not available |
| Anthropic | ✅ Yes | `use_web_search=True` |
| Google | ✅ Yes | `use_web_search=True` |
| Perplexity | ✅ Yes | Use 'online' models + `use_web_search=True` |
| DeepSeek | ⚠️ Unknown | Check documentation |
| xAI | ⚠️ Unknown | Check documentation |

## Important Notes

### Conversation History Format

Each provider uses its own native format for conversation history. The functions do NOT convert between formats. If you switch providers mid-conversation, you'll need to start a new conversation.

**OpenAI/Anthropic/Perplexity/DeepSeek/xAI format:**
```python
[
    {"role": "user", "content": "Hello"},
    {"role": "assistant", "content": "Hi there!"}
]
```

**Google Gemini format:**
```python
[
    {"role": "user", "parts": ["Hello"]},
    {"role": "model", "parts": ["Hi there!"]}
]
```

### API Compatibility

Many providers use OpenAI-compatible APIs:
- Perplexity: Uses OpenAI SDK with custom base URL
- DeepSeek: Uses OpenAI SDK with custom base URL
- xAI: Uses OpenAI SDK with custom base URL

### Token Limits

Each provider has different token limits. Check provider documentation:
- Use `max_tokens` parameter to control response length
- Monitor `metadata.tokens_used` in responses

## Getting API Keys

- **OpenAI**: https://platform.openai.com/api-keys
- **Anthropic**: https://console.anthropic.com/
- **Google**: https://makersuite.google.com/app/apikey
- **Perplexity**: https://www.perplexity.ai/settings/api
- **DeepSeek**: https://platform.deepseek.com/
- **xAI**: https://console.x.ai/

## Contributing

Feel free to add support for additional providers or improve existing implementations!

## License

MIT License - feel free to use in your projects.