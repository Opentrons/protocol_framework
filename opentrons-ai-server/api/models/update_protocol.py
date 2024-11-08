from pydantic import BaseModel, Field
from typing import Optional, Literal

class UpdateProtocol(BaseModel):
    protocol_text: str = Field(..., description="Text of the protocol")
    regenerate: bool = Field(..., description="Flag to indicate if regeneration is needed")
    update: bool = Field(..., description="Optional update information")
    update_type: Literal["Option1","Option2"] = Field(..., description="Type of update")
    update_details: str = Field(..., description="Details of the update")
    fake: Optional[bool] = Field(False, description="Fake response?")
    fake_id: Optional[int] = Field(..., description="type of response")

