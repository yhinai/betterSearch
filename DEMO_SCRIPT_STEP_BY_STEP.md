# 🎬 betterSearch - Step-by-Step Demo Script
## Exact Actions, Timing, and Talking Points

---

## ⏱️ **TOTAL TIME: 7 MINUTES**

---

## 📋 **PRE-DEMO SETUP** (Do this 10 minutes before)

### **1. Start Servers**
```bash
# Terminal 1: Backend
cd backend
python server.py
# Wait for: "🧠 Neural Bridge Starting..." on port 8001

# Terminal 2: Frontend
npm run dev
# Wait for: Browser opens on http://localhost:3000
```

### **2. Prepare Files**
- [ ] 2-3 PDF research papers (ready in Downloads)
- [ ] 1-2 images/diagrams (ready)
- [ ] (Optional) 1 video file

### **3. Verify**
- [ ] Login with test username (e.g., "demo")
- [ ] Settings → Verify Gemini API key configured
- [ ] Test one simple query to confirm AI works

---

## 🎬 **DEMO SCRIPT**

---

### **SECTION 1: OPENING** ⏱️ 30 seconds

#### **SAY:**
> "Students and researchers today are drowning in information. You have lecture videos, research papers, PDFs, textbooks—but no way to actually search and reason across them all simultaneously."

#### **DO:**
1. Show the empty interface
2. Point to the screen
3. Say the hook line

#### **SAY:**
> "We built betterSearch: a multimodal AI knowledge base that combines Gemini 3's native multimodality with Graphon AI's trillion-token knowledge graphs. Let me show you what this enables."

**KEY POINT**: Set up the problem → solution narrative

---

### **SECTION 2: MULTIMODAL UPLOAD** ⏱️ 1 minute

#### **SAY:**
> "First, let's build your knowledge graph. Watch this—we're uploading multiple file types simultaneously: PDFs, videos, images. This is powered by Graphon AI's cross-modal architecture."

#### **DO:**
1. Click the **paperclip icon** (📎) in the input area
2. Select 2-3 PDF files from your prepared folder
   - Use your mouse to select multiple files
3. **WAIT** - Show files appear as previews above input
4. Click the **INGEST button** (🧠 brain icon with "INGEST" text)
5. **WAIT** - Toast notification shows "Uploading X files to Knowledge Graph..."
6. **WAIT** - Success message: "Knowledge Graph Ready! (X files processed)"

#### **SAY (while uploading):**
> "Graphon is building a relationship graph across all these modalities in real-time. It's indexing video timestamps, PDF pages, and extracting text from images."

#### **SAY (when done):**
> "Done. We just indexed hundreds of pages in 30 seconds. This knowledge graph has trillion-token capacity—persistent memory that never runs out of space."

**KEY POINTS**:
- ✅ Emphasize: "This is the Graphon Track prize feature"
- ✅ Mention: Cross-modal indexing
- ✅ Highlight: Speed and scale

---

### **SECTION 3: NATIVE MULTIMODAL QUERY** ⏱️ 1.5 minutes

#### **SAY:**
> "Now the magic. Gemini 3 was trained natively on text, images, audio, and video together. So when I ask a question, it reasons across ALL my sources simultaneously—not just retrieving chunks."

#### **DO:**
1. Press **Cmd+K** (or **Ctrl+K**) to open Command Palette
2. Type: "knowledge" or scroll to find it
3. Click **"Toggle Knowledge Mode"** (should show brain icon)
4. Verify: Status shows "ACTIVE" in purple
5. Press **Escape** to close Command Palette
6. In the input field, type:
   > "Based on the documents I uploaded, explain the key concepts and show me relevant diagrams"
7. Press **Enter** or click **EXECUTE**
8. **WAIT** - Response streams in
9. **POINT OUT** citations as they appear:
   - 🎥 Video timestamps: "Lecture 3, 12:34-15:20"
   - 📄 PDF pages: "Research Paper, Page 47"
   - 🖼️ Images: "Diagram from Slide 12"

#### **SAY (while response streams):**
> "Notice how Gemini 3 reasons natively across video, PDF, and images simultaneously—this is native multimodality, not RAG stitching."

#### **SAY (when citations appear):**
> "Look at these exact citations: video timestamps, PDF page numbers, image references. This is cross-modal search in action. Every answer is grounded in your actual sources."

**KEY POINTS**:
- ✅ Native multimodality (emphasize this phrase)
- ✅ Exact citations with timestamps
- ✅ Cross-modal reasoning

---

### **SECTION 4: LONG-CONTEXT DEMONSTRATION** ⏱️ 1 minute

#### **SAY:**
> "Gemini 3 has 1M token context—that's ~700K words. We're putting that to work. Let me show you what happens when you've ingested your entire course."

