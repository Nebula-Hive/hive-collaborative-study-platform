from typing import List, Literal, Optional

from pydantic import AliasChoices, BaseModel, ConfigDict, Field


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class QueryRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    question: str = Field(min_length=3, max_length=500)
    subjectCode: str
    chat_history: List[ChatMessage] = Field(
        default_factory=list,
        validation_alias=AliasChoices("chat_history", "chatHistory"),
        serialization_alias="chat_history",
    )
    userId: Optional[str] = None


class QueryResponse(BaseModel):
    answer: str
    sources: List[str]
    subjectCode: str
    is_out_of_syllabus: bool
    chunks_used: int


class IngestRequest(BaseModel):
    resourceId: str
    subjectCode: str
    subjectName: str
    s3Url: str
    fileName: str
    resourceType: str
    uploadedBy: str


class IngestResponse(BaseModel):
    success: bool
    resourceId: str
    subjectCode: str
    chunks_created: int
    message: str


class DeleteRequest(BaseModel):
    resourceId: str
