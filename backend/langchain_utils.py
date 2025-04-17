from langchain.chains.question_answering import load_qa_chain
from langchain.docstore.document import Document
from langchain_community.llms import GooglePalm
from dotenv import load_dotenv
import os

load_dotenv()

llm = GooglePalm(google_api_key=os.getenv("GOOGLE_API_KEY"))
chain = load_qa_chain(llm=llm, chain_type="stuff")

def get_document_qa(text: str, question: str):
    doc = Document(page_content=text)
    result = chain.run(input_documents=[doc], question=question)
    return result