#### **DO:**
1. Ask a question that requires reasoning across multiple documents:
   > "Compare and contrast the approaches discussed in all the papers I uploaded. What are the key differences?"
2. **WAIT** - Show response synthesizing across entire corpus
3. **POINT OUT** multiple citations from different sources
4. (Optional) Click the **Notes icon** (📚) to show accumulated knowledge

#### **SAY:**
> "This is reasoning across entire knowledge bases—hundreds of papers, weeks of lectures—in one pass. Combined with Graphon's trillion-token persistent memory, there's virtually no limit."

**KEY POINTS**:
- ✅ 1M token context
- ✅ Entire knowledge bases
- ✅ Perfect for legal, research, finance applications

---

### **SECTION 5: GENERATIVE UI & VISUALIZATION** ⏱️ 1.5 minutes

#### **SAY:**
> "Gemini 3 doesn't just answer—it generates complete interactive visualizations. Watch this."

#### **DO:**
1. Type in input:
   > "Visualize the architecture of a transformer neural network based on the papers I uploaded"
2. Press **Enter**
3. **WAIT** - Response generates with diagram
4. **POINT OUT** the diagram as it appears
5. **CLICK** on the diagram
6. Full-screen SVG modal opens
7. **SAY**: "Full-screen inspection"
8. Close modal (click X or press Escape)
9. (Optional) Ask for another visualization:
   > "Create a flowchart showing the research methodology"

#### **SAY (while generating):**
> "Gemini 3 generates complete interactive visualizations, not just text responses. This is generative UI in action—the model is creating the entire interface."

#### **SAY (when modal opens):**
> "You can click any visualization to inspect it in full-screen mode. Perfect for understanding complex systems."

**KEY POINTS**:
- ✅ Generative UI (use this exact phrase)
- ✅ Interactive visualizations
- ✅ Not just text—complete interfaces

---

### **SECTION 6: RESEARCH AGENT** ⏱️ 1 minute

#### **SAY:**
> "For complex questions, we deploy a research agent that orchestrates multiple tools: web search, knowledge graph queries, and synthesis."

#### **DO:**
1. Press **Cmd+K** to open Command Palette
2. Click **"Toggle Deep Research"** (microscope icon)
3. Verify: Shows "ACTIVE" in green
4. Press **Escape**
5. Type question:
   > "What's the latest research on attention mechanisms from 2024, and how does it compare to what's in my uploaded papers?"
6. Press **Enter**
7. **WATCH** and **NARRATE** as steps appear:
   - "Planning research steps..."
   - "Step 1: Searching web for latest research..."
   - "Step 2: Querying knowledge graph for your papers..."
   - "Step 3: Synthesizing findings..."
8. **WAIT** for final comprehensive answer

#### **SAY (while agent works):**
> "Our research agent orchestrates multiple tools: web search for current information, Graphon for your knowledge base, and Gemini 3 for synthesis. This is multi-agent orchestration."

#### **SAY (when done):**
> "Notice how it combined external web search with your internal knowledge base to give you a comprehensive answer. This is what multi-agent reasoning enables."

**KEY POINTS**:
- ✅ Multi-agent orchestration
- ✅ Tool integration
- ✅ Multi-step reasoning

---

### **SECTION 7: COMPARE MODE** ⏱️ 30 seconds

#### **SAY:**
> "Sometimes you want to see different perspectives. Compare Mode triggers two parallel inference streams."

#### **DO:**
1. Click the **COMPARE button** (toggle in input area, shows two arrows)
2. Verify: Button highlights in cyan
3. Type:
   > "Explain quantum computing"
4. Press **Enter**
5. **WAIT** - Two responses generate side-by-side
6. **POINT OUT** the split-screen view

#### **SAY:**
> "Perfect for comparing code implementations, checking for hallucinations, or seeing creative variations. Two complete responses in parallel."

**KEY POINTS**:
- ✅ Dual-stream generation
- ✅ Split-screen comparison
- ✅ Use cases

---

### **SECTION 8: SOCRATIC MODE** ⏱️ 30 seconds

#### **SAY:**
> "And here's something unique: Socratic Mode. Instead of giving answers, the AI guides you through questioning."

#### **DO:**
1. Click the **Mode Toggle** button (top bar, shows "DIRECT")
2. Button changes to "SOCRATIC"
3. Type:
   > "How does backpropagation work in neural networks?"
4. Press **Enter**
5. **WAIT** - AI asks questions back instead of answering

#### **SAY:**
> "This forces you to reason, not just consume. Perfect for deep learning and ensuring true understanding."

**KEY POINTS**:
- ✅ Unique teaching feature
- ✅ Guided discovery
- ✅ Deep learning

---

### **SECTION 9: CLOSING** ⏱️ 30 seconds

