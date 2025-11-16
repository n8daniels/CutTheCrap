# Figma Diagram Prompts for CutTheCrap

Professional diagram prompts to create visual documentation for the repository.

## Color Scheme

**Primary Colors:**
- Primary Blue: `#3B82F6` - Main actions, primary components
- Success Green: `#10B981` - Completed steps, positive states
- Warning Orange: `#F59E0B` - In-progress, important notes
- Purple: `#8B5CF6` - AI/ML components, models
- Gray: `#6B7280` - Secondary text, borders

**Background:**
- Light: `#F9FAFB`
- White: `#FFFFFF`
- Dark accent: `#1F2937`

---

## Diagram 1: Overall System Architecture

**Filename:** `architecture-overview.png`

**Prompt:**
Create a high-level architecture diagram showing the complete CutTheCrap system with three main layers:

**Layer 1: Frontend (Top)**
- Component: "Next.js App" (rounded rectangle, light blue fill)
  - Sub-components: "Chat UI", "Training Dashboard", "Admin Panel"
  - Icons: React logo, TypeScript logo

**Layer 2: Backend Services (Middle)**
- Component: "API Routes" (rounded rectangle, purple fill)
  - `/api/chat` - Chat with LLM
  - `/api/training/export` - Export data
  - `/api/training/finetune` - Manage fine-tuning
- Component: "CutTheCrapLLM" (rounded rectangle, purple fill)
  - "Inference Engine"
  - "Training Data Collector"
  - "Model Manager"
- Component: "MCP Client" (rounded rectangle, blue fill)
  - "Document Fetcher"
  - "Dependency Resolver"
  - "Cache Manager"

**Layer 3: External Services (Bottom)**
- Component: "FedDocMCP Server" (rounded rectangle, green fill)
  - Python MCP server icon
- Component: "Congress.gov API" (rounded rectangle, gray fill)
  - API icon
- Component: "OpenAI API" (rounded rectangle, purple fill)
  - OpenAI logo

**Connections:**
- Solid arrows showing data flow
- Dashed arrows showing optional/async operations
- Label arrows with data type (e.g., "Bill Data", "Training Examples", "Fine-tuned Model")

**Style:**
- Modern, clean design
- Rounded corners (8px radius)
- Drop shadows for depth
- Icons for each service
- Use color coding consistently
- Add a legend in bottom-right corner

**Dimensions:** 1200x800px

---

## Diagram 2: Training Pipeline Workflow

**Filename:** `training-pipeline-flow.png`

**Prompt:**
Create a vertical flowchart showing the complete training pipeline from user interaction to deployed model:

**Step 1: User Interaction** (Light blue circle)
- Icon: User avatar
- Text: "User asks question about bill"
- Subtitle: "Training data collection begins"

**Arrow down with label:** "Question + Bill ID"

**Step 2: MCP Fetches Data** (Green rounded rectangle)
- Icon: Document stack
- Text: "FedDocMCP fetches bill + dependencies"
- Sub-items in smaller boxes:
  - "Primary Bill (H.R. 3684)"
  - "Amendments (SA 2137)"
  - "Referenced Laws (23 USC 119)"
  - "Related Bills"

**Arrow down with label:** "Document Graph"

**Step 3: Build Context** (Orange rounded rectangle)
- Icon: Puzzle pieces connecting
- Text: "Build rich AI context"
- Sub-items:
  - "Full bill text"
  - "Dependency summaries"
  - "Cross-references"
  - "~85k tokens"

**Arrow down with label:** "AI Context"

**Step 4: AI Response** (Purple rounded rectangle)
- Icon: Brain/AI icon
- Text: "CutTheCrapLLM generates response"
- Badge: "GPT-4 or fine-tuned model"

**Arrow down with label:** "Response"

**Step 5: Save Training Example** (Blue rounded rectangle)
- Icon: Database
- Text: "Auto-save training example"
- Shows JSON structure preview
- Badge: "Training mode enabled"

**Dotted box around steps 1-5:** "Repeat 100-500 times"

**Arrow down to Step 6: Export** (Green rounded rectangle)
- Icon: Export/download icon
- Text: "Export to JSONL"
- Shows file icon with ".jsonl" extension

**Arrow down to Step 7: Fine-tune** (Purple rounded rectangle)
- Icon: Settings/gear with AI
- Text: "Fine-tune with OpenAI"
- Shows progress bar
- Label: "1-4 hours"

**Arrow down to Step 8: Deploy** (Success green circle)
- Icon: Rocket/deployment
- Text: "Deploy custom model"
- Badge: "ft:gpt-4o-mini:..."

