"""
AI API Wrappers - Unified interface for multiple AI providers
Supports: OpenAI, Anthropic, Google Gemini, Perplexity, DeepSeek, and xAI (Grok)

Each function returns a standardized response format:
{
    "success": bool,
    "response": str,
    "conversation_history": list,
    "metadata": dict,
    "error": str or None
}
"""

from typing import Optional, List, Dict, Any
import json
import logging
import re as _re

logger = logging.getLogger(__name__)


# ============================================================================
# OPENAI (ChatGPT)
# ============================================================================

def call_openai_api(
    api_key: str,
    message: str,
    model: str,
    conversation_history: Optional[List[Dict]] = None,
    use_web_search: bool = False,
    **kwargs
) -> Dict[str, Any]:
    """
    Call OpenAI API (ChatGPT)
    
    Args:
        api_key: OpenAI API key
        model: Model name (e.g., 'gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo')
        message: User message to send
        conversation_history: List of message dicts [{"role": "user/assistant", "content": "..."}]
        use_web_search: Not natively supported by OpenAI - will be ignored
        **kwargs: Additional parameters (temperature, max_tokens, etc.)
    
    Returns:
        Standardized response dict
    """
    try:
        from openai import OpenAI
        client = OpenAI(api_key=str(api_key))

        # Build messages list
        messages = conversation_history.copy() if conversation_history else []
        messages.append({"role": "user", "content": message})

        citations: list[dict] = []
        assistant_message = ""
        tokens_meta: dict = {}

        # Try Responses API with web_search_preview when web search is requested
        _used_responses_api = False
        if use_web_search and hasattr(client, "responses"):
            try:
                resp = client.responses.create(
                    model=model,
                    tools=[{"type": "web_search_preview"}],
                    input=messages,
                )
                seen_urls: set[str] = set()
                for item in (resp.output or []):
                    if getattr(item, "type", "") == "message":
                        for content in getattr(item, "content", []):
                            if getattr(content, "type", "") == "output_text":
                                assistant_message += getattr(content, "text", "")
                                for ann in getattr(content, "annotations", []):
                                    if getattr(ann, "type", "") == "url_citation":
                                        url = getattr(ann, "url", None)
                                        title = getattr(ann, "title", None)
                                        if url and url not in seen_urls:
                                            citations.append({"url": url, "title": title})
                                            seen_urls.add(url)
                if not assistant_message:
                    raise ValueError("No message content in Responses API output")
                usage = getattr(resp, "usage", None)
                tokens_meta = {
                    "prompt": getattr(usage, "input_tokens", None) if usage else None,
                    "completion": getattr(usage, "output_tokens", None) if usage else None,
                    "total": getattr(usage, "total_tokens", None) if usage else None,
                }
                _used_responses_api = True
            except Exception as ws_err:
                logger.warning(
                    f"OpenAI web_search_preview failed: {ws_err}, falling back to chat completions"
                )
                assistant_message = ""
                citations = []

        # Fall back to Chat Completions API
        if not _used_responses_api:
            response = client.chat.completions.create(
                model=model,
                messages=messages,
                **kwargs,
            )
            assistant_message = response.choices[0].message.content
            tokens_meta = {
                "prompt": response.usage.prompt_tokens,
                "completion": response.usage.completion_tokens,
                "total": response.usage.total_tokens,
            }

        # Update conversation history
        messages.append({"role": "assistant", "content": assistant_message})

        return {
            "success": True,
            "response": assistant_message,
            "conversation_history": messages,
            "metadata": {
                "model": model,
                "tokens_used": tokens_meta,
            },
            "citations": citations,
            "error": None,
        }

    except Exception as e:
        return {
            "success": False,
            "response": None,
            "conversation_history": conversation_history,
            "metadata": {},
            "citations": [],
            "error": f"OpenAI API Error: {str(e)}"
        }


# ============================================================================
# ANTHROPIC (Claude)
# ============================================================================

