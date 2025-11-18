# CutTheCrap

An AI-powered analysis platform that learns from your data to deliver actionable insights without the fluff.

## 🎯 Purpose

CutTheCrap isn't just another document processing tool—it's a platform for building **trainable AI models** that understand your specific use case. The focus is on **teaching AI to analyze data intelligently**, not just parsing documents.

## 🚀 Status

**Live Demo Available!**

The platform now includes a working web interface with RAG system comparison.

## 🧠 Core Focus

**Training AI, Not Just Processing Documents**

This project prioritizes:
- Building trainable AI models that learn from your specific datasets
- Creating intelligent analysis pipelines that improve over time
- Developing custom AI behaviors tailored to your needs
- Focusing on **how to train AI effectively**, not just what data to feed it

The documents are just input—the real value is in training AI to extract meaningful insights from them.

## 🛠️ Tech Stack

**Frontend:**
- Next.js 14 (React framework)
- TypeScript for type safety
- Tailwind CSS for styling

**Backend/AI:**
- Python 3.11
- RAG systems (Traditional & MCP-Enhanced)
- FAISS vector search
- sentence-transformers

## 📦 Getting Started

### Frontend (Web Interface)

```bash
# Clone the repository
git clone https://github.com/n8daniels/CutTheCrap.git
cd CutTheCrap

# Install Node.js dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

### Backend (RAG System)

```bash
# Install Python dependencies
pip install -r requirements.txt

# Verify setup
python verify_setup.py

# Run standalone RAG demo
python src/demo/side_by_side_comparison.py
```

## ✨ Features

### 🔍 RAG System Comparison
- Interactive web interface
- Compare Traditional vs MCP-Enhanced RAG
- Real-time performance metrics
- Federal legislation examples
- **90% reduction in API calls**
- **5x richer context**

### 📊 Analysis Dashboard
- Document analysis interface (coming soon)
- Training data collection
- Model performance tracking

## 📚 Documentation

- **FRONTEND_README.md** - Frontend setup and development
- **RAG_COMPARISON_README.md** - RAG system technical details
- **QUICKSTART.md** - 5-minute setup guide
- **INTEGRATION_GUIDE.md** - Platform integration guide
- **DELIVERY_SUMMARY.md** - Complete project overview

## 🚢 Deployment

### Local Development
```bash
npm run dev
```

### Docker
```bash
docker-compose up
```

### Production
```bash
npm run build
npm start
```

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👤 Author

**Nate Daniels**
- GitHub: [@n8daniels](https://github.com/n8daniels)

---

*Built with focus. No fluff, no BS, just results.*
