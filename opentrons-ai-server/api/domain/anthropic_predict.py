import uuid
import requests
from pathlib import Path
from typing import List, Dict, Any
import structlog
from ddtrace import tracer
from anthropic import Anthropic
from anthropic.types import Message, MessageParam
from api.domain.config_anthropic import DOCUMENTS, MODEL, PROMPT, SYSTEM_PROMPT
from pydantic import BaseModel

from api.settings import Settings

settings: Settings = Settings()
logger = structlog.stdlib.get_logger(settings.logger_name)
ROOT_PATH: Path = Path(Path(__file__)).parent.parent.parent


class AnthropicPredict:
    def __init__(self, settings: Settings) -> None:
        self.settings: Settings = settings
        self.client: Anthropic = Anthropic(api_key=settings.anthropic_api_key.get_secret_value())
        self.model: str = MODEL
        self.system_prompt: str = SYSTEM_PROMPT
        self.path_docs: Path = ROOT_PATH / "api" / "storage" / "docs"
        self._messages: List[MessageParam] = [
            {
                "role": "user", 
                "content": [ 
                    {
                        "type": "text",
                        "text": DOCUMENTS.format(doc_content=self.get_docs()),
                        "cache_control": {"type": "ephemeral"} 
                    }
                ]
            }
        ]
        self.tools: List[Dict[str, Any]] = [{
            "name": "simulate_protocol",
            "description": "Simulates the python protocol on user input. Returned value is text indicating if protocol is successful.",
            "input_schema": {
                "type": "object",
                "properties": {
                "protocol": {"type": "string", "description": "protocol in python for simulation"},
                },
                "required": ["protocol"]
            }
        }]

    @tracer.wrap()
    def get_docs(self) -> str:
        """
        Processes documents from a directory and returns their content wrapped in XML tags.
        Each document is wrapped in <document> tags with metadata subtags.
        
        Returns:
            str: XML-formatted string containing all documents and their metadata
        """
        logger.info("Getting docs", extra={"path": str(self.path_docs)})
        xml_output = ["<documents>"]        
        for file_path in self.path_docs.iterdir():
            try:
                content = file_path.read_text(encoding='utf-8')
                document_xml = [
                    "<document>",
                    f"  <source>{file_path.name}</source>",
                    "   <document_content>",
                    f"    {content}",
                    "   </document_content>",
                    "</document>"
                ]
                xml_output.extend(document_xml)
                    
            except Exception as e:
                logger.error("Error procesing file", extra={"file": file_path.name, 'error': str(e)})
                continue
                
        xml_output.append("</documents>")
        return "\n".join(xml_output)

    @tracer.wrap()
    def generate_message(self, max_tokens: int = 4096) -> Message:
        
        response = self.client.messages.create(
            model=self.model,
            system=self.system_prompt,
            max_tokens=max_tokens,
            messages=self._messages,
            tools=self.tools,
            extra_headers={"anthropic-beta": "prompt-caching-2024-07-31"},
        )

        logger.info(
            "Token usage",
            extra={
                "input_tokens": response.usage.input_tokens,
                "output_tokens": response.usage.output_tokens,
                "cache_read": getattr(response.usage, 'cache_read_input_tokens', '---'),
                "cache_create": getattr(response.usage, 'cache_creation_input_tokens', '---')
            }
        )
        return response
    
    @tracer.wrap()
    def predict(self, prompt: str) -> str | None:
        try: 
            self._messages.append({"role": "user", "content": PROMPT.format(USER_PROMPT=prompt)})
            response = self.generate_message()
            
            if response.content[-1].type == "tool_use":
                tool_use = response.content[-1]
                self._messages.append(
                    {"role": "assistant", "content": response.content}
                )
                result = self.handle_tool_use(tool_use.name, tool_use.input)
                self._messages.append({
                    "role": "user",
                    "content": [{
                        "type": "tool_result",
                        "tool_use_id": tool_use.id,
                        "content": result,
                    }],
                })
                follow_up = self.generate_message()
                response_text = follow_up.content[0].text
                self._messages.append(
                    {"role": "assistant", "content": response_text}
                )
                return response_text

            elif response.content[0].type == "text":
                response_text = response.content[0].text
                self._messages.append(
                    {"role": "assistant", "content": response_text}
                )
                return response_text

            logger.error("Unexpected response type")
            return None
        except IndexError as e:
            logger.error("Invalid response format", extra={"error": str(e)})
            return None
        except Exception as e:
            logger.error("Error in predict method", extra={"error": str(e)})
            return None
    
    @tracer.wrap()
    def handle_tool_use(self, func_name: str, func_params: Dict[str, Any]) -> str:
        if func_name == "simulate_protocol":
            results = self.simulate_protocol(**func_params)
            return results
        
        logger.error("Unknown tool", extra={"tool": func_name})
        raise ValueError(f"Unknown tool: {func_name}")
    
    @tracer.wrap()
    def reset(self) -> None:
        self._messages = [
            {
                "role": "user", 
                "content": [ 
                    {
                        "type": "text",
                        "text": DOCUMENTS.format(doc_content=self.get_docs()),
                        "cache_control": {"type": "ephemeral"} 
                    }
                ]
            }
        ]

    @tracer.wrap()
    def simulate_protocol(self, protocol: str) -> str: 
        url = "https://Opentrons-simulator.hf.space/protocol"
        protocol_name = str(uuid.uuid4()) + ".py"
        data = {"name": protocol_name, "content": protocol}
        hf_token: str = settings.huggingface_api_key.get_secret_value()
        headers = {
            "Content-Type": "application/json",
            'Authorization': 'Bearer {}'.format(hf_token)
        }
        response = requests.post(url, json=data, headers=headers)

        if response.status_code != 200:
            logger.error("Simulation request failed", extra={"status": response.status_code, "error": response.text})
            return f"Error: {response.text}"

        response_data = response.json()
        if "error_message" in response_data:
            logger.error("Simulation error", extra={"error": response_data["error_message"]})
            return response_data["error_message"]
        elif "protocol_name" in response_data:
            return response_data["run_status"]
        else:
            logger.error("Unexpected response", extra={"response": response_data})
            return "Unexpected response"


def main() -> None:
    """Intended for testing this class locally."""
    import sys
    from pathlib import Path
    # # Add project root to Python path
    root_dir = Path(__file__).parent.parent.parent
    sys.path.insert(0, str(root_dir))

    from rich import print
    from rich.prompt import Prompt

    settings = Settings()
    import code
    code.interact(local={**locals(), **globals()})
    llm = AnthropicPredict(settings)
    prompt = Prompt.ask("Type a prompt to send to the Anthropic API:")
    completion = llm.predict(prompt)
    print(completion)

    


if __name__ == "__main__":
    main()