def call_anthropic_api(
    api_key: str,
    message: str,
    model: str,
    conversation_history: Optional[List[Dict]] = None,
    use_web_search: bool = False,
    **kwargs
) -> Dict[str, Any]:
    """
    Call Anthropic API (Claude)
    
    Args:
        api_key: Anthropic API key
        model: Model name (e.g., 'claude-opus-4-5-20251101', 'claude-sonnet-4-5-20250929')
        message: User message to send
        conversation_history: List of message dicts [{"role": "user/assistant", "content": "..."}]
        use_web_search: Enable web search tool (native support)
        **kwargs: Additional parameters (temperature, max_tokens, etc.)
    
    Returns:
        Standardized response dict
    """
    try:
        from anthropic import Anthropic
        
        client = Anthropic(api_key=api_key)
        
        # Build messages list
        messages = conversation_history.copy() if conversation_history else []
        messages.append({"role": "user", "content": message})
        
        # Prepare API parameters
        api_params = {
            "model": model,
            "messages": messages,
            "max_tokens": kwargs.pop("max_tokens", 4096),
            **kwargs
        }
        
        # Add web search tool if requested
        if use_web_search:
            api_params["tools"] = [
                {
                    "type": "web_search_20250305",
                    "name": "web_search"
                }
            ]
        
        # Make API call
        response = client.messages.create(**api_params)
        
        # Extract text content and citations from response blocks
        assistant_message = ""
        citations: list[dict] = []
        seen_urls: set[str] = set()

        for block in response.content:
            block_type = getattr(block, "type", "")
            if block_type == "text":
                assistant_message += block.text
            elif block_type == "web_search_tool_result":
                # Server-side web search results: extract cited URLs
                for result in getattr(block, "content", []):
                    if isinstance(result, dict):
                        r_type = result.get("type", "")
                        url = result.get("url")
                        title = result.get("title")
                    else:
                        r_type = getattr(result, "type", "")
                        url = getattr(result, "url", None)
                        title = getattr(result, "title", None)
                    if r_type == "web_search_result" and url and url not in seen_urls:
                        citations.append({"url": url, "title": title})
                        seen_urls.add(url)

        # Fallback: regex-extract URLs from text if no structured citations
        if not citations:
            for url in _re.findall(r'https?://[^\s\)\]"<>,;]+', assistant_message):
                url = url.rstrip(".,;")
                if url and url not in seen_urls:
                    citations.append({"url": url, "title": None})
                    seen_urls.add(url)

        # Update conversation history
        messages.append({"role": "assistant", "content": assistant_message})

        return {
            "success": True,
            "response": assistant_message,
            "conversation_history": messages,
            "metadata": {
                "model": model,
                "tokens_used": {
                    "input": response.usage.input_tokens,
                    "output": response.usage.output_tokens
                },
                "stop_reason": response.stop_reason
            },
            "citations": citations,
            "error": None
        }

    except Exception as e:
        return {
            "success": False,
            "response": None,
            "conversation_history": conversation_history,
            "metadata": {},
            "citations": [],
            "error": f"Anthropic API Error: {str(e)}"
        }


# ============================================================================
# GOOGLE (Gemini)
# ============================================================================