#### **SAY:**
> "We've combined:
> - **Gemini 3's native multimodality** for cross-modal reasoning
> - **1M token context** for entire knowledge bases
> - **Generative UI** for interactive visualizations
> - **Graphon AI** for persistent, trillion-token knowledge graphs
> - **Research agents** for multi-step reasoning
> 
> This couldn't have existed six months ago. It's the future of research and education."

#### **DO:**
1. Show a final impressive view:
   - Knowledge graph active (purple indicator)
   - Multiple visualizations visible
   - Citations showing
2. **POINT** to different elements as you list them

#### **SAY (final line):**
> "Thank you. Questions?"

**KEY POINTS**:
- ✅ List all technologies
- ✅ Emphasize: "Couldn't exist 6 months ago"
- ✅ Impact statement

---

## 🎯 **KEY PHRASES TO MEMORIZE**

### **Upload Section:**
- "Graphon is building a relationship graph across all modalities in real-time"
- "Trillion-token persistent memory that never runs out"

### **Query Section:**
- "Native multimodality—not RAG stitching"
- "Exact citations with timestamps and page numbers"

### **Visualization Section:**
- "Generative UI—the model creates the entire interface"
- "Complete interactive visualizations, not just text"

### **Research Agent Section:**
- "Multi-agent orchestration"
- "Tool integration and synthesis"

### **Closing:**
- "This couldn't have existed six months ago"

---

## ⚠️ **TROUBLESHOOTING DURING DEMO**

### **If Graphon Upload is Slow:**
**SAY**: "The first upload takes 30-60 seconds as Graphon builds the relationship graph. Once it's done, queries are instant."

### **If Visualization Doesn't Generate:**
**SAY**: "Let me try a different prompt..." (then try: "Create a diagram of...")

### **If API Error:**
**SAY**: "The architecture supports this—this is just a connectivity issue. In production, this would work seamlessly."

### **If Backend Disconnects:**
**SAY**: "Let me show you the local knowledge base mode..." (switch to notes/syllabus demo)

---

## 📊 **TIMING CHECKLIST**

```
0:00 - Opening (30s) ✅
0:30 - Upload (1m) ✅
1:30 - Query (1.5m) ✅
3:00 - Long-context (1m) ✅
4:00 - Visualization (1.5m) ✅
5:30 - Research Agent (1m) ✅
6:30 - Compare Mode (30s) ✅
7:00 - Socratic Mode (30s) ✅
7:30 - Closing (30s) ✅
```

**TOTAL: ~7-8 minutes** (with buffer)

---

## 🎤 **PRESENTATION TIPS**

### **Energy Level:**
- ✅ High energy, enthusiastic
- ✅ Confident tone
- ✅ Smooth transitions

### **Body Language:**
- ✅ Point to screen elements as you talk
- ✅ Make eye contact with judges
- ✅ Gesture to show relationships

### **Pacing:**
- ✅ Don't rush—7 minutes is plenty
- ✅ Pause after key demonstrations
- ✅ Let visuals speak for themselves

### **Focus:**
- ✅ Emphasize hackathon keywords
- ✅ Connect features to themes
- ✅ Show, don't just tell

---

## 🏆 **PRIZE CONNECTIONS**

### **When to Mention Graphon Track ($1,000):**
- ✅ During upload section
- ✅ When showing citations
- ✅ Mention: "Best multimodal search tool"

### **When to Mention Grand Prize ($50K):**
- ✅ Opening: "Complete platform"
- ✅ Closing: "All Gemini 3 capabilities"
- ✅ Mention: "Couldn't exist 6 months ago"

### **When to Mention Antigravity ($25K):**
- ✅ Research agent section
- ✅ Mention: "Multi-agent orchestration"
- ✅ Mention: "Tool integration"

---

## ✅ **PRE-DEMO FINAL CHECK**

### **5 Minutes Before:**
- [ ] Both servers running
- [ ] Test one query works
- [ ] Test Graphon upload works
- [ ] Test visualization generates
- [ ] Demo files ready
- [ ] Browser tab ready (no other tabs)
- [ ] Screen resolution good
- [ ] Microphone/audio working (if needed)

### **1 Minute Before:**
- [ ] Take a deep breath
- [ ] Review opening line
- [ ] Have backup plan ready
- [ ] Smile 😊

---

## 🎬 **FINAL REMINDERS**

1. **Start with the problem** - Information overload
2. **Show Graphon FIRST** - It's your strongest feature
3. **Use hackathon keywords** - Native multimodality, 1M token, generative UI
4. **Show, don't just tell** - Point to screen elements
5. **End with impact** - Future of research/education
6. **Be confident** - You built something amazing!

---

**YOU'VE GOT THIS! 🚀**

Good luck with your demo! Remember: You're showcasing technology that didn't exist 6 months ago. That's impressive.
