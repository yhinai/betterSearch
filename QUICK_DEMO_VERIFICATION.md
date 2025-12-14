# ⚡ Quick Demo Verification Guide

## 🚀 **5-MINUTE PRE-DEMO CHECK**

### **1. Start Servers** (1 min)
```bash
# Terminal 1: Backend
cd backend && python server.py
# Should see: "🧠 Neural Bridge Starting..." on port 8001

# Terminal 2: Frontend  
npm run dev
# Should open on http://localhost:3000
```

✅ **Check**: Both servers running, no errors in console

---

### **2. Test Critical Features** (2 min)

#### **A. Basic Chat** (30 sec)
- [ ] Login with username
- [ ] Type: "Hello"
- [ ] Verify: Response streams in

#### **B. Graphon Upload** (1 min) ⭐ CRITICAL
- [ ] Attach 1-2 PDF files
- [ ] Click "INGEST" (brain icon)
- [ ] Verify: Toast shows "Knowledge Graph Ready!"
- [ ] Enable Knowledge Mode (Cmd+K → Toggle Knowledge Mode)
- [ ] Ask: "What's in my documents?"
- [ ] Verify: Response includes citations (📄 🎥)

#### **C. Visualization** (30 sec)
- [ ] Ask: "Visualize a neural network architecture"
- [ ] Verify: Diagram generates
- [ ] Click diagram → Full-screen modal opens

✅ **Check**: All 3 critical features work

---

### **3. Prepare Demo Files** (1 min)
- [ ] 2-3 PDF research papers ready
- [ ] 1-2 images/diagrams ready
- [ ] (Optional) 1 video file ready

✅ **Check**: Files accessible and ready

---

### **4. Verify Settings** (1 min)
- [ ] Open Settings (gear icon)
- [ ] Verify: Provider = Google Gemini
- [ ] Verify: API key set (or in .env)
- [ ] Verify: Model = `gemini-3-pro-preview` or `gemini-2.5-flash`

✅ **Check**: Configuration correct

---

## 🎯 **DEMO FLOW (Visual Guide)**

```
┌─────────────────────────────────────────┐
│ 1. OPENING (30s)                        │
│    "Problem: Information overload"      │
│    Show empty interface                 │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│ 2. GRAPHON UPLOAD (1m) ⭐⭐⭐           │
│    [Attach Files] → [INGEST]            │
│    Show: "Building knowledge graph..."  │
│    Result: "Knowledge Graph Ready!"     │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│ 3. CROSS-MODAL QUERY (1.5m) ⭐⭐⭐      │
│    [Enable Knowledge Mode]              │
│    Ask: "Explain X from my documents"   │
│    Show: Citations with timestamps      │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│ 4. VISUALIZATION (1m) ⭐⭐⭐            │
│    Ask: "Visualize X architecture"      │
│    Show: Diagram generating             │
│    Click: Full-screen modal             │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│ 5. RESEARCH AGENT (1m) ⭐⭐⭐           │
│    [Enable Deep Research]               │
│    Ask complex question                 │
│    Show: Multi-step planning            │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│ 6. COMPARE MODE (30s) ⭐⭐              │
│    [Toggle COMPARE]                     │
│    Ask question                          │
│    Show: Split-screen dual responses    │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│ 7. SOCRATIC MODE (30s)                  │
│    [Toggle Mode] → Socratic             │
│    Ask: "How does X work?"              │
│    Show: AI asks questions back         │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│ 8. CLOSING (30s)                        │
│    Recap: Gemini 3 + Graphon            │
│    Impact: Future of research           │
└─────────────────────────────────────────┘
```

---

## 🎤 **KEY PHRASES (Memorize These)**

### **When Uploading:**
> "Graphon is building a relationship graph across all modalities in real-time"

### **When Querying:**
> "Notice how Gemini 3 reasons natively across video, PDF, and images simultaneously—this is native multimodality"

### **When Showing Citations:**
> "Exact citations with timestamps and page numbers—cross-modal search in action"

### **When Generating Visualization:**
> "Gemini 3 generates complete interactive visualizations, not just text—this is generative UI"

### **Closing Statement:**
> "This combines Gemini 3's native multimodality, 1M token context, and Graphon's trillion-token knowledge graphs. This couldn't have existed six months ago."

---

## ⚠️ **IF SOMETHING BREAKS**

| Problem | Quick Fix |
|---------|-----------|
| **Backend not starting** | Check Python version, install requirements: `pip install -r requirements.txt` |
| **Graphon upload fails** | Check API key in `backend/.env`, verify backend running |
| **No response from AI** | Check Gemini API key in `.env` or settings |
| **Visualization doesn't generate** | Try different prompt: "Create a diagram of..." |
| **Citations missing** | Verify Knowledge Mode is enabled (Cmd+K) |
| **Slow responses** | Expected for complex queries, show it's processing |

---

## ✅ **SUCCESS CRITERIA**

After 5-minute check, you should have:
- ✅ Both servers running
- ✅ Basic chat working
- ✅ Graphon upload successful
- ✅ Query with citations working
- ✅ Visualization generating
- ✅ Demo files ready
- ✅ Settings configured

**If all ✅**: You're ready! 🚀

**If any ❌**: Fix that item before demo starts

---

## 🎯 **ONE-LINER STATUS CHECK**

Run this in your head:
1. Backend? ✅ Port 8001
2. Frontend? ✅ Localhost 3000  
3. Graphon? ✅ API key set
4. Gemini? ✅ API key set
5. Files? ✅ Ready
6. Knowledge Mode? ✅ Works
7. Visualization? ✅ Works

**All ✅?** → **GO TIME! 🎉**