def call_google_api(
    api_key: str,
    message: str,
    model: str,
    conversation_history: Optional[List[Dict]] = None,
    use_web_search: bool = False,
    **kwargs
) -> Dict[str, Any]:
    """
    Call Google Gemini API
    
    Args:
        api_key: Google API key
        model: Model name (e.g., 'gemini-1.5-pro', 'gemini-1.5-flash')
        message: User message to send
        conversation_history: List of message dicts [{"role": "user/model", "parts": ["..."]}]
        use_web_search: Enable Google Search grounding (native support)
        **kwargs: Additional parameters (temperature, max_output_tokens, etc.)
    
    Returns:
        Standardized response dict
    """
    try:
        from google import genai
        from google.genai import types
        
        genai.configure(api_key=api_key)

        client = genai.Client()
        
        # Create model instance
        generation_config = {}
        if "temperature" in kwargs:
            generation_config["temperature"] = kwargs.pop("temperature")
        if "max_tokens" in kwargs:
            generation_config["max_output_tokens"] = kwargs.pop("max_tokens")
        
        # Configure web search (grounding)
        config = None
        if use_web_search:
            grounding_tool = types.Tool(
            google_search=types.GoogleSearch()
             )

            config = types.GenerateContentConfig(
                tools=[grounding_tool]
            )
        
        response = client.models.generate_content(
            model=model,
            contents=message,
            config=config
        )
        
        assistant_message = response.text

        # Extract grounding citations from Gemini response
        citations: list[dict] = []
        try:
            candidates = getattr(response, "candidates", None) or []
            if candidates:
                grounding_meta = getattr(candidates[0], "grounding_metadata", None)
                if grounding_meta:
                    chunks = getattr(grounding_meta, "grounding_chunks", None) or []
                    seen_urls: set[str] = set()
                    for chunk in chunks:
                        web = getattr(chunk, "web", None)
                        if web:
                            uri = getattr(web, "uri", None)
                            title = getattr(web, "title", None)
                            if uri and uri not in seen_urls:
                                citations.append({"url": uri, "title": title})
                                seen_urls.add(uri)
        except Exception:
            citations = []

        return {
            "success": True,
            "response": assistant_message,
            "full_repsonse": response,
            "metadata": {
                "model": model,
                "tokens_used": {
                    "prompt": response.usage_metadata.prompt_token_count if hasattr(response, 'usage_metadata') else None,
                    "completion": response.usage_metadata.candidates_token_count if hasattr(response, 'usage_metadata') else None,
                    "total": response.usage_metadata.total_token_count if hasattr(response, 'usage_metadata') else None
                }
            },
            "citations": citations,
            "error": None
        }

    except Exception as e:
        return {
            "success": False,
            "response": None,
            "conversation_history": conversation_history,
            "metadata": {},
            "citations": [],
            "error": f"Google API Error: {str(e)}"
        }


# ============================================================================
# PERPLEXITY
# ============================================================================

def call_perplexity_api(
    api_key: str,
    message: str,
    model: str,
    conversation_history: Optional[List[Dict]] = None,
    use_web_search: bool = True,
    web_search_options: Optional[Dict[str, Any]] = None,
    **kwargs
) -> Dict[str, Any]:
    """
    Call Perplexity API

    Args:
        api_key: Perplexity API key
        model: Model name (e.g., 'llama-3.1-sonar-large-128k-online', 'llama-3.1-sonar-small-128k-online')
        message: User message to send
        conversation_history: List of message dicts [{"role": "user/assistant", "content": "..."}]
        use_web_search: Enable web search (default True, this is Perplexity's main feature)
        web_search_options: Perplexity native search options (e.g., {"user_location": {"country": "FR", "city": "Paris"}})
        **kwargs: Additional parameters (temperature, max_tokens, etc.)

    Returns:
        Standardized response dict

    Note: Perplexity uses OpenAI-compatible API format
    """
    try:
        from openai import OpenAI

        # Perplexity uses OpenAI-compatible Chat Completions API
        client = OpenAI(
            api_key=api_key,
            base_url="https://api.perplexity.ai"
        )

        # Build messages list
        messages = conversation_history.copy() if conversation_history else []
        messages.append({"role": "user", "content": message})

        # Build API params — include web_search_options if provided
        api_params = {
            "model": model,
            "messages": messages,
            **kwargs,
        }
        if web_search_options:
            api_params["web_search_options"] = web_search_options

        response = client.chat.completions.create(**api_params)

        # Extract response
        assistant_message = response.choices[0].message.content

        # Extract citations (Perplexity appends non-standard 'citations' list to the response)
        citations_raw: list = []
        if hasattr(response, "model_extra") and response.model_extra:
            citations_raw = response.model_extra.get("citations", [])
        citations = [{"url": u, "title": None} for u in citations_raw if isinstance(u, str)]

        # Update conversation history
        messages.append({"role": "assistant", "content": assistant_message})

        return {
            "success": True,
            "response": assistant_message,
            "conversation_history": messages,
            "metadata": {
                "model": model,
                "tokens_used": {
                    "prompt": response.usage.prompt_tokens if response.usage else None,
                    "completion": response.usage.completion_tokens if response.usage else None,
                    "total": response.usage.total_tokens if response.usage else None,
                },
                "finish_reason": response.choices[0].finish_reason if response.choices else None,
            },
            "citations": citations,
            "error": None,
        }

    except Exception as e:
        return {
            "success": False,
            "response": None,
            "conversation_history": conversation_history,
            "metadata": {},
            "citations": [],
            "error": f"Perplexity API Error: {str(e)}"
        }