**Style:**
- Vertical flow, centered
- Each step is a distinct visual block
- Use colors to indicate different phases
- Add small icons to each step
- Include time estimates where relevant
- Add a progress indicator on the left side showing % complete
- Annotations on the right side with "Learning objective" for each step

**Dimensions:** 800x1600px (vertical)

---

## Diagram 3: MCP Integration Flow

**Filename:** `mcp-integration-flow.png`

**Prompt:**
Create a sequence diagram showing the MCP integration flow:

**Actors (Left to Right):**
1. "User" (stick figure icon)
2. "Next.js API" (server icon, blue)
3. "MCP Client" (connector icon, green)
4. "FedDocMCP Server" (Python logo, green)
5. "Congress.gov API" (government building icon, gray)

**Sequence:**

**Step 1:**
- User → Next.js API: "POST /api/chat"
- Arrow labeled: `{"question": "...", "billId": "117/hr/3684"}`

**Step 2:**
- Next.js API → MCP Client: "getBillWithDependencies()"
- Arrow labeled: "billId, maxDepth=2"

**Step 3:**
- MCP Client → FedDocMCP Server: "MCP call_tool"
- Arrow labeled: "get_bill_text"

**Step 4:**
- FedDocMCP Server → Congress.gov API: "HTTP GET"
- Arrow labeled: "/v3/bill/117/hr/3684"

**Step 5:**
- Congress.gov API → FedDocMCP Server: "Bill data"
- Dashed return arrow

**Step 6:**
- FedDocMCP Server → MCP Client: "Bill JSON"
- Dashed return arrow

**Step 7 (Parallel):**
- MCP Client → FedDocMCP Server: "get_amendment (SA2137)"
- MCP Client → FedDocMCP Server: "get_usc_section (23-119)"
- Show these as parallel arrows
- Label: "Dependency fetching"

**Step 8:**
- MCP Client → MCP Client: "Build document graph"
- Self-referencing arrow
- Shows small graph visualization

**Step 9:**
- MCP Client → Next.js API: "Document graph"
- Dashed return arrow
- Show count: "5 documents, 3.4s"

**Step 10:**
- Next.js API → Next.js API: "Build AI context"
- Self-referencing arrow

**Step 11:**
- Next.js API → User: "AI response"
- Dashed return arrow
- Badge: "Training example saved"

**Style:**
- Sequence diagram format
- Vertical time axis (top to bottom)
- Different line styles for requests (solid) vs responses (dashed)
- Color-coded by actor
- Add timing annotations on the right margin
- Include a small cache indicator showing cache hit/miss
- Highlight the "parallel fetching" section with a light background

**Dimensions:** 1400x1000px

---

## Diagram 4: Document Graph Structure

**Filename:** `document-graph-structure.png`

**Prompt:**
Create a node graph showing an example bill's dependency structure:

**Center Node (Primary Bill):**
- Large rounded rectangle, blue gradient
- Title: "H.R. 3684"
- Subtitle: "Infrastructure Investment and Jobs Act"
- Icon: Document with star
- Size: 150x100px

**Connected Nodes (Dependencies):**

**Node 1 (Top-left):**
- Medium rectangle, green
- Title: "Amendment SA 2137"
- Subtitle: "Infrastructure Amendments"
- Connection line labeled: "Modifies Section 11003"
- Size: 120x80px

**Node 2 (Top-right):**
- Medium rectangle, orange
- Title: "23 U.S.C. § 119"
- Subtitle: "Highway Performance Program"
- Connection line labeled: "Referenced in Sec 1106"
- Size: 120x80px

**Node 3 (Bottom-left):**
- Medium rectangle, purple
- Title: "Public Law 114-94"
- Subtitle: "FAST Act"
- Connection line labeled: "Predecessor law"
- Size: 120x80px

**Node 4 (Bottom-right):**
- Medium rectangle, blue (lighter)
- Title: "H.R. 3684 (Introduced)"
- Subtitle: "Previous version"
- Connection line labeled: "Earlier version"
- Size: 120x80px

**Visual Elements:**
- Nodes are connected with curved lines (bezier curves)
- Each connection has an arrow pointing to dependency
- Add small badges on each node showing:
  - Document type icon (bill, amendment, law)
  - Status badge (if applicable)
- Include a statistics panel in top-right:
  - "Total Documents: 5"
  - "Dependency Depth: 2"
  - "Fetch Time: 3.4s"
  - "Cache Hits: 0"
  - "Total Tokens: ~85k"

