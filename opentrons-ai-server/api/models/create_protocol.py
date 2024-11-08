from pydantic import BaseModel, Field
from typing import List, Optional, Literal

class CreateProtocol(BaseModel):
    scientific_application_type: Literal['Option1', 'Option2', 'Option3'] = Field(..., description="Scientific application type")
    description: str = Field(..., description="Description of the protocol")
    modules: List[str] = Field(..., description="List of required modules")
    labware: List[str] = Field(..., description="List of required labware")
    liquids: List[str] = Field(..., description="List of required liquids")
    steps: str = Field(..., description="The steps of the protocol")
    fake: Optional[bool] = Field(False, description="Fake response?")
    fake_id: Optional[int] = Field(..., description="type of response")