# ============================================================================
# DEEPSEEK
# ============================================================================

def call_deepseek_api(
    api_key: str,
    message: str,
    model: str,
    conversation_history: Optional[List[Dict]] = None,
    use_web_search: bool = False,
    **kwargs
) -> Dict[str, Any]:
    """
    Call DeepSeek API
    
    Args:
        api_key: DeepSeek API key
        model: Model name (e.g., 'deepseek-chat', 'deepseek-coder')
        message: User message to send
        conversation_history: List of message dicts [{"role": "user/assistant", "content": "..."}]
        use_web_search: Web search capability (check DeepSeek docs for availability)
        **kwargs: Additional parameters (temperature, max_tokens, etc.)
    
    Returns:
        Standardized response dict
    
    Note: DeepSeek uses OpenAI-compatible API format
    """
    try:
        from openai import OpenAI
        
        # DeepSeek uses OpenAI-compatible API
        client = OpenAI(
            api_key=api_key,
            base_url="https://api.deepseek.com"
        )
        
        # Build messages list
        messages = conversation_history.copy() if conversation_history else []
        messages.append({"role": "user", "content": message})
        
        # Note: Check DeepSeek documentation for web search capabilities
        if use_web_search:
            print("Note: Check DeepSeek documentation to verify web search support for your model")
        
        # Make API call
        response = client.chat.completions.create(
            model=model,
            messages=messages,
            **kwargs
        )
        
        # Extract response
        assistant_message = response.choices[0].message.content
        
        # Update conversation history
        messages.append({"role": "assistant", "content": assistant_message})
        
        return {
            "success": True,
            "response": assistant_message,
            "conversation_history": messages,
            "metadata": {
                "model": model,
                "tokens_used": {
                    "prompt": response.usage.prompt_tokens,
                    "completion": response.usage.completion_tokens,
                    "total": response.usage.total_tokens
                }
            },
            "error": None
        }
        
    except Exception as e:
        return {
            "success": False,
            "response": None,
            "conversation_history": conversation_history,
            "metadata": {},
            "error": f"DeepSeek API Error: {str(e)}"
        }


# ============================================================================
# XAI (Grok)
# ============================================================================

def call_xai_api(
    api_key: str,
    message: str,
    model: str,
    conversation_history: Optional[List[Dict]] = None,
    use_web_search: bool = False,
    **kwargs
) -> Dict[str, Any]:
    """
    Call xAI API (Grok)
    
    Args:
        api_key: xAI API key
        model: Model name (e.g., 'grok-beta', 'grok-vision-beta')
        message: User message to send
        conversation_history: List of message dicts [{"role": "user/assistant", "content": "..."}]
        use_web_search: Web search capability (check xAI docs for availability)
        **kwargs: Additional parameters (temperature, max_tokens, etc.)
    
    Returns:
        Standardized response dict
    
    Note: xAI uses OpenAI-compatible API format
    """
    try:
        from openai import OpenAI
        
        # xAI uses OpenAI-compatible API
        client = OpenAI(
            api_key=api_key,
            base_url="https://api.x.ai/v1"
        )
        
        # Build messages list
        messages = conversation_history.copy() if conversation_history else []
        messages.append({"role": "user", "content": message})
        
        # Note: Check xAI documentation for web search capabilities
        if use_web_search:
            print("Note: Check xAI documentation to verify web search support for your model")
        
        # Make API call
        response = client.chat.completions.create(
            model=model,
            messages=messages,
            **kwargs
        )
        
        # Extract response
        assistant_message = response.choices[0].message.content
        
        # Update conversation history
        messages.append({"role": "assistant", "content": assistant_message})
        
        return {
            "success": True,
            "response": assistant_message,
            "conversation_history": messages,
            "metadata": {
                "model": model,
                "tokens_used": {
                    "prompt": response.usage.prompt_tokens,
                    "completion": response.usage.completion_tokens,
                    "total": response.usage.total_tokens
                }
            },
            "error": None
        }
        
    except Exception as e:
        return {
            "success": False,
            "response": None,
            "conversation_history": conversation_history,
            "metadata": {},
            "error": f"xAI API Error: {str(e)}"
        }


