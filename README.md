# CutTheCrap

A **learning/demonstration project** for building and training custom LLMs using the Model Context Protocol (MCP).

## 🎓 Educational Purpose

This project is designed to **teach and demonstrate** how to:

1. **Build custom fine-tuned language models** from scratch
2. **Use Model Context Protocol (MCP)** to fetch and organize data
3. **Collect high-quality training data** from user interactions
4. **Fine-tune models** using OpenAI's API
5. **Deploy custom models** for specialized tasks

**This is a learning project, not production software.** The goal is to understand the complete pipeline of building a domain-specific LLM.

## 🎯 What You'll Learn

### About LLM Training
- How to collect and structure training data
- How to format data for fine-tuning (JSONL)
- How to fine-tune models using OpenAI's API
- How to evaluate and iterate on model performance
- Best practices for training data quality

### About Model Context Protocol
- How MCP servers fetch external data
- How to build document dependency graphs
- How to provide rich context to LLMs
- How to cache and optimize data fetching

### About AI Engineering
- Building training data pipelines
- Implementing streaming AI responses
- Managing model versions
- Collecting user feedback for continuous improvement

## 🚀 Status

**Educational/Demonstration Project**

This project demonstrates a complete LLM training pipeline using federal legislation as example data. The techniques learned here apply to any domain.

## 🧠 Project Structure

This project has **two main educational components**:

### 1. FedDocMCP (Companion Project)
Learn how to build MCP servers that fetch and organize external data. This demonstrates:
- MCP server implementation
- API integration (Congress.gov)
- Data transformation and structuring

### 2. CutTheCrap (This Project)
Learn how to build and train custom LLMs. This demonstrates:
- Training data collection from user interactions
- Data export and formatting for fine-tuning
- Fine-tuning workflow with OpenAI
- Model deployment and inference
- Streaming responses and context management

## 🛠️ Tech Stack

**Frontend & API:**
- Next.js 16 - React framework with API routes
- TypeScript - Type safety throughout
- Tailwind CSS - Styling

**AI & Training:**
- OpenAI API - Model fine-tuning and inference
- Custom training data pipeline
- JSONL export for fine-tuning

**Data Fetching:**
- Model Context Protocol (MCP) - Standardized data fetching
- Congress.gov API - Federal legislation data
- Custom document graph builder

## 📦 Quick Start

```bash
# Clone the repository
git clone https://github.com/n8daniels/CutTheCrap.git
cd CutTheCrap

# Install dependencies
npm install

# Configure environment (add your API keys)
cp .env.example .env
# Edit .env with CONGRESS_API_KEY and OPENAI_API_KEY

# Start development server
npm run dev
```

## 📚 Learning Resources

**Start here:**
1. [CUSTOM_LLM_README.md](./CUSTOM_LLM_README.md) - Quick start guide for building your LLM
2. [TRAINING_WORKFLOW.md](./TRAINING_WORKFLOW.md) - Detailed training workflow
3. [CutTheCrap_Integration_Plan.md](./CutTheCrap_Integration_Plan.md) - MCP integration architecture

**Key concepts demonstrated:**
- Collecting training data from user interactions
- Building rich document context with MCP
- Exporting data for fine-tuning
- Managing fine-tuning jobs
- Deploying custom models

## 🎓 How to Use This Project

This project is designed for hands-on learning:

1. **Explore the code** - Read through the implementation
2. **Run the app** - Start collecting training data
3. **Fine-tune a model** - Follow the workflow to train your own LLM
4. **Experiment** - Try different approaches and configurations
5. **Apply elsewhere** - Use these techniques for your own domain

## 💡 What Makes This Educational

- **Complete pipeline** - See the entire flow from data collection to deployment
- **Well-documented** - Extensive inline comments and guides
- **Practical examples** - Real API integration with Congress.gov
- **Modular design** - Easy to adapt for other use cases
- **Best practices** - Industry-standard approaches to LLM training

## 🎯 Real-World Applications

While this project uses federal legislation as example data, the techniques apply to any domain:

- **Legal tech** - Train models on case law, contracts, regulations
- **Healthcare** - Medical literature, clinical guidelines, research papers
- **Finance** - Financial reports, SEC filings, market analysis
- **Research** - Academic papers, patents, technical documentation
- **Customer support** - Product docs, support tickets, FAQs

The MCP + LLM training pipeline works for any specialized knowledge domain.

## 🤝 Contributing

This is a learning project - contributions, issues, and questions are welcome! If you:
- Find bugs or issues
- Have suggestions for improvement
- Want to add new features
- Have questions about implementation

Feel free to open an issue or PR!

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👤 Author

**Nate Daniels**
- GitHub: [@n8daniels](https://github.com/n8daniels)

## 🙏 Acknowledgments

This project demonstrates concepts from:
- [OpenAI Fine-tuning Documentation](https://platform.openai.com/docs/guides/fine-tuning)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [Congress.gov API](https://api.congress.gov/)

---

**Built to learn. Built to teach. Built with focus.**

*This is an educational project demonstrating LLM training and MCP integration. Not intended for production use.*
