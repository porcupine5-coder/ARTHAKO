import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, Send, Mic, X, Minimize2, Maximize2 } from 'lucide-react'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export default function TradingAssistant() {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "🌅 Namaste! I'm your knowledgeable NEPSE Stock Market AI Assistant. I'm here to help you make informed investment decisions by providing real-time market insights, company analysis, and personalized recommendations.\n\nI can help you with:\n• 📊 NEPSE market updates and trends\n• 🏢 Company analysis for Nepal's top 200 listed companies\n• 🔮 Future predictions and price targets\n• 💡 Investment recommendations based on your risk profile\n• 📚 Stock market education and term explanations\n• 💰 Portfolio analysis and diversification advice\n\nWhat would you like to explore today?",
      timestamp: new Date()
    }
  ])
  const [input, setInput] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const recognitionRef = useRef<any>(null)
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])
  
  useEffect(() => {
    // Initialize speech recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
      recognitionRef.current = new SpeechRecognition()
      recognitionRef.current.continuous = false
      recognitionRef.current.interimResults = false
      
      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript
        setInput(transcript)
        setIsListening(false)
      }
      
      recognitionRef.current.onerror = () => {
        setIsListening(false)
      }
      
      recognitionRef.current.onend = () => {
        setIsListening(false)
      }
    }
  }, [])
  
  const handleSend = async () => {
    if (!input.trim()) return
    
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    }
    
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsTyping(true)
    
    // Simulate AI response
    setTimeout(() => {
      const response = generateResponse(input)
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, assistantMessage])
      setIsTyping(false)
    }, 1000)
  }
  
  const generateResponse = (query: string): string => {
    const lowerQuery = query.toLowerCase()
    
    // Greetings and casual conversation
    if (lowerQuery.match(/^(hi|hey|hello|namaste|good morning|good afternoon|good evening|yo|sup|wassup|greetings)\b/i)) {
      const greetings = [
        "Hey there! 👋 Great to see you! I'm your NEPSE AI assistant, ready to help you navigate the Nepal Stock Exchange. How's your portfolio doing today?",
        "Hello! 😊 Welcome back! I'm here to help you with anything related to NEPSE - whether it's market updates, stock analysis, or investment advice. What's on your mind?",
        "Namaste! 🙏 Nice to chat with you! I'm your friendly NEPSE expert. Looking to check the market trends, analyze a company, or maybe discuss your investment strategy?",
        "Hi! 🌟 I'm excited to help you today! Whether you're tracking NEPSE performance, researching stocks, or planning your next investment move, I've got you covered. What would you like to know?",
        "Hey! 👋 Good to hear from you! As your NEPSE AI companion, I'm here to make stock market investing easier and smarter for you. Ready to dive into the market?"
      ]
      return greetings[Math.floor(Math.random() * greetings.length)]
    }
    
    // How are you / casual questions
    if (lowerQuery.match(/how are you|how r u|what's up|whats up|how do you do|how's it going/i)) {
      const responses = [
        "I'm doing great, thanks for asking! 😊 Just been analyzing NEPSE trends and watching the market closely. The hydropower sector is showing some interesting momentum today! How about you - are you keeping an eye on any particular stocks?",
        "Fantastic! 🚀 I've been busy crunching numbers and tracking market movements. NEPSE has been quite active lately! How's your investment journey going? Any stocks you're watching?",
        "I'm wonderful, thank you! 💫 Just finished analyzing today's market data. Some exciting opportunities in the banking sector! What about you - anything specific you'd like to discuss about your investments?",
        "Doing amazing! 🌟 The NEPSE market always keeps me energized! I've been tracking some promising patterns. How are your investments performing? Need any insights?"
      ]
      return responses[Math.floor(Math.random() * responses.length)]
    }
    
    // Thank you
    if (lowerQuery.match(/thank you|thanks|thank u|thx|appreciate/i)) {
      const responses = [
        "You're very welcome! 😊 Happy to help anytime. If you need more insights about NEPSE or want to discuss investment strategies, I'm always here. Good luck with your investments!",
        "My pleasure! 🌟 That's what I'm here for! Feel free to ask me anything about the market anytime. Wishing you profitable trades!",
        "Glad I could help! 💡 Remember, I'm always available if you have more questions about stocks, market trends, or investment decisions. Happy investing!",
        "Anytime! 👍 I love helping investors like you make informed decisions. Come back whenever you need market insights or advice. Best of luck with your portfolio!"
      ]
      return responses[Math.floor(Math.random() * responses.length)]
    }
    
    // Help or what can you do
    if (lowerQuery.match(/help|what can you|capabilities|what do you do|tell me about yourself/i)) {
      return "Great question! Let me tell you what I can do for you 😊\n\nI'm your personal NEPSE AI assistant, and I'm here to:\n\n📊 **Market Intelligence:**\n• Give you real-time NEPSE index updates\n• Track sector performance (Banking, Hydropower, Insurance, etc.)\n• Alert you about market-moving events\n• Explain what's driving the market up or down\n\n🏢 **Company Deep Dives:**\n• Analyze any of Nepal's top 200 listed companies\n• Provide financial metrics (P/E, EPS, Book Value, ROE)\n• Share price targets and predictions\n• Give Buy/Hold/Sell recommendations\n\n💼 **Portfolio Optimization:**\n• Assess your portfolio risk\n• Suggest diversification strategies\n• Track your investment performance\n• Help you rebalance for better returns\n\n🔮 **Smart Planning:**\n• Run 'what if' investment scenarios\n• Predict future stock movements\n• Plan your investment strategy\n• Calculate risk-reward ratios\n\n📚 **Education & Learning:**\n• Explain stock market terms in simple language\n• Teach beginner investment strategies\n• Share NEPSE trading tips\n• Guide you through risk management\n\nJust chat with me naturally! Ask things like:\n• \"What's NEPSE doing today?\"\n• \"Should I buy NABIL?\"\n• \"How risky is my portfolio?\"\n• \"What does P/E ratio mean?\"\n\nI'm here to make investing in NEPSE easier and more profitable for you! What would you like to explore first? 🎯"
    }
    
    // Bye / goodbye
    if (lowerQuery.match(/bye|goodbye|see you|gotta go|talk later|catch you later/i)) {
      const responses = [
        "Goodbye! 👋 It was great chatting with you! May your investments be profitable and your portfolio grow strong. Come back anytime you need NEPSE insights!",
        "See you later! 🌟 Best of luck with your investments! Remember, I'm always here when you need market analysis or investment advice. Happy trading!",
        "Take care! 😊 Wishing you green candles and rising portfolios! Don't hesitate to reach out whenever you need help with NEPSE. Catch you later!",
        "Bye for now! 💫 May the NEPSE be with you! Come back soon if you need any stock market guidance. Happy investing!"
      ]
      return responses[Math.floor(Math.random() * responses.length)]
    }
    
    // Who are you / introduce yourself
    if (lowerQuery.match(/who are you|introduce yourself|tell me about you|what are you/i)) {
      return "Nice to meet you! 🤝 Let me introduce myself properly:\n\nI'm your **NEPSE AI Assistant** - think of me as your personal financial advisor who specializes in the Nepal Stock Exchange! 🇳🇵\n\n**What makes me special:**\n• I know NEPSE inside-out - all 200+ listed companies!\n• I track market trends 24/7 and stay updated on Nepal's economy\n• I analyze stocks using both fundamental and technical analysis\n• I speak your language - no confusing jargon, just clear insights\n• I'm always learning and improving to serve you better\n\n**My mission:** To help everyday Nepali investors like you make smarter, more confident investment decisions. Whether you're a complete beginner or an experienced trader, I'm here to guide you!\n\n**What I care about:**\n• Your financial success and portfolio growth\n• Helping you avoid costly mistakes\n• Teaching you to become a better investor\n• Making NEPSE accessible and understandable for everyone\n\n**Fun fact:** I've analyzed thousands of NEPSE trading patterns and can spot opportunities faster than you can say \"Upper Tamakoshi\"! 😄\n\nBut enough about me - I'm more interested in YOU! What brings you here today? Looking to invest, check your portfolio, or learn about the market?"
    }
    
    // Portfolio and holdings queries
    if (lowerQuery.includes('portfolio') || lowerQuery.includes('holdings')) {
      return "📊 **Your Portfolio Analysis:**\n\nCurrent Value: NPR 2.5M (+12.5% gain)\n\n**Holdings Breakdown:**\n• Banking: 40% (NABIL, HBL, EBL)\n• Hydropower: 35% (UPPER, NHPC)\n• Insurance: 25% (NLG, SICL)\n\n**Top Performers:**\n📈 UPPER: +18.5% returns\n📈 NABIL: +10.2% returns\n\n**Risk Score:** 6.2/10 (Moderate)\n\n⚠️ **Recommendation:** Your 40% banking concentration is slightly high. Consider diversifying into Manufacturing or Hotels sectors for better balance.\n\n💡 Remember: Diversification is key to managing risk in NEPSE!\n\nWould you like detailed analysis of any specific holding?"
    }
    
    // What-if scenario analysis
    if (lowerQuery.includes('what if') || lowerQuery.includes('scenario')) {
      return "🔮 **Scenario Analysis:**\n\nLet's model your investment scenario!\n\nIf you invest NPR 100,000 in top 3 banking stocks (NABIL, EBL, HBL) today:\n\n**6-Month Projections:**\n📈 Bull Case: +15% → NPR 115,000\n🎯 Base Case: +8% → NPR 108,000\n📉 Bear Case: -3% → NPR 97,000\n\n**Key Assumptions:**\n• Based on historical Q2-Q3 performance\n• Assuming stable political environment\n• NRB policy rates remain steady\n• Sectoral P/E ratios normalize\n\n⚠️ **Risk Factors:**\n- Banking sector already near fair value\n- Interest rate volatility\n- Regulatory changes\n\n💡 **Alternative Strategy:** Consider hydropower stocks for higher growth potential (UPPER, NHPC showing strong momentum).\n\n📌 Disclaimer: These are projections, not guarantees. Always do your own research!\n\nWant to model a different scenario?"
    }
    
    // Buy/Sell recommendations
    if (lowerQuery.includes('buy') || lowerQuery.includes('sell') || lowerQuery.includes('recommend')) {
      return "💡 **Current Market Recommendations:**\n\n**BUY Recommendations:**\n✅ UPPER (Hydropower) - Strong momentum, +18.5% trend\n   • Entry: NPR 280-285\n   • Target: NPR 320 (6 months)\n   • P/E: 18.2 (Fair for growth)\n\n✅ NABIL (Banking) - Solid fundamentals, undervalued\n   • Entry: NPR 880-900\n   • Target: NPR 1,000 (1 year)\n   • P/E: 11.5 (Below sector avg of 13)\n\n**HOLD Recommendations:**\n⚠️ HBL (Banking) - Wait for dip\n   • Current: NPR 545\n   • Buy below: NPR 500\n   • Reason: Slightly overvalued short-term\n\n**REDUCE Exposure:**\n🔴 Insurance Sector - Showing weakness\n   • Sector down -3.2% this week\n   • High P/E ratios (avg 22+)\n   • Consider profit booking\n\n**Investment Strategy Tips:**\n1. Start with blue-chip stocks if you're a beginner\n2. Diversify across 3-4 sectors minimum\n3. Don't invest money you can't afford to lose\n4. Use T+2 settlement cycle wisely\n\n📌 **Disclaimer:** This is educational analysis based on current data, not financial advice. Past performance doesn't guarantee future results. Consult a licensed financial advisor for personalized guidance.\n\nNeed analysis on a specific company?"
    }
    
    // Risk and diversification
    if (lowerQuery.includes('risk') || lowerQuery.includes('diversif')) {
      return "⚠️ **Portfolio Risk Assessment:**\n\n**Your Risk Score: 6.2/10 (Moderate)**\n\n**Risk Analysis:**\n\n📊 **Sector Concentration:**\n• Banking: 40% ⚠️ (Recommended max: 30%)\n• Hydropower: 35% ✅ (Good)\n• Insurance: 25% ✅ (Good)\n• Missing: Manufacturing, Hotels, Microfinance\n\n📈 **Volatility Metrics:**\n• Average portfolio volatility: 15%\n• NEPSE index volatility: 12%\n• Your portfolio is 25% more volatile than market\n\n💡 **Diversification Recommendations:**\n\n1. **Reduce Banking to 30%:**\n   - Sell 10% of HBL holdings\n   - Reinvest in other sectors\n\n2. **Add Manufacturing (10-15%):**\n   - Consider: Shivam Cement, Unilever Nepal\n   - Stable dividend payers\n   - Low correlation with financial sector\n\n3. **Add Hotels/Tourism (5-10%):**\n   - Consider: Oriental Hotels, Soaltee Hotel\n   - Seasonal stocks with good upside\n\n4. **Include Stable Dividend Stocks:**\n   - Target: 4-6% dividend yield\n   - Examples: Citizen Bank, Kumari Bank\n\n**Recommended Portfolio Mix:**\n• Banking & Finance: 30%\n• Hydropower: 30%\n• Insurance: 15%\n• Manufacturing: 15%\n• Hotels/Others: 10%\n\n📌 **Remember:** Diversification reduces risk but doesn't eliminate it. Review your portfolio quarterly.\n\nWould you like specific stock recommendations for diversification?"
    }
    
    // Market overview and NEPSE
    if (lowerQuery.includes('market') || lowerQuery.includes('nepse') || lowerQuery.includes('index')) {
      return "📊 **Current NEPSE Market Overview:**\n\n**Index Performance:**\n• NEPSE Index: 2,115.28 (+0.28%)\n• NEPSE Sensitive: 398.45 (+0.15%)\n• NEPSE Float: 148.32 (+0.31%)\n\n**Market Sentiment:**\n📈 Bullish (87% confidence)\n• Strong institutional buying\n• Retail investor participation increasing\n• Breaking key resistance levels\n\n**Trading Activity:**\n💰 Volume: 62.5M shares\n💵 Turnover: NPR 3.2 Billion (above avg)\n📊 Transactions: 58,420\n\n**Sector Performance:**\n🔥 **Hot Sectors:**\n• Hydropower: +15.2% (month)\n• Banking: +8.5% (month)\n• Development Banks: +6.8%\n\n❄️ **Cool Sectors:**\n• Insurance: -3.2% (week)\n• Hotels: -1.5% (week)\n• Microfinance: -0.8%\n\n**Market Drivers:**\n✅ Positive monsoon impact on hydropower\n✅ Stable NRB policy rates\n✅ Strong Q4 earnings expectations\n⚠️ Global market volatility concerns\n\n**Trading Hours Reminder:**\n🕐 Sunday-Thursday: 11:00 AM - 3:00 PM\n📅 Closed: Friday-Saturday\n\n**Key Upcoming Events:**\n• 5 IPOs opening next week\n• 12 AGMs scheduled this month\n• Book closures: UPPER (Nov 20), NABIL (Nov 25)\n\n💡 **Market Outlook:** The market is showing strong momentum with institutional buying, particularly in hydropower stocks. However, insurance sector weakness and global uncertainties warrant cautious optimism.\n\nWant details on any specific sector?"
    }
    
    // Stock terms education
    if (lowerQuery.includes('what is') || lowerQuery.includes('explain') || lowerQuery.includes('meaning') || lowerQuery.includes('p/e') || lowerQuery.includes('eps') || lowerQuery.includes('ipo') || lowerQuery.includes('demat')) {
      return "📚 **NEPSE Stock Market Terms Explained:**\n\nI can explain these key terms to you:\n\n**Basic Terms:**\n• NEPSE - Nepal Stock Exchange\n• SEBON - Securities Board of Nepal\n• Demat Account - Digital share storage\n• MeroShare - Online IPO application system\n• Broker - Licensed trading intermediary\n\n**Trading Terms:**\n• IPO - Initial Public Offering (new shares)\n• FPO - Follow-on Public Offering\n• Right Share - Existing shareholder privilege\n• Bonus Share - Free shares from reserves\n• Book Closure - Date when share transfers stop\n• AGM - Annual General Meeting\n• Dividend - Profit distribution (Cash/Stock)\n\n**Price Terms:**\n• LTP - Last Traded Price\n• LTV - Last Traded Volume\n• Circuit Breaker - 10% daily limit (up/down)\n• Bull Market - Upward trend\n• Bear Market - Downward trend\n• Market Correction - Price adjustment\n\n**Analysis Terms:**\n• P/E Ratio - Price-to-Earnings ratio\n• EPS - Earnings Per Share\n• Book Value - Net asset value per share\n• ROE - Return on Equity\n• Paid-up Capital - Total issued shares value\n\n**Trading Mechanics:**\n• T+2 Settlement - Payment 2 days after trade\n• Floor Sheet - Detailed trade records\n• Market Order - Buy/sell at current price\n• Limit Order - Buy/sell at specified price\n\n💡 **Which term would you like me to explain in detail?**\n\nFor example, ask:\n• \"Explain P/E ratio\"\n• \"What is Demat account?\"\n• \"How does IPO work?\"\n• \"What is circuit breaker?\""
    }
    
    // Company analysis
    if (lowerQuery.includes('nabil') || lowerQuery.includes('upper') || lowerQuery.includes('nic') || lowerQuery.includes('analyze')) {
      return "🏢 **Company Analysis Request:**\n\nI can provide detailed analysis for any of Nepal's top 200 listed companies!\n\n**Popular Companies:**\n\n**Banking Sector:**\n• NABIL - Nabil Bank Ltd.\n• NIB - Nepal Investment Bank\n• HBL - Himalayan Bank\n• EBL - Everest Bank\n\n**Hydropower Sector:**\n• UPPER - Upper Tamakoshi Hydropower\n• NHPC - Nepal Hydro & Electric\n• CHL - Chilime Hydropower\n\n**Insurance Sector:**\n• NLG - Nepal Life Insurance\n• SICL - Sagarmatha Insurance\n\n**What I can analyze:**\n📊 Financial metrics (P/E, EPS, Book Value)\n📈 Price trends and momentum\n💰 Dividend history\n🎯 Price targets (Bull/Base/Bear case)\n⚠️ Risk assessment\n💡 Buy/Hold/Sell recommendation\n\n**Just ask:**\n• \"Analyze NABIL\"\n• \"Should I buy UPPER?\"\n• \"Compare NABIL vs NIB\"\n• \"What's UPPER's target price?\"\n\nWhich company would you like me to analyze?"
    }
    
    // Default fallback - casual and friendly
    return "I hear you! 😊 Though I'm not quite sure what you're asking about. \n\nI'm great at discussing:\n• NEPSE market trends and index performance\n• Individual stock analysis (NABIL, UPPER, HBL, etc.)\n• Portfolio management and risk assessment\n• Investment strategies and predictions\n• Stock market terminology and education\n\nCould you rephrase your question or ask me about any of these topics? I'm here to help make your NEPSE investing journey successful! 💪"
  }
  
  const toggleVoice = () => {
    if (isListening) {
      recognitionRef.current?.stop()
      setIsListening(false)
    } else {
      recognitionRef.current?.start()
      setIsListening(true)
    }
  }
  
  if (!isOpen) {
    return (
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-gradient-to-br from-neon-blue to-electric-purple shadow-lg flex items-center justify-center z-40 hover:shadow-xl transition-shadow"
      >
        <MessageCircle className="text-white" size={24} />
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-slate-900 animate-pulse" />
      </motion.button>
    )
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      className={`fixed ${isMinimized ? 'bottom-6 right-6' : 'bottom-6 right-6'} z-50`}
    >
      <div className={`glass rounded-xl shadow-2xl overflow-hidden ${isMinimized ? 'w-80' : 'w-96'}`}>
        {/* Header */}
        <div className="bg-gradient-to-r from-neon-blue to-electric-purple p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <MessageCircle size={20} className="text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-white">NEPSE AI Assistant</h3>
              <p className="text-xs text-white/80">🟢 Online • Nepal Stock Exchange Expert</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              title={isMinimized ? "Maximize" : "Minimize"}
              aria-label={isMinimized ? "Maximize chat" : "Minimize chat"}
            >
              {isMinimized ? <Maximize2 size={16} className="text-white" /> : <Minimize2 size={16} className="text-white" />}
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              title="Close"
              aria-label="Close chat"
            >
              <X size={16} className="text-white" />
            </button>
          </div>
        </div>
        
        {!isMinimized && (
          <>
            {/* Messages */}
            <div className="h-96 overflow-y-auto p-4 space-y-4 bg-slate-900/50">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      message.role === 'user'
                        ? 'bg-gradient-to-br from-neon-blue to-electric-purple text-white'
                        : 'bg-white/10 text-gray-200'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-line">{message.content}</p>
                    <p className="text-xs opacity-60 mt-1">
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </motion.div>
              ))}
              
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start"
                >
                  <div className="bg-white/10 rounded-lg p-3">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </motion.div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
            
            {/* Input */}
            <div className="p-4 bg-slate-900/70 border-t border-white/10">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Ask me anything..."
                  className="flex-1 bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-neon-blue transition-colors"
                />
                <button
                  onClick={toggleVoice}
                  className={`p-2 rounded-lg transition-colors ${
                    isListening
                      ? 'bg-red-500 hover:bg-red-600'
                      : 'bg-white/10 hover:bg-white/20'
                  }`}
                  title="Voice input"
                >
                  <Mic size={20} className={isListening ? 'animate-pulse' : ''} />
                </button>
                <button
                  onClick={handleSend}
                  disabled={!input.trim()}
                  className="p-2 bg-gradient-to-br from-neon-blue to-electric-purple rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Send message"
                  aria-label="Send message"
                >
                  <Send size={20} />
                </button>
              </div>
              
              {/* Quick Actions */}
              <div className="mt-3 flex flex-wrap gap-2">
                {['What\'s NEPSE doing?', 'Analyze NABIL', 'Portfolio risk?', 'Explain P/E ratio', 'IPO calendar', 'Diversify portfolio'].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => setInput(suggestion)}
                    className="px-3 py-1 text-xs bg-white/5 hover:bg-white/10 rounded-full border border-white/10 transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </motion.div>
  )
}