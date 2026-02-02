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
        
        # Note: OpenAI doesn't have native web search
        if use_web_search:
            print("Warning: OpenAI doesn't support native web search. Parameter ignored.")
        
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
                },
                "finish_reason": response.choices[0].finish_reason
            },
            "error": None
        }
        
    except Exception as e:
        return {
            "success": False,
            "response": None,
            "conversation_history": conversation_history,
            "metadata": {},
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
        
        # Extract text content from response
        assistant_message = ""
        for block in response.content:
            if block.type == "text":
                assistant_message += block.text
        
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
            "error": None
        }
        
    except Exception as e:
        return {
            "success": False,
            "response": None,
            "conversation_history": conversation_history,
            "metadata": {},
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
        import google.generativeai as genai
        
        genai.configure(api_key=api_key)
        
        # Create model instance
        generation_config = {}
        if "temperature" in kwargs:
            generation_config["temperature"] = kwargs.pop("temperature")
        if "max_tokens" in kwargs:
            generation_config["max_output_tokens"] = kwargs.pop("max_tokens")
        
        # Configure web search (grounding)
        tools = None
        if use_web_search:
            tools = ["google_search_retrieval"]
        
        model_instance = genai.GenerativeModel(
            model_name=model,
            generation_config=generation_config if generation_config else None,
            tools=tools
        )
        
        # Build conversation
        if conversation_history:
            # Start chat with history
            chat = model_instance.start_chat(history=conversation_history)
            response = chat.send_message(message)
        else:
            # Single message
            chat = model_instance.start_chat()
            response = chat.send_message(message)
        
        assistant_message = response.text
        
        # Get updated history
        updated_history = chat.history
        
        return {
            "success": True,
            "response": assistant_message,
            "conversation_history": updated_history,
            "metadata": {
                "model": model,
                "tokens_used": {
                    "prompt": response.usage_metadata.prompt_token_count if hasattr(response, 'usage_metadata') else None,
                    "completion": response.usage_metadata.candidates_token_count if hasattr(response, 'usage_metadata') else None,
                    "total": response.usage_metadata.total_token_count if hasattr(response, 'usage_metadata') else None
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
        **kwargs: Additional parameters (temperature, max_tokens, etc.)
    
    Returns:
        Standardized response dict
    
    Note: Perplexity uses OpenAI-compatible API format
    """
    try:
        from openai import OpenAI
        
        # Perplexity uses OpenAI-compatible API
        client = OpenAI(
            api_key=api_key,
            base_url="https://api.perplexity.ai"
        )
        
        # Build messages list
        messages = conversation_history.copy() if conversation_history else []
        messages.append({"role": "user", "content": message})
        
        # For Perplexity, online models have web search built-in
        # Use online models for web search, regular models without
        if use_web_search and "online" not in model:
            print("Note: For web search with Perplexity, use 'online' models (e.g., 'llama-3.1-sonar-large-128k-online')")
        
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