**Legend (Bottom-right):**
- Document types with colors:
  - Blue: Bills
  - Green: Amendments
  - Orange: US Code
  - Purple: Public Laws

**Style:**
- Clean, modern graph visualization
- Use gradients for main node
- Subtle shadows for depth
- Curved connection lines
- Professional iconography
- White or light gray background
- Add a subtle grid pattern in background

**Dimensions:** 1200x900px

---

## Diagram 5: Training Data Format

**Filename:** `training-data-format.png`

**Prompt:**
Create an infographic showing the training data structure transformation:

**Left Side: Raw Interaction**
- Show three bubbles connected vertically:

**Bubble 1 (User - Blue):**
- Icon: User avatar
- Text: "What is H.R. 3684?"
- Badge: "User Question"

**Bubble 2 (Context - Green):**
- Icon: Documents stack
- Text preview showing:
  ```
  Primary Bill: H.R. 3684
  + 4 dependencies
  Total: 85k tokens
  ```
- Badge: "AI Context"

**Bubble 3 (AI - Purple):**
- Icon: Robot/AI
- Text preview: "H.R. 3684 is the Infrastructure..."
- Badge: "AI Response"

**Arrow pointing right labeled:** "Transform to OpenAI Format"

**Right Side: JSONL Format**
- Large code block showing:
```json
{
  "messages": [
    {
      "role": "system",
      "content": "You are CutTheCrapLLM..."
    },
    {
      "role": "user",
      "content": "What is H.R. 3684?"
    },
    {
      "role": "assistant",
      "content": "H.R. 3684 is..."
    }
  ]
}
```

**Bottom Section: Stats Panel**
- Show metrics in cards:
  - "100-500 examples needed"
  - "~10k tokens/example"
  - "85% quality threshold"
  - "Deduplication enabled"

**Style:**
- Split screen design (50/50)
- Code block with syntax highlighting
- Use monospace font for JSON
- Add small icons for different roles
- Include file size estimates
- Show transformation arrow prominently
- Clean, technical aesthetic

**Dimensions:** 1400x800px

---

## Diagram 6: Model Evolution Timeline

**Filename:** `model-evolution-timeline.png`

**Prompt:**
Create a horizontal timeline showing the model improvement journey:

**Timeline (Left to Right):**

**Milestone 1: Base Model**
- Icon: Basic cube
- Label: "Start: GPT-4"
- Metrics box below:
  - "General knowledge"
  - "No domain specialization"
  - "Token cost: High"
- Color: Light gray

**Arrow:** "+100 examples collected"

**Milestone 2: First Fine-tune**
- Icon: Cube with sparkles
- Label: "ft:gpt-4o-mini:v1"
- Metrics box:
  - "Basic legislative understanding"
  - "Training examples: 100"
  - "Token cost: 50% reduction"
- Color: Light blue

**Arrow:** "+300 more examples"

**Milestone 3: Improved Model**
- Icon: Glowing cube
- Label: "ft:gpt-4o-mini:v2"
- Metrics box:
  - "Strong domain knowledge"
  - "Training examples: 400"
  - "Accuracy: +35%"
- Color: Medium blue

**Arrow:** "+600 examples + feedback"

**Milestone 4: Production Model**
- Icon: Star cube with crown
- Label: "ft:gpt-4o-mini:v3"
- Metrics box:
  - "Production-ready"
  - "Training examples: 1000"
  - "User satisfaction: 4.7/5"
- Color: Bright blue/gold

**Above Timeline:**
- Show metrics graph trending upward:
  - Accuracy line (green)
  - User satisfaction line (blue)
  - Cost efficiency line (orange)

**Below Timeline:**
- Show key activities at each stage:
  - "Data collection"
  - "Export JSONL"
  - "Fine-tune"
  - "Deploy"
  - "Iterate"

**Style:**
- Horizontal timeline with clear progression
- Use icons to show model evolution
- Include metric cards at each milestone
- Add a performance graph above timeline
- Use gradient colors to show improvement
- Professional, aspirational design
- Show time estimates between milestones

**Dimensions:** 1600x600px

---

## Diagram 7: Quick Start Guide (One-Pager)

**Filename:** `quick-start-visual-guide.png`

**Prompt:**
Create a visual quick-start guide with numbered steps:

**Header:**
- Title: "Get Started with CutTheCrap"
- Subtitle: "Build your custom LLM in 5 steps"
- Logo/icon

**5 Steps in Grid Layout (2+2+1):**