# ============================================================================
# OLLAMA (Local AI)
# ============================================================================

def call_ollama_api(
    api_key: str,
    message: str,
    model: str,
    conversation_history: Optional[List[Dict]] = None,
    use_web_search: bool = False,
    base_url: str = "http://localhost:11434/v1",
    **kwargs
) -> Dict[str, Any]:
    """
    Call Ollama via its OpenAI-compatible API.

    Args:
        api_key: Ignored (Ollama needs no real key; pass any string).
        message: User message to send.
        model: Ollama model tag (e.g., 'qwen3:4b').
        conversation_history: List of message dicts.
        use_web_search: Ignored — Ollama has no web-search support.
        base_url: Ollama OpenAI-compatible endpoint.
        **kwargs: Extra params forwarded to chat.completions.create.

    Returns:
        Standardized response dict.
    """
    try:
        from openai import OpenAI

        client = OpenAI(api_key=api_key or "ollama", base_url=base_url)

        messages = conversation_history.copy() if conversation_history else []
        messages.append({"role": "user", "content": message})

        # Strip kwargs that Ollama doesn't support
        kwargs.pop("web_search_options", None)

        response = client.chat.completions.create(
            model=model,
            messages=messages,
            **kwargs
        )

        assistant_message = response.choices[0].message.content
        messages.append({"role": "assistant", "content": assistant_message})

        return {
            "success": True,
            "response": assistant_message,
            "conversation_history": messages,
            "metadata": {
                "model": model,
                "tokens_used": {
                    "prompt": getattr(response.usage, "prompt_tokens", None) if response.usage else None,
                    "completion": getattr(response.usage, "completion_tokens", None) if response.usage else None,
                    "total": getattr(response.usage, "total_tokens", None) if response.usage else None,
                },
            },
            "error": None,
        }

    except Exception as e:
        return {
            "success": False,
            "response": None,
            "conversation_history": conversation_history,
            "metadata": {},
            "error": f"Ollama API Error: {str(e)}",
        }


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def get_provider_info() -> Dict[str, Dict[str, Any]]:
    """
    Get information about each provider's capabilities
    
    Returns:
        Dict with provider information
    """
    return {
        "openai": {
            "name": "OpenAI (ChatGPT)",
            "web_search": False,
            "example_models": ["gpt-4o", "gpt-4-turbo", "gpt-3.5-turbo"],
            "message_format": [{"role": "user/assistant", "content": "..."}]
        },
        "anthropic": {
            "name": "Anthropic (Claude)",
            "web_search": True,
            "example_models": ["claude-opus-4-5-20251101", "claude-sonnet-4-5-20250929", "claude-haiku-4-5-20251001"],
            "message_format": [{"role": "user/assistant", "content": "..."}]
        },
        "google": {
            "name": "Google (Gemini)",
            "web_search": True,
            "example_models": ["gemini-1.5-pro", "gemini-1.5-flash"],
            "message_format": [{"role": "user/model", "parts": ["..."]}]
        },
        "perplexity": {
            "name": "Perplexity",
            "web_search": True,
            "example_models": ["llama-3.1-sonar-large-128k-online", "llama-3.1-sonar-small-128k-online"],
            "message_format": [{"role": "user/assistant", "content": "..."}],
            "note": "Use 'online' models for web search"
        },
        "deepseek": {
            "name": "DeepSeek",
            "web_search": "Unknown - check documentation",
            "example_models": ["deepseek-chat", "deepseek-coder"],
            "message_format": [{"role": "user/assistant", "content": "..."}]
        },
        "xai": {
            "name": "xAI (Grok)",
            "web_search": "Unknown - check documentation",
            "example_models": ["grok-beta", "grok-vision-beta"],
            "message_format": [{"role": "user/assistant", "content": "..."}]
        }
    }