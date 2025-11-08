// src/pages/Chatbot.tsx
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Send, Bot, Loader2 } from "lucide-react"; 
// import { toast } from "sonner"; // No longer needed
// import { supabase } from "@/lib/supabaseClient"; // No longer needed
import { Avatar, AvatarFallback } from "@/components/ui/avatar"; 

interface Message {
  role: "user" | "assistant";
  content: string;
}

// --- NEW: Preset replies for the mock chatbot ---
const presetReplies = [
  "That's a great question! For oil palm, it's generally recommended to test your soil every 2 years to check for nutrient deficiencies.",
  "Intercropping with crops like banana or turmeric can be very profitable during the first 3-4 years of your oil palm's growth.",
  "Under the NMEO-OP scheme, you might be eligible for subsidies on planting materials and borewells. I recommend checking the official portal.",
  "For pest control, it's best to use integrated pest management (IPM) techniques. Avoid heavy use of chemical pesticides unless absolutely necessary.",
  "The ideal spacing for oil palm is typically 9 meters by 9 meters in a triangular pattern. This allows for optimal sunlight and growth."
];
// ------------------------------------------------

const Chatbot = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Namaste! I'm your Palm Mitra AI assistant. How can I help you with oil palm farming today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [farmerInitial, setFarmerInitial] = useState("🧑‍🌾"); 

  // Get farmer initial on load
  useEffect(() => {
    const profile = localStorage.getItem("farmerProfile");
    if (profile) {
      try {
        const data = JSON.parse(profile);
        setFarmerInitial(data.name?.charAt(0).toUpperCase() || "🧑‍🌾");
      } catch (e) { console.error("Couldn't parse profile for initial"); }
    }
  }, []);


  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]); // Scroll whenever messages change

  // --- MODIFIED handleSend function ---
  const handleSend = async () => {
    const prompt = input.trim();
    if (!prompt) return;

    const userMessage: Message = { role: "user", content: prompt };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    // --- MOCK RESPONSE LOGIC ---
    // Simulate a network delay
    setTimeout(() => {
      // Pick a random reply from our preset list
      const randomReply = presetReplies[Math.floor(Math.random() * presetReplies.length)];
      
      const botMessage: Message = {
        role: "assistant",
        content: randomReply
      };

      setMessages((prev) => [...prev, botMessage]);
      setIsLoading(false);
      
      // Re-focus the input
      const inputElement = document.getElementById("chat-input");
      if(inputElement) inputElement.focus();
      
    }, 1200); // 1.2-second delay
    // --- END MOCK RESPONSE LOGIC ---
  };
  // ---------------------------------


  return (
    <div className="min-h-screen bg-gradient-subtle flex flex-col h-screen"> {/* Ensure full height */}
      {/* Header */}
      <div className="bg-card border-b shadow-soft p-3 sm:p-4 flex-shrink-0"> {/* Adjusted padding */}
        <div className="container mx-auto max-w-4xl flex items-center gap-2 sm:gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2 sm:gap-3">
             <Avatar className="w-8 h-8 sm:w-10 sm:h-10">
                 <AvatarFallback className="bg-primary text-primary-foreground">
                    <Bot className="w-4 h-4 sm:w-5 sm:h-5"/>
                 </AvatarFallback>
             </Avatar>
            <div>
              <h1 className="text-base sm:text-lg font-bold">Expert Assistant</h1>
              {/* Updated subtitle */}
              <p className="text-xs text-muted-foreground">Ask me anything about Oil Palm</p>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      {/* Added flex-1 and overflow-y-auto */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="container mx-auto max-w-4xl space-y-4">
          {messages.map((message, idx) => (
            <div
              key={idx}
              className={`flex items-end gap-2 ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {/* Assistant Avatar */}
              {message.role === 'assistant' && (
                   <Avatar className="w-8 h-8 mb-1 flex-shrink-0">
                       <AvatarFallback className="bg-primary text-primary-foreground">
                           <Bot className="w-4 h-4"/>
                       </AvatarFallback>
                   </Avatar>
              )}

              <Card
                className={`max-w-[85%] sm:max-w-[80%] p-3 sm:p-4 shadow-soft ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-none" // Style user bubble
                    : "bg-card text-card-foreground rounded-bl-none" // Style assistant bubble
                }`}
              >
                 {/* Render content safely */}
                <p className="text-sm sm:text-base whitespace-pre-wrap">{message.content}</p>
              </Card>

              {/* User Avatar */}
               {message.role === 'user' && (
                    <Avatar className="w-8 h-8 mb-1 flex-shrink-0">
                        <AvatarFallback className="bg-accent text-accent-foreground">
                           {farmerInitial}
                        </AvatarFallback>
                    </Avatar>
               )}
            </div>
          ))}
          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex justify-start items-end gap-2">
                 <Avatar className="w-8 h-8 mb-1 flex-shrink-0">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                        <Bot className="w-4 h-4"/>
                    </AvatarFallback>
                 </Avatar>
                <Card className="max-w-[80%] p-3 sm:p-4 bg-card rounded-bl-none shadow-soft">
                  <div className="flex gap-2 items-center">
                    <span className="text-sm text-muted-foreground italic mr-2">Thinking</span>
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-primary rounded-full animate-bounce" />
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-primary rounded-full animate-bounce delay-150" />
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-primary rounded-full animate-bounce delay-300" />
                  </div>
                </Card>
            </div>
          )}
          {/* Scroll anchor */}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      {/* Added flex-shrink-0 */}
      <div className="bg-card border-t shadow-soft p-3 sm:p-4 flex-shrink-0">
        <div className="container mx-auto max-w-4xl flex gap-2">
          <Input
            id="chat-input" // Added ID for focusing
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && !isLoading && handleSend()} // Prevent send while loading
            placeholder="Ask your question..."
            className="flex-1 h-12" // Increased height slightly
            disabled={isLoading}
            autoComplete="off"
          />
          <Button onClick={handleSend} disabled={isLoading || !input.trim()} size="icon" className="h-12 w-12 flex-shrink-0">
             {isLoading ? <Loader2 className="w-5 h-5 animate-spin"/> : <Send className="w-5 h-5" />}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Chatbot;