**Step 1: Setup** (Top-left)
- Icon: Wrench/tools
- Commands shown:
  ```bash
  npm install
  cp .env.example .env
  ```
- Checklist:
  - ✅ Node.js 18+
  - ✅ API keys
  - ✅ FedDocMCP

**Step 2: Run** (Top-right)
- Icon: Rocket launching
- Command:
  ```bash
  npm run dev
  ```
- Shows browser window mockup
- URL: localhost:3000

**Step 3: Collect Data** (Middle-left)
- Icon: Database collecting
- Shows chat interaction mockup
- Counter: "100 examples collected"
- Progress bar: 20% to 100%

**Step 4: Fine-tune** (Middle-right)
- Icon: Brain with gears
- Command:
  ```bash
  npm run finetune
  ```
- Shows progress: "Training... 2h remaining"

**Step 5: Deploy** (Bottom-center, larger)
- Icon: Trophy/checkmark
- Shows model ID being added to .env
- Success badge: "Your custom LLM is live!"

**Right Sidebar:**
- "Need help?" section
- Links to docs
- Discord/community link
- Estimated time: "~3-4 hours total"

**Style:**
- Card-based layout
- Each step is a distinct card with shadow
- Use step numbers in colored circles
- Include terminal mockups for commands
- Add estimated time for each step
- Professional, welcoming design
- Use brand colors throughout
- Add subtle background pattern

**Dimensions:** 1200x1400px

---

## Diagram 8: Data Flow Animation Frames

**Filename:** `data-flow-animation-frames.png`

**Prompt:**
Create 4 frames showing data flowing through the system (can be used as animation or slide deck):

**Frame 1: User Input**
- Highlight: User asking question
- Show: Chat bubble with question
- Gray out: Everything else
- Label: "Step 1: User asks question"

**Frame 2: MCP Fetching**
- Highlight: MCP Client → FedDocMCP → Congress.gov
- Show: Documents being fetched (animated dots)
- Gray out: User, AI
- Label: "Step 2: Fetch bill + dependencies"
- Counter: "Fetching 5 documents..."

**Frame 3: Context Building**
- Highlight: Document graph being assembled
- Show: Nodes connecting together
- Gray out: External services
- Label: "Step 3: Build rich context"
- Stats: "85k tokens"

**Frame 4: AI Response + Save**
- Highlight: AI generating response + saving to database
- Show: Response flowing back to user + file being saved
- Label: "Step 4: Respond + save training data"
- Badge: "Training example #247 saved"

**Style:**
- Each frame is identical layout
- Only highlights change
- Use colored overlays to show focus
- Grayscale non-active components
- Add motion blur effects to show movement
- Include frame numbers (1/4, 2/4, etc.)
- Can be stitched together as GIF

**Dimensions:** 1200x800px per frame (total 4 frames)

---

## Usage Instructions

### For Figma:
1. Create a new Figma file
2. Use these prompts as guides for each artboard
3. Maintain consistency across diagrams:
   - Use the same color scheme
   - Same fonts (Recommendation: Inter or Roboto for text, Fira Code for code)
   - Same icon style (Recommendation: Lucide icons or Heroicons)
4. Export as PNG at 2x resolution for crisp display

### For AI Image Generation:
If using AI tools like Midjourney or DALL-E, prepend each prompt with:
"Create a professional software architecture diagram for a developer documentation, clean modern design, technical aesthetic, use blue/purple/green color scheme,"

### File Naming:
Save all diagrams in: `docs/diagrams/`
- Use provided filenames
- Export as PNG (2x)
- Also save as SVG if possible for scalability

### Adding to README:
Once created, add to README.md:
```markdown
## Architecture

![System Architecture](docs/diagrams/architecture-overview.png)

## Training Pipeline

![Training Pipeline](docs/diagrams/training-pipeline-flow.png)

[See more diagrams →](docs/diagrams/)
```

---

## Additional Notes

**Accessibility:**
- Ensure text is readable (minimum 12pt)
- Use sufficient color contrast
- Include alt text when adding to docs

**Consistency:**
- Same icon style across all diagrams
- Consistent node shapes (rectangles for services, circles for start/end points)
- Consistent arrow styles (solid = sync, dashed = async)

**Tools Recommendations:**
- **Figma** - Best for creating diagrams
- **Excalidraw** - Quick sketches, hand-drawn style
- **Mermaid.js** - Code-based diagrams (can be embedded in markdown)
- **draw.io** - Free alternative to Figma

---

**Need help?** These prompts are detailed enough to hand off to a designer or use with AI image generation tools. Adjust colors and styles to match your brand preferences!
